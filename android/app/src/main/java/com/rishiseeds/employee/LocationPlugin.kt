package com.rishiseeds.employee

import android.content.Context
import android.content.Intent
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * LocationPlugin — Capacitor bridge so JavaScript can start/stop the
 * RishiLocationService foreground service and save the auth token to
 * SharedPreferences (so the service can post GPS even when JS is dead).
 *
 * JS usage:
 *   const RishiLocation = registerPlugin("RishiLocation");
 *   await RishiLocation.startTracking({ token: "...", serverUrl: "https://..." });
 *   await RishiLocation.stopTracking();
 *   const { value } = await RishiLocation.isTracking();
 */
@CapacitorPlugin(name = "RishiLocation")
class LocationPlugin : Plugin() {

    @PluginMethod
    fun startTracking(call: PluginCall) {
        val token     = call.getString("token")     ?: run { call.reject("token required"); return }
        val serverUrl = call.getString("serverUrl") ?: "https://app.rishihybridseeds.com"

        savePrefs(token, serverUrl)

        val intent = Intent(context, RishiLocationService::class.java).apply {
            action = RishiLocationService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun stopTracking(call: PluginCall) {
        val intent = Intent(context, RishiLocationService::class.java).apply {
            action = RishiLocationService.ACTION_STOP
        }
        context.startService(intent)
        getPrefs().edit().putBoolean(RishiLocationService.KEY_TRACKING, false).apply()
        call.resolve()
    }

    @PluginMethod
    fun isTracking(call: PluginCall) {
        val tracking = getPrefs().getBoolean(RishiLocationService.KEY_TRACKING, false)
        call.resolve(JSObject().put("value", tracking))
    }

    /** Save auth token + server URL so the native service can POST without JS. */
    @PluginMethod
    fun saveToken(call: PluginCall) {
        val token     = call.getString("token")     ?: run { call.reject("token required"); return }
        val serverUrl = call.getString("serverUrl") ?: "https://app.rishihybridseeds.com"
        savePrefs(token, serverUrl)
        call.resolve()
    }

    private fun savePrefs(token: String, serverUrl: String) {
        getPrefs().edit()
            .putString(RishiLocationService.KEY_TOKEN, token)
            .putString(RishiLocationService.KEY_URL, serverUrl)
            .apply()
    }

    private fun getPrefs() =
        context.getSharedPreferences(RishiLocationService.PREFS_NAME, Context.MODE_PRIVATE)
}
