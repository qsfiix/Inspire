/*
 * Google Analytics 4 with consent.
 * Nothing is loaded and nothing is sent to Google until the visitor agrees in the banner.
 * The choice is kept in localStorage ("inspirella-consent": "granted" | "denied"); the footer link
 * "Cookie settings" (any element with data-cookie-settings, or the #cookie-settings hash) reopens the banner.
 */
(function () {
  var GA_ID = "G-Y3MTLQ5TT7";
  var KEY = "inspirella-consent";
  var TEXTS = {
    de: { t: "Wir möchten anonyme Besucherstatistik (Google Analytics) nutzen, um die Seite zu verbessern. Ohne deine Zustimmung wird nichts geladen.", y: "Zustimmen", n: "Ablehnen", p: "Datenschutz", pu: "/datenschutz/" },
    en: { t: "We would like to use visitor statistics (Google Analytics) to improve the site. Nothing is loaded without your consent.", y: "Accept", n: "Decline", p: "Privacy", pu: "/datenschutz/" },
    fr: { t: "Nous aimerions utiliser des statistiques de visite (Google Analytics) pour améliorer le site. Rien n'est chargé sans ton accord.", y: "Accepter", n: "Refuser", p: "Confidentialité", pu: "/datenschutz/" },
    it: { t: "Vorremmo usare statistiche di visita (Google Analytics) per migliorare il sito. Senza il tuo consenso non viene caricato nulla.", y: "Accetta", n: "Rifiuta", p: "Privacy", pu: "/datenschutz/" },
    uk: { t: "Ми хотіли б використовувати статистику відвідувань (Google Analytics), щоб покращувати сайт. Без вашої згоди нічого не завантажується.", y: "Погодитись", n: "Відмовитись", p: "Конфіденційність", pu: "/datenschutz/" }
  };

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: choice lasts for this page only */ } }
  function lang() {
    var l = "";
    try {
      l = (new URLSearchParams(location.search).get("lang") || localStorage.getItem("inspirella-lang") || "").toLowerCase();
    } catch (e) { /* ignore */ }
    if (!TEXTS[l]) {
      var langs = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < langs.length; i++) { if (String(langs[i]).slice(0, 2).toLowerCase() === "uk") { l = "uk"; break; } }
    }
    if (!TEXTS[l]) l = (document.documentElement.lang || "de").slice(0, 2).toLowerCase();
    return TEXTS[l] ? l : "de";
  }
  function isLocal() { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname); }

  var loaded = false;
  function load() {
    if (loaded || isLocal()) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }

  function removeBanner() {
    var b = document.getElementById("cookie-banner");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function choose(v) {
    write(v);
    removeBanner();
    if (v === "granted") load();
    else if (loaded) {
      // withdrawn after loading: stop sending and drop the _ga cookies
      window["ga-disable-" + GA_ID] = true;
      document.cookie.split(";").forEach(function (c) {
        var name = c.split("=")[0].trim();
        if (name === "_ga" || name.indexOf("_ga_") === 0) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + location.hostname.replace(/^www\./, "");
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        }
      });
    }
  }

  function showBanner() {
    if (document.getElementById("cookie-banner") || !document.body) return;
    var t = TEXTS[lang()];
    var b = document.createElement("div");
    b.id = "cookie-banner";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-label", "Cookies");
    b.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:640px;margin:0 auto;padding:14px 16px;border-radius:14px;background:#1b1030;color:#f4efff;border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 30px rgba(0,0,0,.45);font:14px/1.45 Inter,system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between";
    var p = document.createElement("p");
    p.style.cssText = "margin:0;flex:1 1 280px";
    p.appendChild(document.createTextNode(t.t + " "));
    var a = document.createElement("a");
    a.href = t.pu;
    a.textContent = t.p;
    a.style.cssText = "color:#d9c7ff;text-decoration:underline";
    p.appendChild(a);
    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;flex:0 0 auto";
    function btn(label, value, primary) {
      var x = document.createElement("button");
      x.type = "button";
      x.textContent = label;
      x.style.cssText = "cursor:pointer;border-radius:10px;padding:8px 14px;font:600 14px Inter,system-ui,sans-serif;border:1px solid rgba(255,255,255,.3);" + (primary ? "background:#f4efff;color:#1b1030" : "background:transparent;color:#f4efff");
      x.addEventListener("click", function () { choose(value); });
      return x;
    }
    // both choices are equally easy to make
    row.appendChild(btn(t.n, "denied", false));
    row.appendChild(btn(t.y, "granted", true));
    b.appendChild(p);
    b.appendChild(row);
    document.body.appendChild(b);
  }

  function init() {
    var c = read();
    if (c === "granted") load();
    else if (c !== "denied") showBanner();
  }

  window.openCookieSettings = showBanner;
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-cookie-settings],a[href='#cookie-settings']") : null;
    if (el) { e.preventDefault(); showBanner(); }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
