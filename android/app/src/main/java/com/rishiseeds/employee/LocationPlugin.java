package com.rishiseeds.employee;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * LocationPlugin — Capacitor bridge so JavaScript can start/stop the
 * RishiLocationService foreground service and persist the auth token to
 * SharedPreferences so the service can POST GPS even when JS is dead.
 *
 * JS usage (via registerPlugin):
 *   const RishiLocation = registerPlugin("RishiLocation");
 *   await RishiLocation.startTracking({ token: "...", serverUrl: "https://..." });
 *   await RishiLocation.stopTracking();
 *   const { value } = await RishiLocation.isTracking();
 */
@CapacitorPlugin(name = "RishiLocation")
public class LocationPlugin extends Plugin {

    @PluginMethod
    public void startTracking(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) {
            call.reject("token is required");
            return;
        }
        String serverUrl = call.getString("serverUrl");
        if (serverUrl == null || serverUrl.isEmpty()) {
            serverUrl = "https://app.rishihybridseeds.com";
        }

        savePrefs(token, serverUrl);

        Intent intent = new Intent(getContext(), RishiLocationService.class);
        intent.setAction(RishiLocationService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Intent intent = new Intent(getContext(), RishiLocationService.class);
        intent.setAction(RishiLocationService.ACTION_STOP);
        getContext().startService(intent);
        getPrefs().edit().putBoolean(RishiLocationService.KEY_TRACKING, false).apply();
        call.resolve();
    }

    @PluginMethod
    public void isTracking(PluginCall call) {
        boolean tracking = getPrefs().getBoolean(RishiLocationService.KEY_TRACKING, false);
        JSObject result = new JSObject();
        result.put("value", tracking);
        call.resolve(result);
    }

    @PluginMethod
    public void saveToken(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) {
            call.reject("token is required");
            return;
        }
        String serverUrl = call.getString("serverUrl");
        if (serverUrl == null || serverUrl.isEmpty()) {
            serverUrl = "https://app.rishihybridseeds.com";
        }
        savePrefs(token, serverUrl);
        call.resolve();
    }

    private void savePrefs(String token, String serverUrl) {
        getPrefs().edit()
                .putString(RishiLocationService.KEY_TOKEN, token)
                .putString(RishiLocationService.KEY_URL, serverUrl)
                .apply();
    }

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(
                RishiLocationService.PREFS_NAME, Context.MODE_PRIVATE);
    }
}
