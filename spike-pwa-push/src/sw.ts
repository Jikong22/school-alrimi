/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
});

// --- Push event handler ---
self.addEventListener("push", (event: PushEvent) => {
  const payload = event.data?.json() ?? {
    title: "학교 알리미",
    body: "새 알림이 도착했습니다.",
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: payload.data ?? {},
      vibrate: [100, 50, 100],
      tag: payload.tag ?? "default",
    }),
  );
});

// --- Notification click handler ---
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    }),
  );
});

// --- pushsubscriptionchange handler ---
// Fired when subscription is refreshed by the browser or invalidated.
// MUST resubscribe and send the new endpoint to the server.
self.addEventListener("pushsubscriptionchange", (event: Event) => {
  const pushEvent = event as PushSubscriptionChangeEvent;
  const oldSubscription = pushEvent.oldSubscription;
  const newSubscription = pushEvent.newSubscription;

  event.waitUntil(
    (async () => {
      // If no new subscription provided, try to resubscribe
      const subscription =
        newSubscription ??
        (await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          // In production, use the VAPID key from server config
          applicationServerKey: self.__SW_MANIFEST
            ? undefined
            : undefined,
        }));

      // Send new subscription to server, remove old one
      await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldEndpoint: oldSubscription?.endpoint,
          newEndpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey("p256dh")
              ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!)))
              : undefined,
            auth: subscription.getKey("auth")
              ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!)))
              : undefined,
          },
        }),
      });
    })(),
  );
});

serwist.addEventListeners();