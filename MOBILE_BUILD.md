# Rishi Seeds Field App — Android Build Guide

This guide walks you through converting the Rishi Seeds employee portal into a
real Android APK using Capacitor. All existing features (GPS tracking, punch-in/out,
expenses, visit logs) work identically — the native wrapper adds true **background
GPS** that keeps sending location even when the phone screen is off or the app is
minimized.

---

## Prerequisites (install once on your PC)

| Tool | Download |
|------|----------|
| Node.js 18+ | https://nodejs.org |
| Android Studio | https://developer.android.com/studio |
| Java 17 (bundled with Android Studio) | — |
| Git | https://git-scm.com |

In Android Studio, open **SDK Manager** and install:
- Android SDK Platform 34 (Android 14)
- Android SDK Build-Tools 34
- Android Emulator (optional, for testing)

Set environment variables (Windows example):
```
ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr
```
Add to PATH: `%ANDROID_HOME%\tools`, `%ANDROID_HOME%\platform-tools`

---

## Step 1 — Deploy the backend to Replit

The app needs a live server URL so API calls work from the phone.

1. In Replit, click **Deploy** → **Autoscale** → **Deploy**
2. Copy the URL — it looks like `https://rishi-seeds.replit.app`

---

## Step 2 — Clone the project to your PC

```bash
git clone <your-replit-git-url>
cd rishi-seeds
npm install
```

---

## Step 3 — Configure the server URL

Open `capacitor.config.ts` and set your deployed URL:

```typescript
server: {
  url: "https://rishi-seeds.replit.app",   // ← your actual Replit URL
  androidScheme: "https",
},
```

Or set it as an environment variable before building:
```bash
export CAPACITOR_SERVER_URL=https://rishi-seeds.replit.app
```

---

## Step 4 — Build the web frontend

```bash
npm run build
```

This creates `dist/public/` — the static files Capacitor bundles into the APK.

> **Note:** When using `server.url`, Capacitor loads the app from the live URL
> instead of the bundled files, so this step is optional. But always run it
> at least once to initialise the `dist/public/` folder.

---

## Step 5 — Add the Android platform (first time only)

```bash
npx cap add android
npx cap sync
```

---

## Step 6 — Grant required permissions

Open `android/app/src/main/AndroidManifest.xml` and verify these are present
(Capacitor adds most automatically, but double-check):

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

Inside the `<application>` tag, add the foreground service:

```xml
<service
    android:name="com.capacitorjs.community.plugin.backgroundgeolocation.BackgroundGeolocationService"
    android:foregroundServiceType="location"
    android:exported="false" />
```

---

## Step 7 — Sync and open in Android Studio

```bash
npx cap sync android
npx cap open android
```

Android Studio opens the project. Let Gradle finish syncing (may take a few minutes).

---

## Step 8 — Build and install

### Option A — Debug APK (for testing)

In Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**

The APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

Transfer to the phone via USB or WhatsApp and install.

### Option B — Release APK (for distribution)

1. **Build → Generate Signed Bundle/APK → APK**
2. Create or choose a keystore file
3. Select **release** build variant
4. The signed APK will be at:
   `android/app/build/outputs/apk/release/app-release.apk`

---

## Step 9 — Enable "Allow all the time" location on the phone

After installing the APK, Android will ask for location permission. For background
GPS to work:

1. Go to **Settings → Apps → Rishi Seeds Field App → Permissions → Location**
2. Select **"Allow all the time"** (not just "While using the app")

This enables the native foreground service that keeps GPS running 24/7 during a trip.

---

## Updating the app

Whenever you change the backend code, just re-deploy to Replit — the app auto-loads
the latest version since it reads from the live URL.

For frontend code changes:
```bash
npm run build
npx cap sync android
# Then rebuild in Android Studio
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ANDROID_HOME not set` | Set the env variable pointing to your Android SDK |
| Gradle sync fails | In Android Studio → File → Invalidate Caches → Restart |
| App shows blank screen | Check the `server.url` in capacitor.config.ts matches your deployed URL |
| GPS not working in background | Make sure Location is set to "Allow all the time" in phone settings |
| API calls fail | Verify the deployed Replit URL is reachable; check CORS config |
| Camera not working | Accept camera permission when the app asks, or grant in Settings |
