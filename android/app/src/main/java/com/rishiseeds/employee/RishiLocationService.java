package com.rishiseeds.employee;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
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
 *  • startForeground() called IMMEDIATELY in onStartCommand.
 *  • Location callbacks run on a dedicated HandlerThread — independent of WebView/main thread.
 *  • PARTIAL_WAKE_LOCK keeps CPU awake when screen is off.
 *  • Both GPS and NETWORK providers registered simultaneously.
 *  • START_STICKY ensures Android auto-restarts if killed.
 *  • Each ping includes batteryLevel, isCharging, and networkType.
 *  • IMPORTANCE_DEFAULT channel so the notification is always visible.
 */
public class RishiLocationService extends Service {

    public static final String CHANNEL_ID   = "rishi_gps_ch2";
    public static final int    NOTIF_ID     = 1001;
    public static final String ACTION_START = "com.rishiseeds.START_TRACKING";
    public static final String ACTION_STOP  = "com.rishiseeds.STOP_TRACKING";
    public static final String PREFS_NAME   = "rishi_gps_prefs";
    public static final String KEY_TOKEN    = "auth_token";
    public static final String KEY_URL      = "server_url";
    public static final String KEY_TRACKING = "is_tracking";

    private static final String TAG              = "RishiGPS";
    private static final long   MIN_INTERVAL_MS  = 15_000L;
    private static final float  MIN_DISTANCE_M   = 20f;
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

