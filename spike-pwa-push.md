# Spike: PWA + Push Notification (Task 2)

> **Status**: ✅ Validated
> **Date**: 2026-06-12
> **Directory**: `spike-pwa-push/`

## Summary

Validated that @serwist/next (configurator mode) + web-push + UA detection works for the school-alrimi PWA push notification pipeline. KakaoTalk and Naver in-app browsers are reliably detected and blocked from push subscription (no SW support). Samsung Internet and iOS Safari have documented limitations.

---

## 1. VAPID Key Generation

Generated using `web-push.generateVAPIDKeys()`:

```
Public Key:  BDZ6YHnQZC6i0P-c7PjOgLgbPhbeOaWk2IVQh6D67e4Z4lJT0KAC0zkGrU5Kv4IIlVErs4OEQEWavrFOhVwoBsQ
Private Key: uqOeMApikscLcZS1BWbKZHLLodWiRURLrIRmbqnOxaA
```

> ⚠️ These are spike keys. **Regenerate for production** and store the private key in a secrets manager (never in VCS).

### Production key management

- Store `VAPID_PUBLIC_KEY` in `.env.local` (Next.js) and expose via `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Store `VAPID_PRIVATE_KEY` in server-side env only (Supabase Edge Function secrets or Vercel env)
- Never commit private keys to git

---

## 2. Serwist Configuration (Configurator Mode)

### `serwist.config.mjs`

```js
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});
```

### `next.config.ts`

```ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);
```

### Build pipeline

```bash
# Build SW separately, then build Next.js
npm run build:sw && npm run build
# Or concurrently in dev:
concurrently "next dev" "serwist build serwist.config.mjs --watch"
```

---

## 3. Service Worker Implementation

### Push event handler

```ts
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
```

### Notification click handler

```ts
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
```

---

## 4. `pushsubscriptionchange` Event Handling

The `pushsubscriptionchange` event fires when:
- The push service refreshes the subscription (e.g., endpoint rotation)
- The subscription is invalidated (e.g., server-side cleanup)

### Implementation approach

```ts
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      // Try to resubscribe if no new subscription provided
      const subscription =
        event.newSubscription ??
        (await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        }));

      // Send new subscription to server, remove old one
      await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription?.endpoint,
          newEndpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
          },
        }),
      });
    })()
  );
});
```

### Important notes

- **Chrome**: Fires `pushsubscriptionchange` reliably on subscription expiration/rotation
- **Firefox**: Also fires this event, but may not provide `newSubscription` — must call `pushManager.subscribe()` again
- **Safari (iOS)**: Does NOT fire this event. Must handle subscription refresh on app open via `registration.pushManager.getSubscription()`
- **Fallback**: Always check subscription validity on app startup via `registration.pushManager.getSubscription()` and resubscribe if null

---

## 5. 404/410 Subscription Cleanup Logic

When a push message results in a 404 or 410 response from the push service, the subscription is no longer valid and must be removed from the database.

### Server-side cleanup (web-push)

```ts
// In push notification sending logic
const result = await webpush.sendNotification(subscription, payload);

// web-push throws WebPushError with statusCode for failures
// Handle in catch block:

try {
  await webpush.sendNotification(subscription, payload);
} catch (error) {
  if (error instanceof WebPushError) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription is gone — remove from database
      await db.pushSubscription.delete({ where: { endpoint: subscription.endpoint } });
      console.log(`Removed expired subscription: ${subscription.endpoint}`);
    } else if (error.statusCode === 429) {
      // Rate limited — retry with exponential backoff
      console.warn(`Push rate limited for ${subscription.endpoint}`);
    } else {
      console.error(`Push error ${error.statusCode}: ${error.message}`);
    }
  }
}
```

### Key points

- **HTTP 404**: Subscription does not exist — user may have cleared site data
- **HTTP 410**: Subscription has expired — push service unsubscribed the user
- **Both**: Must delete from DB immediately to avoid repeated failed sends
- **HTTP 429**: Rate limit — implement exponential backoff, do NOT delete subscription
- **Batch cleanup**: On server startup, consider a sweep that validates all stored subscriptions

---

## 6. Korean In-App Browser UA Detection

### Detection functions

```ts
export function isKakaoTalk(ua: string): boolean {
  return ua.toUpperCase().includes("KAKAOTALK");
}

export function isNaver(ua: string): boolean {
  return ua.toUpperCase().includes("NAVER");
}

export function detectKoreanInAppBrowser(ua: string): "kakaotalk" | "naver" | null {
  if (isKakaoTalk(ua)) return "kakaotalk";
  if (isNaver(ua)) return "naver";
  return null;
}

