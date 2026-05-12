/**
 * native-gps.ts
 *
 * Unified GPS service for Rishi Seeds Field App.
 *
 * - On Android (Capacitor native): uses the BackgroundGeolocation plugin via
 *   Capacitor's registerPlugin() bridge. The plugin code runs natively and
 *   keeps tracking even when the app is minimized or the screen is off.
 *
 * - On browser / WebView fallback: uses navigator.geolocation.watchPosition
 *   with Wake Lock API to keep the screen alive.
 *
 * The @capacitor-community/background-geolocation npm package is NOT imported
 * here because it has no ESM/CJS exports for web bundlers. Instead we use
 * registerPlugin() from @capacitor/core to call the already-installed native
 * plugin through Capacitor's JS bridge.
 */

import { registerPlugin, Capacitor } from "@capacitor/core";

// ── Types ──────────────────────────────────────────────────────────────────

interface BgLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  bearing?: number | null;
  altitude?: number | null;
}

interface BgGeoError {
  code: string;
  message: string;
}

interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundMessage: string;
      backgroundTitle: string;
      requestPermissions: boolean;
      stale: boolean;
      distanceFilter: number;
    },
    callback: (location: BgLocation | null, error: BgGeoError | null) => void
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
}

// Register the native plugin by name (the native Android/iOS code registers
// itself into Capacitor at app start; this just gives us a typed handle to it)
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);

// ── Helpers ────────────────────────────────────────────────────────────────

export const isCapacitorNative: boolean = Capacitor.isNativePlatform();

export type GpsStatus = "idle" | "active" | "error";

export type GpsOptions = {
  authHeaders: Record<string, string>;
  throttleMs?: number;
  onStatus?: (s: GpsStatus) => void;
};

type StopFn = () => void;

async function postLocation(
  payload: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
  },
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

// ── Native (Capacitor) GPS ─────────────────────────────────────────────────

async function startNativeBackgroundGps(opts: GpsOptions): Promise<StopFn> {
  const throttleMs = opts.throttleMs ?? 30000;
  const onStatus = opts.onStatus ?? (() => {});
  let lastSentAt = 0;

  const watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundMessage:
        "Rishi Seeds is recording your location for trip management.",
      backgroundTitle: "GPS Tracking Active",
      requestPermissions: true,
      stale: false,
      distanceFilter: 30,
    },
    (location, error) => {
      if (error || !location) {
        onStatus("error");
        return;
      }
      const now = Date.now();
      if (now - lastSentAt >= throttleMs) {
        lastSentAt = now;
        postLocation(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy ?? null,
            speed: location.speed ?? null,
          },
          opts.authHeaders,
          onStatus
        );
      }
    }
  );

  return () => {
    BackgroundGeolocation.removeWatcher({ id: watcherId }).catch(() => {});
  };
}

// ── Web (browser / basic WebView) GPS ────────────────────────────────────

function startWebGps(opts: GpsOptions): StopFn {
  const throttleMs = opts.throttleMs ?? 30000;
  const onStatus = opts.onStatus ?? (() => {});
  let lastSentAt = 0;
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
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          speed: pos.coords.speed ?? null,
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
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? null,
              speed: pos.coords.speed ?? null,
            },
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

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Start GPS tracking. Returns a stop function.
 *
 * Automatically uses native Capacitor background GPS when running as a native
 * Android/iOS app, and falls back to the web geolocation API otherwise.
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