        locationThread = new HandlerThread("RishiGPS-thread");
        locationThread.start();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RishiSeeds:GPSWakeLock");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // ⚠ CRITICAL: call startForeground IMMEDIATELY
        promoteToForeground();

        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopTracking();
            stopSelf();
            return START_NOT_STICKY;
        }

        startTracking();
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

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
            ServiceCompat.startForeground(this, NOTIF_ID, notif,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIF_ID, notif);
        }
    }

    // ── Tracking ─────────────────────────────────────────────────────────────

    private void startTracking() {
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(WAKE_LOCK_MAX_MS);
        }

        SharedPreferences prefs = getPrefs();
        prefs.edit().putBoolean(KEY_TRACKING, true).apply();

        if (locationListener != null) return; // already listening

        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(@NonNull Location location) {
                long now = System.currentTimeMillis();
                if (now - lastPostedAt < MIN_INTERVAL_MS) return;
                lastPostedAt = now;

                String token   = prefs.getString(KEY_TOKEN, null);
                String baseUrl = prefs.getString(KEY_URL, "https://app.rishihybridseeds.com");
                if (token == null || token.isEmpty()) return;

                // Collect device telemetry
                int    batteryLevel = getBatteryLevel();
                boolean isCharging  = getIsCharging();
                String networkType  = getNetworkType();

                postLocation(location.getLatitude(), location.getLongitude(),
                        location.getAccuracy(), location.hasSpeed() ? location.getSpeed() : 0f,
                        batteryLevel, isCharging, networkType,
                        token, baseUrl);
            }

            @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
            @Override public void onProviderEnabled(@NonNull String provider) {}
            @Override public void onProviderDisabled(@NonNull String provider) {
                Log.w(TAG, "Provider disabled: " + provider + " — attempting re-register on NETWORK");
                // If GPS disabled try network fallback
                try {
                    if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                        Looper bg = locationThread != null ? locationThread.getLooper() : Looper.getMainLooper();
                        locationManager.requestLocationUpdates(
                                LocationManager.NETWORK_PROVIDER,
                                MIN_INTERVAL_MS, MIN_DISTANCE_M, locationListener, bg);
                    }
                } catch (SecurityException ignored) {}
            }
        };

        Looper bgLooper = locationThread != null
                ? locationThread.getLooper()
                : Looper.getMainLooper();

        try {
            boolean registered = false;
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        MIN_INTERVAL_MS, MIN_DISTANCE_M,
                        locationListener, bgLooper);
                registered = true;
                Log.i(TAG, "GPS provider registered on background thread");
            }
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

    // ── Device telemetry ─────────────────────────────────────────────────────

    private int getBatteryLevel() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent bat = registerReceiver(null, ifilter);
            if (bat == null) return -1;
            int level = bat.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = bat.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            if (level < 0 || scale <= 0) return -1;
            return Math.round(100f * level / scale);
        } catch (Exception e) {
            return -1;
        }
    }

    private boolean getIsCharging() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent bat = registerReceiver(null, ifilter);
            if (bat == null) return false;
            int status = bat.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            return status == BatteryManager.BATTERY_STATUS_CHARGING
                    || status == BatteryManager.BATTERY_STATUS_FULL;
        } catch (Exception e) {
            return false;
        }
    }

    private String getNetworkType() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return "unknown";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network net = cm.getActiveNetwork();
                if (net == null) return "none";
                NetworkCapabilities caps = cm.getNetworkCapabilities(net);
                if (caps == null) return "none";
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "wifi";
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                    // Determine cellular generation via TelephonyManager
                    return getCellularGeneration();
                }
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "ethernet";
                return "unknown";
            } else {
                android.net.NetworkInfo info = cm.getActiveNetworkInfo();
                if (info == null || !info.isConnected()) return "none";
                int type = info.getType();
                if (type == ConnectivityManager.TYPE_WIFI) return "wifi";
                if (type == ConnectivityManager.TYPE_MOBILE) return getCellularGeneration();
                return "unknown";
            }
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String getCellularGeneration() {
        try {
            android.telephony.TelephonyManager tm =
                    (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (tm == null) return "cellular";
            int nt = tm.getNetworkType();
            switch (nt) {
                case android.telephony.TelephonyManager.NETWORK_TYPE_GPRS:
                case android.telephony.TelephonyManager.NETWORK_TYPE_EDGE:
                case android.telephony.TelephonyManager.NETWORK_TYPE_CDMA:
                case android.telephony.TelephonyManager.NETWORK_TYPE_1xRTT:
                case android.telephony.TelephonyManager.NETWORK_TYPE_IDEN:
                    return "2g";
                case android.telephony.TelephonyManager.NETWORK_TYPE_UMTS:
                case android.telephony.TelephonyManager.NETWORK_TYPE_EVDO_0:
                case android.telephony.TelephonyManager.NETWORK_TYPE_EVDO_A:
                case android.telephony.TelephonyManager.NETWORK_TYPE_HSDPA:
                case android.telephony.TelephonyManager.NETWORK_TYPE_HSUPA:
                case android.telephony.TelephonyManager.NETWORK_TYPE_HSPA:
                case android.telephony.TelephonyManager.NETWORK_TYPE_EVDO_B:
                case android.telephony.TelephonyManager.NETWORK_TYPE_EHRPD:
                case android.telephony.TelephonyManager.NETWORK_TYPE_HSPAP:
                    return "3g";
                case android.telephony.TelephonyManager.NETWORK_TYPE_LTE:
                    return "4g";
                case android.telephony.TelephonyManager.NETWORK_TYPE_NR:
                    return "5g";
                default:
                    return "cellular";
            }
        } catch (Exception e) {
            return "cellular";
        }
    }

    // ── HTTP POST ─────────────────────────────────────────────────────────────

    private void postLocation(double lat, double lng, float accuracy, float speed,
                               int batteryLevel, boolean isCharging, String networkType,
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
                        + ",\"speed\":" + speed
                        + ",\"batteryLevel\":" + batteryLevel
                        + ",\"isCharging\":" + isCharging
                        + ",\"networkType\":\"" + networkType + "\"}";

                byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) { os.write(bytes); }

                int code = conn.getResponseCode();
                Log.d(TAG, "Posted location → HTTP " + code
                        + " [bat=" + batteryLevel + "% " + (isCharging ? "⚡" : "")
                        + " net=" + networkType + "]");
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
                .setOngoing(true)
                .setShowWhen(false)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(openPi)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Tracking", stopPi)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "GPS Tracking", NotificationManager.IMPORTANCE_DEFAULT);
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
