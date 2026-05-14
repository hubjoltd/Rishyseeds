package com.rishiseeds.employee;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * RishiLocationService — native Android foreground service for GPS tracking.
 *
 * Key design points:
 *  • startForeground() called IMMEDIATELY in onStartCommand so Android never
 *    kills the service for being too slow to promote (ANR / Android 8+ crash).
 *  • Location callbacks run on a dedicated HandlerThread — completely independent
 *    of the WebView / main thread.  Survives app minimize AND app kill.
 *  • PARTIAL_WAKE_LOCK keeps the CPU awake so the location thread is never
 *    suspended while the screen is off.
 *  • Both GPS and NETWORK providers are registered simultaneously for coverage.
 *  • START_STICKY ensures Android auto-restarts the service if it gets killed.
 *  • IMPORTANCE_DEFAULT channel so the notification is always visible.
 */
public class RishiLocationService extends Service {

    public static final String CHANNEL_ID   = "rishi_gps_ch2";   // v2 to force channel recreation
    public static final int    NOTIF_ID     = 1001;
    public static final String ACTION_START = "com.rishiseeds.START_TRACKING";
    public static final String ACTION_STOP  = "com.rishiseeds.STOP_TRACKING";
    public static final String PREFS_NAME   = "rishi_gps_prefs";
    public static final String KEY_TOKEN    = "auth_token";
    public static final String KEY_URL      = "server_url";
    public static final String KEY_TRACKING = "is_tracking";

    private static final String TAG             = "RishiGPS";
    private static final long   MIN_INTERVAL_MS = 15_000L;
    private static final float  MIN_DISTANCE_M  = 20f;
    private static final long   WAKE_LOCK_MAX_MS = 10L * 60 * 60 * 1000; // 10 hours

    private LocationManager          locationManager;
    private LocationListener         locationListener;
    private HandlerThread            locationThread;
    private PowerManager.WakeLock    wakeLock;
    private long                     lastPostedAt = 0;

    // ── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);

        // Dedicated background thread — location callbacks never touch the main/WebView thread
        locationThread = new HandlerThread("RishiGPS-thread");
        locationThread.start();

        // CPU WakeLock: keeps CPU running even when screen is off
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RishiSeeds:GPSWakeLock");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // ⚠ CRITICAL: call startForeground IMMEDIATELY — before any other work.
        // Android 8+ will ANR-kill the service if we wait too long.
        promoteToForeground();

        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopTracking();
            stopSelf();
            return START_NOT_STICKY;
        }

        startTracking();
        return START_STICKY;  // Android restarts this service automatically if killed
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopTracking();
        if (locationThread != null) {
            locationThread.quitSafely();
            locationThread = null;
        }
        super.onDestroy();
    }

    // ── Foreground promotion ──────────────────────────────────────────────────

    private void promoteToForeground() {
        Notification notif = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // API 29+ — specify foreground service type explicitly
            ServiceCompat.startForeground(this, NOTIF_ID, notif,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIF_ID, notif);
        }
    }

    // ── Tracking ─────────────────────────────────────────────────────────────

    private void startTracking() {
        // Acquire WakeLock so CPU stays alive when screen turns off
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(WAKE_LOCK_MAX_MS);
        }

        SharedPreferences prefs = getPrefs();
        prefs.edit().putBoolean(KEY_TRACKING, true).apply();

        if (locationListener != null) return;  // already listening

        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(@NonNull Location location) {
                long now = System.currentTimeMillis();
                if (now - lastPostedAt < MIN_INTERVAL_MS) return;
                lastPostedAt = now;

                String token = prefs.getString(KEY_TOKEN, null);
                String baseUrl = prefs.getString(KEY_URL, "https://app.rishihybridseeds.com");
                if (token == null || token.isEmpty()) return;

                postLocation(location.getLatitude(), location.getLongitude(),
                        location.getAccuracy(), location.getSpeed(), token, baseUrl);
            }

            @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
            @Override public void onProviderEnabled(@NonNull String provider) {}
            @Override public void onProviderDisabled(@NonNull String provider) {}
        };

        // Use the dedicated background thread looper — NEVER the main looper
        Looper bgLooper = locationThread != null
                ? locationThread.getLooper()
                : Looper.getMainLooper();

        try {
            boolean registered = false;

            // Register on GPS provider (precise, outdoor)
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        MIN_INTERVAL_MS, MIN_DISTANCE_M,
                        locationListener, bgLooper);
                registered = true;
                Log.i(TAG, "GPS provider registered on background thread");
            }

            // Also register on NETWORK provider (fast indoor fix, low battery)
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        MIN_INTERVAL_MS, MIN_DISTANCE_M,
                        locationListener, bgLooper);
                registered = true;
                Log.i(TAG, "NETWORK provider registered on background thread");
            }

            if (!registered) {
                Log.w(TAG, "No location provider available — will retry on next start");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied: " + e.getMessage());
        }
    }

    private void stopTracking() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        if (locationListener != null) {
            try { locationManager.removeUpdates(locationListener); }
            catch (Exception e) { Log.e(TAG, "removeUpdates error: " + e.getMessage()); }
            locationListener = null;
        }
        getPrefs().edit().putBoolean(KEY_TRACKING, false).apply();
        Log.i(TAG, "Location tracking stopped");
    }

    // ── HTTP POST ─────────────────────────────────────────────────────────────

    private void postLocation(double lat, double lng, float accuracy, float speed,
                               String token, String baseUrl) {
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(baseUrl + "/api/employee/location");
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setDoOutput(true);
                conn.setConnectTimeout(12_000);
                conn.setReadTimeout(12_000);

                String body = "{\"latitude\":" + lat
                        + ",\"longitude\":" + lng
                        + ",\"accuracy\":" + accuracy
                        + ",\"speed\":" + speed + "}";
                byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(bytes);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Posted location → HTTP " + code);
            } catch (IOException e) {
                Log.w(TAG, "POST failed: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        }, "RishiGPS-post").start();
    }

    // ── Notification ─────────────────────────────────────────────────────────

    private Notification buildNotification() {
        Intent openIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (openIntent != null) openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPi = PendingIntent.getActivity(
                this, 0,
                openIntent != null ? openIntent : new Intent(),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, RishiLocationService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
                this, 1, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("📍 GPS Tracking Active")
                .setContentText("Location is being recorded for your shift")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)           // cannot be dismissed by user
                .setShowWhen(false)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // show on lock screen
                .setContentIntent(openPi)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Tracking", stopPi)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Use IMPORTANCE_DEFAULT so the notification is always visible in the tray
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "GPS Tracking",
                    NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Shows when Rishi Seeds is recording your location");
            channel.setShowBadge(false);
            channel.enableVibration(false);
            channel.setSound(null, null);
            NotificationManager mgr = getSystemService(NotificationManager.class);
            if (mgr != null) mgr.createNotificationChannel(channel);
        }
    }

    private SharedPreferences getPrefs() {
        return getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
