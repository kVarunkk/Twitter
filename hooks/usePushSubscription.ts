"use client";

import { useEffect } from "react";

export function usePushSubscription() {
  useEffect(() => {
    const registerPush = async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      )
        return;

      // Unregister old service workers on hostname mismatch
      if (
        location.hostname === "localhost" &&
        location.origin !== "http://localhost:3000"
      ) {
        await clearOldServiceWorkers();
        return;
      }

      const alreadySubscribed = localStorage.getItem("isPushSubscribed");
      if (alreadySubscribed === "true") return;

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.register("/sw.js");

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });

        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });

        if (res.ok) {
          localStorage.setItem("isPushSubscribed", "true");
        }
      } catch (err) {
        console.error("Push subscription failed", err);
      }
    };

    registerPush();
  }, []);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function clearOldServiceWorkers() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }
}
