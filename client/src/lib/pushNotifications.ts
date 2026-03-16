import { getEmployeeToken } from "@/pages/EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    // Check existing subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) return true;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Get VAPID public key from server
    const keyRes = await fetch("/api/push/vapid-public-key");
    if (!keyRes.ok) return false;
    const { key } = await keyRes.json();

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    // Save to server
    const subJson = subscription.toJSON();
    const saveRes = await fetch("/api/employee/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders() },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      }),
    });

    return saveRes.ok;
  } catch (err) {
    console.warn("Push registration failed:", err);
    return false;
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await fetch("/api/employee/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getHeaders() },
      body: JSON.stringify({ endpoint }),
    });
  } catch (err) {
    console.warn("Push unregister failed:", err);
  }
}
