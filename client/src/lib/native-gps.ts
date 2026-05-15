/**
 * native-gps.ts
 *
 * Unified GPS service for Rishi Seeds Field App.
 *
 * On Android (Capacitor native):
 *   Uses RishiLocationService — a true Android foreground service written in
 *   Java that runs independently of the WebView, survives app close/kill,
 *   shows a persistent "GPS Tracking Active" notification, and restarts after
 *   device reboot. Auth token is stored in SharedPreferences so the service
 *   can POST GPS even when JavaScript is not running.
 *
 * On browser / WebView fallback:
 *   Uses navigator.geolocation.watchPosition with Wake Lock API.
 *
 * GPS STOP BUG FIX:
 *   On native Android, we never stop the foreground service from JS effect
 *   cleanup (which fires on every re-render / query refetch). Instead we use
 *   a module-level flag so the service only starts once per session, and only
 *   stops explicitly when the employee punches out.
 */

import { registerPlugin, Capacitor } from "@capacitor/core";

// ── Types ──────────────────────────────────────────────────────────────────

interface RishiLocationPlugin {
  startTracking(options: { token: string; serverUrl: string }): Promise<void>;
  stopTracking(): Promise<void>;
  isTracking(): Promise<{ value: boolean }>;
  saveToken(options: { token: string; serverUrl: string }): Promise<void>;
  requestBackgroundPermission(): Promise<{ granted: boolean }>;
  checkBackgroundPermission(): Promise<{ granted: boolean }>;
}

const RishiLocation = registerPlugin<RishiLocationPlugin>("RishiLocation");

export const isCapacitorNative: boolean = Capacitor.isNativePlatform();

export type GpsStatus = "idle" | "active" | "error";

export type GpsOptions = {
  authHeaders: Record<string, string>;
  throttleMs?: number;
  onStatus?: (s: GpsStatus) => void;
};

type StopFn = () => void;

// ── Module-level state ─────────────────────────────────────────────────────
// Prevents native foreground service from being started more than once, and
// prevents JS effect cleanup from killing the service on every re-render.
let nativeGpsRunning = false;

// ── Helpers ────────────────────────────────────────────────────────────────

function extractToken(authHeaders: Record<string, string>): string | null {
  const auth = authHeaders["Authorization"] || authHeaders["authorization"] || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

async function collectDeviceInfo(): Promise<{ batteryLevel: number | null; isCharging: boolean | null; networkType: string | null }> {
  let batteryLevel: number | null = null;
  let isCharging: boolean | null = null;
  let networkType: string | null = null;

  // Battery Status API (Chrome/Android WebView supported)
  try {
    const nav = navigator as any;
    if (nav.getBattery) {
      const batt = await nav.getBattery();
      batteryLevel = Math.round(batt.level * 100);
      isCharging = batt.charging;
    }
  } catch {}

  // Network Information API
  try {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const ect = conn.effectiveType; // slow-2g | 2g | 3g | 4g
      const type = conn.type;         // wifi | cellular | none | unknown | ...
      if (type === "wifi") networkType = "wifi";
      else if (ect) networkType = ect; // 4g, 3g, 2g, slow-2g
      else networkType = type || "unknown";
    }
  } catch {}

  return { batteryLevel, isCharging, networkType };
}

async function postLocation(
  payload: { latitude: number; longitude: number; accuracy: number | null; speed: number | null },
  authHeaders: Record<string, string>,
  onStatus: (s: GpsStatus) => void
) {
  try {
    const device = await collectDeviceInfo();
    const res = await fetch("/api/employee/location", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, ...device }),
    });
    onStatus(res.ok ? "active" : "error");
  } catch {
    onStatus("error");
  }
}

// ── Native (Capacitor Android) GPS ─────────────────────────────────────────
// Uses RishiLocationService — a Java foreground service that:
//   • Shows a persistent notification ("GPS Tracking Active")
//   • Survives app minimize AND app kill
//   • Restarts automatically on device reboot (BootReceiver)
//   • POSTs GPS directly via HttpURLConnection without needing JS
//
// KEY: nativeGpsRunning flag prevents duplicate starts AND prevents
// JS effect cleanup from killing the service on re-renders / query flaps.