export function isPushSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (detectKoreanInAppBrowser(ua) !== null) return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}
```

### Test results (7/7 passed)

| UA String | isKakaoTalk | isNaver | detect |
|---|---|---|---|
| KakaoTalk Android | ✅ true | false | "kakaotalk" |
| KakaoTalk iOS | ✅ true | false | "kakaotalk" |
| Naver Android | false | ✅ true | "naver" |
| Naver iOS | false | ✅ true | "naver" |
| Chrome Android | false | false | null |
| Safari iOS | false | false | null |
| Samsung Internet | false | false | null |

### Why this matters

Both KakaoTalk and Naver in-app browsers use WKWebView (iOS) or WebView (Android) which **completely lack Service Worker support**. Attempting `navigator.serviceWorker.register()` will throw. The detection must happen **before** any push subscription attempt.

### Production UX

When `detectKoreanInAppBrowser()` returns non-null, show a banner:
> "이 브라우저에서는 알림을 받을 수 없습니다. Chrome 또는 Safari에서 열어주세요."

With a "Copy link" or "Open in browser" button.

---

## 7. Samsung Internet SW Killing Behavior

Samsung Internet kills background Service Workers after approximately **2 minutes** of inactivity. This is more aggressive than Chrome's behavior.

### Impact on push

- Push notifications **will still arrive** because push is handled by the OS-level push service, not the SW itself
- The SW is woken up by the push event, processes it, and may be killed again shortly after
- **Risk**: If the SW needs to do async work (e.g., fetch data before showing notification), it may be killed mid-operation
- **Mitigation**: Use `event.waitUntil()` for all async work in push handler — this keeps the SW alive for the duration of the promise

### Recommendations

- Keep push handlers fast and minimal
- Use `event.waitUntil()` for all async operations
- Consider showing a "fallback" notification immediately, then updating it with data
- Test on Samsung Internet specifically during QA

---

## 8. iOS Safari Push Limitations

### Critical constraint

Push notifications on iOS Safari **only work after the user adds the app to their Home Screen** (Web App mode / "Add to Home Screen").

### Details

- Regular Safari on iOS does NOT support the Push API or Service Workers for push
- After "Add to Home Screen", the PWA runs in a standalone mode that DOES support push
- `Notification.requestPermission()` must still be called after the in-app opt-in (스팸방지법 7판)
- The `pushManager.subscribe()` call will fail in regular Safari with a `NotSupportedError`

### Production UX flow for iOS

1. Detect iOS Safari: `navigator.userAgent.includes("iPhone") && !navigator.standalone`
2. Show "Add to Home Screen" instructions (with screenshots)
3. After user adds to home screen and opens the PWA, the `isPushSupported()` check will pass
4. Then show the in-app opt-in UI
5. Only after opt-in, call `Notification.requestPermission()` and `pushManager.subscribe()`

### Detection

```ts
function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !ua.includes("KAKAOTALK") && !ua.includes("NAVER");
}

function isIOSStandalone(): boolean {
  return (navigator as any).standalone === true; // iOS Safari PWA mode
}
```

---

## 9. Legal Compliance: 스팸방지법 7판 (2026-03)

Per the inherited wisdom and spike validation:

- **`Notification.requestPermission()` alone is NOT legally sufficient**
- A separate **in-app opt-in** must be presented BEFORE calling `requestPermission()`
- The opt-in must clearly state what notifications will be sent and how to unsubscribe
- The user's opt-in consent must be recorded with timestamp

### Recommended flow

1. Check `isPushSupported()` — if false, show fallback message
2. Show in-app opt-in UI (checkbox/toggle with clear description)
3. Record opt-in consent (timestamp, user ID) in database
4. Only after opt-in, call `Notification.requestPermission()`
5. If granted, call `pushManager.subscribe()` with VAPID key
6. Send subscription to server for storage

---

## 10. Files Created/Modified

| File | Purpose |
|---|---|
| `spike-pwa-push/serwist.config.mjs` | Serwist configurator mode config |
| `spike-pwa-push/next.config.ts` | Updated with `withSerwistInit` wrapper |
| `spike-pwa-push/src/sw.ts` | Service Worker with push/notificationclick/pushsubscriptionchange handlers |
| `spike-pwa-push/src/lib/ua-detection.ts` | KakaoTalk/Naver UA detection functions |
| `spike-pwa-push/src/lib/ua-detection.test.ts` | UA detection test script |
| `.omo/evidence/task-2-kakao-detection.txt` | UA detection test results |
| `.omo/evidence/task-2-push-test.json` | VAPID keys + full spike results |
| `spike-pwa-push.md` | This document |

---

## 11. Recommendations for Production

1. **Regenerate VAPID keys** for production — never use spike keys
2. **Store VAPID private key** in Supabase Edge Function secrets (not env files)
3. **Implement server-side push** via Supabase Edge Function using `web-push` library
4. **Add subscription management** API routes: POST (subscribe), DELETE (unsubscribe), POST (refresh)
5. **Add 404/410 cleanup** cron job to sweep stale subscriptions weekly
6. **Test on Samsung Internet** specifically — its aggressive SW killing may cause edge cases
7. **iOS onboarding flow** must include "Add to Home Screen" step before push
8. **KakaoTalk/Naver fallback** must show "open in browser" prompt before any push UI