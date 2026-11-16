import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { LanguageCode } from "../types";
import { pathForTab } from "../lib/routes";
import { HOME_COPY } from "../features/home/homeCopy";
import type { ThemeName } from "../lib/theme";
import BrandMark from "./BrandMark";

interface Props {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onStartGuest: () => void;
  theme: ThemeName;
  onThemeToggle: () => void;
}

const LANGS: [LanguageCode, string, string][] = [["de", "Deutsch", "DE"], ["fr", "Français", "FR"], ["it", "Italiano", "IT"], ["en", "English", "EN"], ["uk", "Українська", "УКР"]];

/** Navigation for the Alpenglühen theme: transparent over the home sky, settles into white once you scroll. */
export default function SiteNav({ currentLanguage, onLanguageChange, activeTab, onTabChange, isLoggedIn, onLogout, onStartGuest, theme, onThemeToggle }: Props) {
  const c = HOME_COPY[currentLanguage].nav;
  const [solid, setSolid] = useState(activeTab !== "home");
  const [langOpen, setLangOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTab !== "home") { setSolid(true); return; }
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [activeTab]);

  useEffect(() => {
    const close = (e: globalThis.MouseEvent) => { if (!langRef.current?.contains(e.target as Node)) setLangOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setLangOpen(false); setSheet(false); } };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  useEffect(() => { document.body.style.overflow = sheet ? "hidden" : ""; }, [sheet]);

  const go = (id: string) => (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setSheet(false);
    if (id === "start-guest") onStartGuest(); else onTabChange(id);
  };

  // Public: static catalogue pages + the planner; signed in: the app's own pages.
  const links: { label: string; href: string; tab?: string }[] = isLoggedIn
    ? [
        { label: c.myPath, href: pathForTab("dashboard"), tab: "dashboard" },
        { label: c.planner, href: pathForTab("pathmap"), tab: "pathmap" },
        { label: c.map, href: pathForTab("map"), tab: "map" },
        { label: c.resources, href: pathForTab("resources"), tab: "resources" },
        { label: c.tracker, href: pathForTab("tracker"), tab: "tracker" },
        { label: c.profile, href: pathForTab("profile"), tab: "profile" }
      ]
    : [
        { label: c.professions, href: "/berufe/" },
        { label: c.schools, href: "/schulen/" },
        { label: c.planner, href: pathForTab("pathmap"), tab: "pathmap" },
        { label: c.myPath, href: pathForTab("dashboard"), tab: "dashboard" },
        { label: c.about, href: "/ueber-inspirella/" }
      ];

  const current = LANGS.find(l => l[0] === currentLanguage) ?? LANGS[0];
  const ThemeIcon = () => theme === "nacht"
    ? <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.9" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
    : <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>;

  return (
    <>
      <header className={`alp-nav${solid ? " solid" : ""}${activeTab === "home" ? " over" : ""}`}>
        <div className="alp-in">
          <a className="alp-brand" href="/" onClick={go("home")} aria-label="Inspirella">
            <BrandMark />Inspirella
          </a>
          <nav className="links" aria-label="Navigation">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={l.tab ? go(l.tab) : undefined} aria-current={l.tab && activeTab === l.tab ? "page" : undefined}>{l.label}</a>
            ))}
          </nav>
          <div className="langwrap" ref={langRef}>
            <button type="button" className="langbtn" aria-haspopup="true" aria-expanded={langOpen} aria-label={c.language} onClick={() => setLangOpen(o => !o)}>
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
              <span>{current[2]}</span>
              <svg className="i chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <ul className="langmenu" data-open={langOpen} role="menu">
              {LANGS.map(([code, name, short]) => (
                <li key={code}><button type="button" role="menuitem" lang={code} aria-current={code === currentLanguage} onClick={() => { onLanguageChange(code); setLangOpen(false); }}>{name}<small>{short}</small></button></li>
              ))}
            </ul>
          </div>
          <button type="button" className="themebtn" onClick={onThemeToggle} aria-label={theme === "nacht" ? c.toDay : c.toNight} title={theme === "nacht" ? c.toDay : c.toNight}><ThemeIcon /></button>
          {isLoggedIn ? (
            <button type="button" className="login" onClick={onLogout}>{c.logout}</button>
          ) : (
            <>
              <a className="login" href={pathForTab("login")} onClick={go("login")}>{c.login}</a>
              <a className="alp-btn sm" href="/onboarding/" onClick={go("start-guest")}>{c.findPath}<svg className="i ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            </>
          )}
          <button type="button" className="burger" ref={burgerRef} aria-label={c.menuOpen} aria-expanded={sheet} onClick={() => setSheet(true)}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

      <div className={`alp-sheet${sheet ? " open" : ""}`} aria-hidden={!sheet} onClick={e => { if (e.target === e.currentTarget) setSheet(false); }}>
        <div className="panel-m" role="dialog" aria-label={c.menuOpen}>
          <button type="button" className="x" aria-label={c.menuClose} onClick={() => { setSheet(false); burgerRef.current?.focus(); }}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          {links.map(l => <a key={l.href} className="l" href={l.href} onClick={l.tab ? go(l.tab) : () => setSheet(false)}>{l.label}</a>)}
          <div className="langs" role="group" aria-label={c.language}>
            {LANGS.map(([code, , short]) => <button key={code} type="button" lang={code} aria-current={code === currentLanguage} onClick={() => onLanguageChange(code)}>{short}</button>)}
          </div>
          <button type="button" className="sheet-theme" onClick={onThemeToggle}><ThemeIcon />{theme === "nacht" ? c.toDay : c.toNight}</button>
          {isLoggedIn
            ? <button type="button" className="alp-btn" onClick={() => { setSheet(false); onLogout(); }}>{c.logout}</button>
            : <a className="alp-btn" href="/onboarding/" onClick={go("start-guest")}>{c.findPath}</a>}
        </div>
      </div>
    </>
  );
}
