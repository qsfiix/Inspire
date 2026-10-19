/**
 * Privacy-friendly visit statistics (no cookies, no personal data), switched on only when a script is configured.
 *
 * Set at build time (Railway variables):
 *   VITE_ANALYTICS_SRC     the script URL, e.g. https://plausible.io/js/script.hash.js or https://cloud.umami.is/script.js
 *   VITE_ANALYTICS_DOMAIN  Plausible: the site domain (inspirella.ch)
 *   VITE_ANALYTICS_ID      Umami: the website id
 *
 * Without VITE_ANALYTICS_SRC nothing is loaded and no request is made. The app switches pages with a URL hash
 * (#/pathmap), so for Plausible use the "script.hash.js" variant: it counts every page change.
 */
export function loadAnalytics(): void {
  if (typeof document === "undefined") return;
  const src = import.meta.env.VITE_ANALYTICS_SRC as string | undefined;
  if (!src || !/^https:\/\//.test(src)) return;
  // Respect "Do Not Track" and never count local development.
  if (navigator.doNotTrack === "1" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = src;
  const domain = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined;
  const id = import.meta.env.VITE_ANALYTICS_ID as string | undefined;
  if (domain) script.setAttribute("data-domain", domain);
  if (id) script.setAttribute("data-website-id", id);
  document.head.appendChild(script);
}