async function startNativeBackgroundGps(opts: GpsOptions): Promise<StopFn> {
  const onStatus = opts.onStatus ?? (() => {});

  // If already running, return a no-op. The service continues independently.
  if (nativeGpsRunning) {
    onStatus("active");
    return () => {}; // no-op: don't stop on cleanup
  }

  // Also check with the native plugin in case app was restarted
  try {
    const { value: alreadyTracking } = await RishiLocation.isTracking();
    if (alreadyTracking) {
      nativeGpsRunning = true;
      onStatus("active");
      return () => {}; // no-op: service is self-managing
    }
  } catch {}

  const token = extractToken(opts.authHeaders);
  if (!token) {
    onStatus("error");
    console.warn("[RishiGPS] No auth token — cannot start native GPS");
    return () => {};
  }

  const serverUrl = window.location.origin.includes("localhost")
    ? "https://app.rishihybridseeds.com"
    : window.location.origin;

  try {
    await RishiLocation.startTracking({ token, serverUrl });
    nativeGpsRunning = true;
    onStatus("active");
    console.log("[RishiGPS] Native foreground service started");
  } catch (e) {
    console.error("[RishiGPS] Failed to start native service:", e);
    onStatus("error");
  }

  // Return a no-op for cleanup — native service is self-managing via START_STICKY.
  // Call stopGpsTracking() explicitly only on punch-out.
  return () => {};
}

// ── Web (browser / basic WebView) GPS ─────────────────────────────────────

function startWebGps(opts: GpsOptions): StopFn {
  const throttleMs = opts.throttleMs ?? 10000;
  const onStatus   = opts.onStatus ?? (() => {});
  let lastSentAt   = 0;
  let wakeLock: any = null;

  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await (navigator as any).wakeLock.request("screen");
      }
    } catch {}
  };
  acquireWakeLock();

  const sendPos = (pos: GeolocationPosition) => {
    const now = Date.now();
    if (now - lastSentAt >= throttleMs) {
      lastSentAt = now;
      postLocation(
        {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy ?? null,
          speed:     pos.coords.speed ?? null,
        },
        opts.authHeaders,
        onStatus
      );
    }
  };

  const watchId = navigator.geolocation.watchPosition(
    sendPos,
    () => onStatus("error"),
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
  );

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      acquireWakeLock();
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lastSentAt = Date.now();
          postLocation(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null, speed: pos.coords.speed ?? null },
            opts.authHeaders,
            onStatus
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    navigator.geolocation.clearWatch(watchId);
    document.removeEventListener("visibilitychange", onVisible);
    if (wakeLock) wakeLock.release().catch(() => {});
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Request all location permissions. Call once at app startup on native.
 */
export async function requestAllLocationPermissions(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
  } catch {}
  try {
    await RishiLocation.requestBackgroundPermission();
  } catch {}
}

/**
 * Save the auth token to native SharedPreferences so the foreground service
 * can continue posting GPS after the app is closed.
 */
export async function saveTokenToNative(token: string): Promise<void> {
  if (!isCapacitorNative) return;
  const serverUrl = "https://app.rishihybridseeds.com";
  try {
    await RishiLocation.saveToken({ token, serverUrl });
  } catch (e) {
    console.warn("[RishiGPS] saveToken failed:", e);
  }
}

/**
 * Start GPS tracking. Returns a stop function.
 *
 * On Android native: starts the Java foreground service (persistent, survives
 * app kill, shows notification). Cleanup is a no-op — call stopGpsTracking()
 * explicitly on punch-out instead.
 * On web: uses watchPosition fallback.
 */
export async function startGpsTracking(opts: GpsOptions): Promise<StopFn> {
  if (isCapacitorNative) {
    return startNativeBackgroundGps(opts);
  }
  if (!navigator.geolocation) {
    opts.onStatus?.("error");
    return () => {};
  }
  return startWebGps(opts);
}

/**
 * Explicitly stop GPS tracking. Call this on punch-out only.
 * On native: stops the foreground service and resets the running flag.
 */
export async function stopGpsTracking(): Promise<void> {
  if (isCapacitorNative) {
    try {
      await RishiLocation.stopTracking();
      nativeGpsRunning = false;
      console.log("[RishiGPS] Native foreground service stopped (punch-out)");
    } catch {}
  }
}
