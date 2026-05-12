package com.rishiseeds.employee

import android.app.*
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * RishiLocationService — a true Android foreground service for GPS tracking.
 *
 * Runs independently of the WebView / JavaScript bridge.
 * Survives app minimize AND app kill.
 * Shows a persistent "GPS Tracking Active" notification (TrackOlap-style).
 * Restarts automatically via BootReceiver after device reboot.
 */
class RishiLocationService : Service() {

    companion object {
        const val CHANNEL_ID   = "rishi_gps_channel"
        const val NOTIF_ID     = 1001
        const val ACTION_START = "com.rishiseeds.START_TRACKING"
        const val ACTION_STOP  = "com.rishiseeds.STOP_TRACKING"
        const val PREFS_NAME   = "rishi_gps_prefs"
        const val KEY_TOKEN    = "auth_token"
        const val KEY_URL      = "server_url"
        const val KEY_TRACKING = "is_tracking"

        private const val TAG = "RishiGPS"
        private const val MIN_INTERVAL_MS   = 15_000L  // 15 s
        private const val MIN_DISTANCE_M    = 20f       // 20 m
    }

    private lateinit var locationManager: LocationManager
    private var locationListener: LocationListener? = null
    private var lastPostedAt = 0L

    // ── Lifecycle ────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        locationManager = getSystemService(LOCATION_SERVICE) as LocationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopTracking()
            stopSelf()
            return START_NOT_STICKY
        }
        startTracking()
        return START_STICKY   // Android restarts this service if it's killed
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopTracking()
        super.onDestroy()
    }

    // ── Tracking ─────────────────────────────────────────────────────────────

    private fun startTracking() {
        startForeground(NOTIF_ID, buildNotification())

        val prefs = getPrefs()
        prefs.edit().putBoolean(KEY_TRACKING, true).apply()

        if (locationListener != null) return   // already listening

        locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                val now = System.currentTimeMillis()
                if (now - lastPostedAt < MIN_INTERVAL_MS) return
                lastPostedAt = now

                val token = prefs.getString(KEY_TOKEN, null) ?: return
                val url   = prefs.getString(KEY_URL, "https://app.rishihybridseeds.com") ?: return
                postLocation(location.latitude, location.longitude,
                    location.accuracy, location.speed, token, url)
            }
            @Deprecated("Deprecated in Java") override fun onStatusChanged(p: String?, s: Int, e: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }

        try {
            // Prefer GPS_PROVIDER; fall back to NETWORK_PROVIDER
            val provider = when {
                locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)     -> LocationManager.GPS_PROVIDER
                locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
                else -> null
            }
            if (provider != null) {
                locationManager.requestLocationUpdates(
                    provider, MIN_INTERVAL_MS, MIN_DISTANCE_M,
                    locationListener!!, Looper.getMainLooper()
                )
                Log.i(TAG, "Location updates started on $provider")
            } else {
                Log.w(TAG, "No location provider available")
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission denied", e)
        }
    }

    private fun stopTracking() {
        locationListener?.let { locationManager.removeUpdates(it) }
        locationListener = null
        getPrefs().edit().putBoolean(KEY_TRACKING, false).apply()
        Log.i(TAG, "Location updates stopped")
    }

    // ── HTTP ─────────────────────────────────────────────────────────────────

    private fun postLocation(
        lat: Double, lng: Double, accuracy: Float, speed: Float,
        token: String, baseUrl: String
    ) {
        thread(name = "RishiGPS-post") {
            try {
                val conn = URL("$baseUrl/api/employee/location")
                    .openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput   = true
                conn.connectTimeout = 12_000
                conn.readTimeout    = 12_000

                val body = """{"latitude":$lat,"longitude":$lng,"accuracy":$accuracy,"speed":$speed}"""
                OutputStreamWriter(conn.outputStream, "UTF-8").use { it.write(body) }

                val code = conn.responseCode
                conn.disconnect()
                Log.d(TAG, "Posted location → HTTP $code")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to post location: ${e.message}")
            }
        }
    }

    // ── Notification ─────────────────────────────────────────────────────────

    private fun buildNotification(): Notification {
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)
            ?.apply { flags = Intent.FLAG_ACTIVITY_SINGLE_TOP }
        val openPi = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, RishiLocationService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPi = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
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
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when Rishi Seeds is recording your location"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            (getSystemService(NotificationManager::class.java))
                .createNotificationChannel(channel)
        }
    }

    private fun getPrefs() =
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
