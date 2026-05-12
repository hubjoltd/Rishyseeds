package com.rishiseeds.employee

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BootReceiver — restarts GPS tracking after the device reboots,
 * so employees don't need to re-open the app for location to resume.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences(
            RishiLocationService.PREFS_NAME, Context.MODE_PRIVATE
        )
        val wasTracking = prefs.getBoolean(RishiLocationService.KEY_TRACKING, false)
        val token       = prefs.getString(RishiLocationService.KEY_TOKEN, null)

        if (wasTracking && !token.isNullOrBlank()) {
            Log.i("RishiGPS", "Boot detected — restarting GPS tracking")
            val serviceIntent = Intent(context, RishiLocationService::class.java).apply {
                action = RishiLocationService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}
