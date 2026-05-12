package com.rishiseeds.employee;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * RishiLocationService — native Android foreground service for GPS tracking.
 *
 * Runs independently of the WebView / JS bridge.
 * Survives app minimize AND app kill (START_STICKY).
 * Shows a persistent "GPS Tracking Active" notification.
 * Restarts after device reboot via BootReceiver.
 */
public class RishiLocationService extends Service {

    public static final String CHANNEL_ID   = "rishi_gps_channel";
    public static final int    NOTIF_ID     = 1001;
    public static final String ACTION_START = "com.rishiseeds.START_TRACKING";
    public static final String ACTION_STOP  = "com.rishiseeds.STOP_TRACKING";
    public static final String PREFS_NAME   = "rishi_gps_prefs";
    public static final String KEY_TOKEN    = "auth_token";
    public static final String KEY_URL      = "server_url";
    public static final String KEY_TRACKING = "is_tracking";

    private static final String TAG            = "RishiGPS";
    private static final long   MIN_INTERVAL_MS = 15_000L;
    private static final float  MIN_DISTANCE_M  = 20f;

    private LocationManager  locationManager;
    private LocationListener locationListener;
    private long lastPostedAt = 0;

    // ── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopTracking();
            stopSelf();
            return START_NOT_STICKY;
        }
        startTracking();
        return START_STICKY;   // Android restarts this service automatically if killed
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopTracking();
        super.onDestroy();
    }

    // ── Tracking ─────────────────────────────────────────────────────────────

    private void startTracking() {
        startForeground(NOTIF_ID, buildNotification());

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
                String url   = prefs.getString(KEY_URL, "https://app.rishihybridseeds.com");
                if (token == null) return;
                postLocation(location.getLatitude(), location.getLongitude(),
                        location.getAccuracy(), location.getSpeed(), token, url);
            }

            @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
            @Override public void onProviderEnabled(@NonNull String provider) {}
            @Override public void onProviderDisabled(@NonNull String provider) {}
        };

        try {
            String provider = null;
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                provider = LocationManager.GPS_PROVIDER;
            } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                provider = LocationManager.NETWORK_PROVIDER;
            }
            if (provider != null) {
                locationManager.requestLocationUpdates(
                        provider, MIN_INTERVAL_MS, MIN_DISTANCE_M,
                        locationListener, Looper.getMainLooper());
                Log.i(TAG, "Location updates started on " + provider);
            } else {
                Log.w(TAG, "No location provider available");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied", e);
        }
    }

    private void stopTracking() {
        if (locationListener != null) {
            locationManager.removeUpdates(locationListener);
            locationListener = null;
        }
        getPrefs().edit().putBoolean(KEY_TRACKING, false).apply();
        Log.i(TAG, "Location updates stopped");
    }

    // ── HTTP ─────────────────────────────────────────────────────────────────

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

                String body = "{\"latitude\":" + lat + ",\"longitude\":" + lng
                        + ",\"accuracy\":" + accuracy + ",\"speed\":" + speed + "}";
                byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(bytes);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Posted location → HTTP " + code);
            } catch (IOException e) {
                Log.e(TAG, "Failed to post location: " + e.getMessage());
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
                this, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, RishiLocationService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
                this, 1, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("GPS Tracking Active")
                .setContentText("Rishi Seeds is recording your location for trip management.")
                .setSubText("Tap to open app")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .setShowWhen(false)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setContentIntent(openPi)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Tracking", stopPi)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "GPS Tracking", NotificationManager.IMPORTANCE_LOW);
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
