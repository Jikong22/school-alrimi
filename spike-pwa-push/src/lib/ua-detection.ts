/**
 * User-Agent detection for Korean in-app browsers.
 *
 * KakaoTalk and Naver in-app browsers are WKWebView-based and do NOT
 * support Service Workers. We must detect them and show a fallback
 * (e.g., "Open in Chrome/Safari" prompt) instead of attempting push
 * subscription.
 */

/**
 * Detect KakaoTalk in-app browser.
 * KakaoTalk UA contains "KAKAOTALK" (case-insensitive in practice,
 * but always uppercase in known UA strings).
 */
export function isKakaoTalk(ua: string): boolean {
  return ua.toUpperCase().includes("KAKAOTALK");
}

/**
 * Detect Naver in-app browser.
 * Naver app UA contains "NAVER" (case-insensitive in practice,
 * but always uppercase in known UA strings).
 */
export function isNaver(ua: string): boolean {
  return ua.toUpperCase().includes("NAVER");
}

/**
 * Detect any Korean in-app browser that lacks Service Worker support.
 * Returns the browser name or null if not detected.
 */
export function detectKoreanInAppBrowser(ua: string): "kakaotalk" | "naver" | null {
  if (isKakaoTalk(ua)) return "kakaotalk";
  if (isNaver(ua)) return "naver";
  return null;
}

/**
 * Check if the current browser supports Service Workers and Push API.
 * Returns false for KakaoTalk/Naver in-app browsers.
 */
export function isPushSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (detectKoreanInAppBrowser(ua) !== null) return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}