import type { LanguageCode } from "../types";

/**
 * Permanent site links in the footer, as plain <a href> so that search engines (and people without JavaScript) can
 * reach the catalogues and the overview pages from every page of the app.
 */

const LINKS: Record<LanguageCode, { professions: string; schools: string; system: string; systemHref: string; about: string; imprint: string; privacy: string; methodology: string; cookies: string }> = {
  de: { professions: "Alle Berufe", schools: "Alle Schulen", system: "Bildungssystem", systemHref: "/bildungssystem/", about: "Über Inspirella", imprint: "Impressum", privacy: "Datenschutz", methodology: "Methodik", cookies: "Cookie-Einstellungen" },
  en: { professions: "All professions", schools: "All schools", system: "Education system", systemHref: "/en/swiss-education-system/", about: "About Inspirella", imprint: "Imprint", privacy: "Privacy", methodology: "Methodology", cookies: "Cookie settings" },
  fr: { professions: "Tous les métiers", schools: "Toutes les écoles", system: "Système éducatif", systemHref: "/en/swiss-education-system/", about: "À propos d'Inspirella", imprint: "Mentions légales", privacy: "Confidentialité", methodology: "Méthodologie", cookies: "Paramètres des cookies" },
  it: { professions: "Tutte le professioni", schools: "Tutte le scuole", system: "Sistema formativo", systemHref: "/en/swiss-education-system/", about: "Su Inspirella", imprint: "Impressum", privacy: "Privacy", methodology: "Metodologia", cookies: "Impostazioni cookie" },
  uk: { professions: "Усі професії", schools: "Усі школи", system: "Система освіти", systemHref: "/uk/systema-osvity-shveitsarii/", about: "Про Inspirella", imprint: "Імпресум", privacy: "Конфіденційність", methodology: "Методологія", cookies: "Налаштування cookie" }
};

export default function FooterLinks({ language, isDark }: { language: LanguageCode; isDark: boolean }) {
  const l = LINKS[language] ?? LINKS.en;
  const cls = `underline-offset-2 hover:underline ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-black font-extrabold"}`;
  const items: [string, string][] = [
    [l.professions, "/berufe/"],
    [l.schools, "/schulen/"],
    [l.system, l.systemHref],
    [l.methodology, "/methodik/"],
    [l.about, "/ueber-inspirella/"],
    [l.imprint, "/impressum/"],
    [l.privacy, "/datenschutz/"]
  ];
  return (
    <nav aria-label="Inspirella" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {items.map(([label, href]) => (
        <a key={href} href={href} className={cls}>{label}</a>
      ))}
      <a href="#cookie-settings" data-cookie-settings className={cls}>{l.cookies}</a>
    </nav>
  );
}
