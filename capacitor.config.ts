import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rishiseeds.employee",
  appName: "Rishi Seeds Field App",
  webDir: "dist/public",

  server: {
    url: "https://app.rishihybridseeds.com/employee-login",
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["app.rishihybridseeds.com", "nominatim.openstreetmap.org"],
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
    },

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
