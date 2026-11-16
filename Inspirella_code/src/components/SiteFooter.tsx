import type { LanguageCode } from "../types";
import { HOME_COPY } from "../features/home/homeCopy";
import { FOOT_CONTOURS } from "../features/home/contours";
import BrandMark from "./BrandMark";

const LANGS: [LanguageCode, string][] = [["de", "Deutsch"], ["fr", "Français"], ["it", "Italiano"], ["en", "English"], ["uk", "Українська"]];

/** Footer for the Alpenglühen theme: night ground with contour lines. */
export default function SiteFooter({ language, onLanguageChange }: { language: LanguageCode; onLanguageChange: (l: LanguageCode) => void }) {
  const c = HOME_COPY[language];
  return (
    <footer className="alp-footer">
      <svg className="alp-topo drawn" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {FOOT_CONTOURS.map(p => <path key={`${p.d.slice(0, 18)}${p.i}`} className={p.ix ? "ix" : undefined} d={p.d} />)}
      </svg>
      <div className="alp-in">
        <div>
          <a className="alp-brand" href="/"><BrandMark />Inspirella</a>
          <p className="meta">{c.footer.tagline}</p>
        </div>
        <div>
          <h4>{c.footer.explore}</h4>
          <ul>
            <li><a href="/berufe/">{c.nav.professions}</a></li>
            <li><a href="/schulen/">{c.nav.schools}</a></li>
            {(() => {
              const sys = c.topics.find(t => /system|bildungssystem|systema/.test(t[1])) ?? ["Bildungssystem", "/bildungssystem/"];
              return <li><a href={sys[1]}>{sys[0]}</a></li>;
            })()}
            <li><a href="/#wann">{c.footer.when}</a></li>
          </ul>
        </div>
        <div>
          <h4>{c.footer.language}</h4>
          <ul>
            {LANGS.map(([code, name]) => (
              <li key={code}><button type="button" lang={code} aria-current={code === language} onClick={() => onLanguageChange(code)}>{name}</button></li>
            ))}
          </ul>
        </div>
        <div className="base">
          <span>© 2026 Inspirella</span>
          <a href="/ueber-inspirella/">{c.footer.about}</a>
          <a href="/methodik/">{c.footer.method}</a>
          <a href="/impressum/">{c.footer.impressum}</a>
          <a href="/datenschutz/">{c.footer.privacy}</a>
          <a href="/kontakt/">{c.footer.contact}</a>
          <span className="date">{c.footer.dataDate}</span>
        </div>
      </div>
    </footer>
  );
}
