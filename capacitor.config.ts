import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rishiseeds.employee",
  appName: "Rishi Seeds Field App",
  webDir: "dist/public",

  server: {
    // ─── IMPORTANT ───────────────────────────────────────────────────────────
    // Set this to your deployed Replit URL after you publish the app.
    // Example: "https://rishi-seeds.replit.app"
    // This makes the native app load from the live server so all API calls
    // work automatically without any code changes.
    // ─────────────────────────────────────────────────────────────────────────
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["*.replit.app", "nominatim.openstreetmap.org"],
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    BackgroundGeolocation: {
      backgroundMessage:
        "Rishi Seeds is recording your trip location for expense reporting.",
      backgroundTitle: "GPS Tracking Active",
      requestPermissions: true,
      stale: false,
      distanceFilter: 30,
    },

    Geolocation: {
      permissions: {
        android: {
          ACCESS_COARSE_LOCATION: true,
          ACCESS_FINE_LOCATION: true,
          ACCESS_BACKGROUND_LOCATION: true,
        },
      },
    },

    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
