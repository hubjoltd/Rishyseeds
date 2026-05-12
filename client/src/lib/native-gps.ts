/**
 * native-gps.ts
 *
 * Unified GPS service for Rishi Seeds Field App.
 *
 * On Android (Capacitor native):
 *   Uses RishiLocationService — a true Android foreground service written in
 *   Kotlin that runs independently of the WebView, survives app close/kill,
 *   shows a persistent "GPS Tracking Active" notification, and restarts after
 *   device reboot. Auth token is stored in SharedPreferences so the service
 *   can POST GPS even when JavaScript is not running.
 *
 * On browser / WebView fallback:
 *   Uses navigator.geolocation.watchPosition with Wake Lock API.
 */

import { registerPlugin, Capacitor } from "@capacitor/core";

// ── Types ──────────────────────────────────────────────────────────────────

interface RishiLocationPlugin {
  startTracking(options: { token: string; serverUrl: string }): Promise<void>;
  stopTracking(): Promise<void>;
  isTracking(): Promise<{ value: boolean }>;
  saveToken(options: { token: string; serverUrl: string }): Promise<void>;
}

// Bridge to the native Kotlin LocationPlugin registered in MainActivity
const RishiLocation = registerPlugin<RishiLocationPlugin>("RishiLocation");

export const isCapacitorNative: boolean = Capacitor.isNativePlatform();

export type GpsStatus = "idle" | "active" | "error";

export type GpsOptions = {
  authHeaders: Record<string, string>;
  throttleMs?: number;
  onStatus?: (s: GpsStatus) => void;
};

type StopFn = () => void;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract Bearer token string from auth headers */
function extractToken(authHeaders: Record<string, string>): string | null {
  const auth = authHeaders["Authorization"] || authHeaders["authorization"] || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

async function postLocation(
  payload: { latitude: number; longitude: number; accuracy: number | null; speed: number | null },
  authHeaders: Record<string, string>,
  onStatus: (s: GpsStatus) => void
) {
  try {
    const res = await fetch("/api/employee/location", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    onStatus(res.ok ? "active" : "error");
  } catch {
    onStatus("error");
  }
}

// ── Native (Capacitor Android) GPS ─────────────────────────────────────────
// Uses RishiLocationService — a Kotlin foreground service that:
//   • Shows a persistent notification ("GPS Tracking Active")
//   • Survives app minimize AND app kill
//   • Restarts automatically on device reboot
//   • POSTs GPS directly via HttpURLConnection without needing JS

async function startNativeBackgroundGps(opts: GpsOptions): Promise<StopFn> {
  const onStatus = opts.onStatus ?? (() => {});

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
    onStatus("active");
    console.log("[RishiGPS] Native foreground service started");
  } catch (e) {
    console.error("[RishiGPS] Failed to start native service:", e);
    onStatus("error");
  }

  return async () => {
    try {
      await RishiLocation.stopTracking();
      console.log("[RishiGPS] Native foreground service stopped");
    } catch {}
  };
}

// ── Web (browser / basic WebView) GPS ─────────────────────────────────────

function startWebGps(opts: GpsOptions): StopFn {
  const throttleMs = opts.throttleMs ?? 15000;
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
        (pos) => { lastSentAt = Date.now(); postLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null, speed: pos.coords.speed ?? null }, opts.authHeaders, onStatus); },
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
}

/**
 * Save the auth token to native SharedPreferences so the foreground service
 * can continue posting GPS after the app is closed. Call this right after login.
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
 * On Android native: starts the Kotlin foreground service (persistent, survives
 * app kill, shows notification). On web: uses watchPosition fallback.
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
