package com.rishiseeds.employee;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

/**
 * BootReceiver — restarts GPS tracking after device reboot so employees
 * don't need to re-open the app for location to resume.
 *
 * Handles both ACTION_BOOT_COMPLETED (normal boot) and
 * ACTION_LOCKED_BOOT_COMPLETED (direct-boot mode, Android 7+) so the
 * service restarts even on encrypted devices before the user unlocks.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !"android.intent.action.LOCKED_BOOT_COMPLETED".equals(action)) {
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences(
                RishiLocationService.PREFS_NAME, Context.MODE_PRIVATE);

        boolean wasTracking = prefs.getBoolean(RishiLocationService.KEY_TRACKING, false);
        String  token       = prefs.getString(RishiLocationService.KEY_TOKEN, null);

        if (wasTracking && token != null && !token.isEmpty()) {
            Log.i("RishiGPS", "Boot detected (" + action + ") — restarting GPS tracking");
            Intent serviceIntent = new Intent(context, RishiLocationService.class);
            serviceIntent.setAction(RishiLocationService.ACTION_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } else {
            Log.i("RishiGPS", "Boot detected but tracking was off — not restarting");
        }
    }
}
