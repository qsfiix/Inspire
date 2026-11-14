import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { LanguageCode } from "../../types";
import { TRANSLATIONS } from "../../data";
import { HOME_COPY } from "./homeCopy";
import Landscape from "./Landscape";
import HomeSearch from "./HomeSearch";
import WaysDiagram from "./WaysDiagram";
import ProfessionCard from "./ProfessionCard";

interface Props {
  language: LanguageCode;
  onTab: (tab: string) => void;
  onStartGuest: () => void;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Arrow = () => (
  <svg className="i ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Check = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/** Small path glyphs for the four audiences: steps; two dots walking together; a path that turns; a path entering from the edge. */
const GLYPHS = [
  <><path pathLength={1} d="M6 34H14V26H22V18H30V10" /><circle className="dotf" cx="34" cy="6" r="3" /></>,
  <><path pathLength={1} d="M4 30C12 30 14 22 22 22S32 14 36 10" /><circle className="dotf" cx="16" cy="26" r="3.4" /><circle className="dotf" cx="25" cy="21" r="2.4" /></>,
  <><path pathLength={1} d="M6 32H20C26 32 28 28 28 22V8M22 14L28 8L34 14" /></>,
  <><path pathLength={1} d="M2 28H12C18 28 20 20 26 16" /><circle className="dotf" cx="32" cy="12" r="3.4" /><path pathLength={1} d="M2 20V36" /></>
];

const TRUST_ICONS = [
  <path key="s" d="M5 4h10l4 4v12H5zM15 4v4h4M8.5 12.5h7M8.5 16h5" />,
  <path key="u" d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />,
  <g key="g"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5Z" /></g>,
  <path key="l" d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
];

const STAIR_PTS: [number, number][] = [[90, 324], [200, 254], [310, 184], [420, 114], [530, 44]];

export default function AlpenHome({ language, onTab, onStartGuest }: Props) {
  const c = HOME_COPY[language];
  const [heroA, heroB] = (TRANSLATIONS[language].heroTitle ?? "").split("|");
  const heroBText = (heroB ?? "").replace(/[.。]\s*$/, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(2);
  const [openFaq, setOpenFaq] = useState(0);
  const [stairsP, setStairsP] = useState(0);
  const tlRef = useRef<HTMLDivElement>(null);
  const tlDotRef = useRef<HTMLDivElement>(null);

  /** Internal app pages stay inside the app on a plain left click; static pages are normal links. */
  const linkTo = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (href === "#start-guest") { e.preventDefault(); onStartGuest(); }
    else if (href === "/pathmap/") { e.preventDefault(); onTab("pathmap"); }
  };
  const hrefOf = (href: string) => (href === "#start-guest" ? "/onboarding/" : href);

  // Load moment, scroll-linked pieces, parallax, contour draw-in, swift flight.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const quiet = reduced();
    const segs = Array.prototype.slice.call(root.querySelectorAll(".alp-ways [data-seg]")) as SVGPathElement[];
    const setWays = (p: number) => {
      const a = clamp(p / 0.6), h = clamp((p - 0.25) / 0.5), x = clamp((p - 0.55) / 0.4);
      for (const el of segs) {
        const s = el.dataset.seg;
        el.style.strokeDashoffset = String(1 - (s === "X" ? x : s === "H" ? h : a));
      }
    };
    const ways = root.querySelector<HTMLElement>("[data-scrub='ways']");
    const stairs = root.querySelector<HTMLElement>("[data-scrub='stairs']");
    if (quiet) { setWays(1); setStairsP(1); return; }

    root.classList.add("alp-loaded", "alp-armed");
    const hero = root.querySelector<HTMLElement>(".alp-hero")!;
    const layers = Array.prototype.slice.call(root.querySelectorAll(".alp-lyr")) as HTMLElement[];
    const progress = (el: HTMLElement) => {
      const r = el.getBoundingClientRect(), vh = window.innerHeight || 800;
      return clamp((vh * 0.85 - r.top) / (vh * 0.65));
    };
    let ticking = false;
    const frame = () => {
      ticking = false;
      const y = window.scrollY || 0, hh = hero.offsetHeight;
      if (y < hh) for (const l of layers) l.style.transform = `translate3d(0,${(y * Number(l.dataset.depth)).toFixed(1)}px,0)`;
      if (ways) setWays(progress(ways));
      if (stairs) setStairsP(progress(stairs));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    frame();

    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const t = e.target as HTMLElement;
        if (t === hero) hero.classList.toggle("drift", e.isIntersecting);
        else if (t.classList.contains("alp-final")) { if (e.isIntersecting) t.classList.add("seen"); }
        else if (e.isIntersecting) t.classList.add("drawn");
      }
    }, { threshold: 0.25 });
    io.observe(hero);
    root.querySelectorAll(".alp-topo, .alp-final").forEach(el => io.observe(el));

    // The hero swift: from off-screen left, arcing over the range, ending on the summit dot.
    const flyer = root.querySelector<HTMLElement>("#alp-flyer");
    const summit = root.querySelector<SVGCircleElement>("#alp-summit");
    let flown = false;
    const launch = () => {
      if (flown || !flyer || !summit || !("offsetPath" in flyer.style)) return;
      flown = true;
      const H = hero.getBoundingClientRect(), M = (summit.parentNode as SVGGraphicsElement).getScreenCTM();
      if (!M) return;
      const cx = Number(summit.getAttribute("cx")), cy = Number(summit.getAttribute("cy"));
      const sx = M.a * cx + M.c * cy + M.e - H.left, sy = M.b * cx + M.d * cy + M.f - H.top;
      const land = root.querySelector(".alp-land")!.getBoundingClientRect().top - H.top;
      const y0 = Math.max(land + 40, sy + 60), w = H.width;
      flyer.style.offsetPath = `path('M -40 ${y0.toFixed(0)} C ${(w * 0.28).toFixed(0)} ${(y0 - 140).toFixed(0)} ${(sx - w * 0.18).toFixed(0)} ${(sy - 200).toFixed(0)} ${sx.toFixed(0)} ${sy.toFixed(0)}')`;
      flyer.classList.add("go");
    };
    if (document.fonts?.ready) document.fonts.ready.then(() => requestAnimationFrame(launch)); else window.setTimeout(launch, 100);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
    };
  }, []);

  // Timeline: the coral dot slides to the chosen school year.
  useEffect(() => {
    const place = () => {
      const tl = tlRef.current, dot = tlDotRef.current;
      if (!tl || !dot) return;
      const item = tl.querySelectorAll<HTMLElement>(".tl-item")[step];
      if (!item) return;
      const tr = tl.getBoundingClientRect(), r = item.getBoundingClientRect();
      dot.style.transform = window.innerWidth <= 900 ? `translate(0,${r.top - tr.top + 18}px)` : `translate(${r.left - tr.left + 12}px,0)`;
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [step, language]);

  // My Path: the dot climbs with scroll, finished steps get stamped, the cairn grows by one stone per step.
  const f = stairsP * (STAIR_PTS.length - 1);
  const i = Math.min(STAIR_PTS.length - 2, Math.floor(f)), tt = f - i, a = STAIR_PTS[i], b = STAIR_PTS[i + 1];
  const meX = a[0] + (b[0] - a[0]) * clamp((tt - 0.08) / 0.3), meY = a[1] + (b[1] - a[1]) * clamp(tt / 0.22);
  const done = (k: number) => f >= k + 0.98;

  const audHref = c.who.items.map(it => it.href);

  return (
    <div className="alp-home" ref={rootRef}>
      {/* ===== Hero ===== */}
      <div className="alp-hero">
        <Landscape />
        <div className="alp-in">
          <div className="alp-copy">
            <h1 lang={language}>{heroA} <span className="l2">{heroBText}<span className="dot">.</span></span></h1>
            <p className="sub">{c.hero.sub}</p>
            <HomeSearch copy={c.hero} topics={c.topics} language={language} />
            <div className="alp-examples"><span>{c.hero.examplesLabel}</span>{c.hero.examples.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
            <div className="alp-assure">{c.hero.assure.map(s => <span key={s}><Check />{s}</span>)}</div>
          </div>
        </div>
      </div>

      {/* ===== Who are you, on the dusk ground ===== */}
      <div className="alp-ground" id="start">
        <div className="alp-in">
          <h2>{c.who.title}</h2>
          <div className="alp-who">
            {c.who.items.map((it, k) => (
              <div className="item" key={it.title}>
                <a className="main" href={hrefOf(it.href)} onClick={linkTo(it.href)}>
                  <svg className="g" viewBox="0 0 40 40" aria-hidden="true">{GLYPHS[k]}</svg>
                  <span className="t"><span>{it.title}</span><Arrow /></span>
                  <span className="d">{it.desc}</span>
                </a>
                {k === 3 && language !== "uk" && <a className="uk" href="/uk/" lang="uk">{c.who.uk}<Arrow /></a>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Durchlässigkeit ===== */}
      <section className="alp-sec" id="wege" data-scrub="ways">
        <div className="alp-in">
          <div className="alp-head">
            <h2><span className="br">{c.ways.titleA}</span> {c.ways.titleB}</h2>
            <p>{c.ways.lead}</p>
          </div>
          <WaysDiagram copy={c.ways} onPlanner={() => onTab("pathmap")} />
        </div>
      </section>

      {/* ===== What happens when ===== */}
      <section className="alp-sec alp-when" id="wann">
        <div className="alp-in">
          <div className="alp-head"><h2>{c.when.title}</h2><p>{c.when.lead}</p></div>
          <div className="alp-wctl">
            <div className="alp-seg" role="group" aria-label={c.when.groupLabel}>
              {c.when.classes.map((label, k) => (
                <button key={label} type="button" aria-pressed={step === k} onClick={() => setStep(k)}>{label}</button>
              ))}
            </div>
            <a className="alp-canton" href={language === "uk" ? "/uk/pryjom/" : "/zulassung/"}>{c.when.cantonLink}<Arrow /></a>
          </div>
          <div className="alp-tl" ref={tlRef}>
            <div className="tl-rail" /><div className="tl-dot" ref={tlDotRef} />
            <div className="tl-items">
              {c.when.items.map((it, k) => (
                <div className={`tl-item${k === step ? " here" : ""}`} key={it.t}>
                  <span className="here-badge">{c.when.here}</span>
                  <div className="when-t">{it.t}</div>
                  <p>{it.p}</p>
                  <div className="tags">{it.tags.map(tg => <span key={tg} className={`tag ${tg}`}>{tg === "l" ? c.when.tagL : c.when.tagG}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="alp-tlnote">{c.when.note}</p>
        </div>
      </section>

      {/* ===== One profession, real numbers ===== */}
      <section className="alp-sec" id="berufe">
        <div className="alp-in"><ProfessionCard copy={c.prof} language={language} /></div>
      </section>

      {/* ===== My Path at dusk ===== */}
      <section className="alp-sec alp-dusk" id="weg" data-scrub="stairs">
        <div className="stars" aria-hidden="true" />
        <div className="alp-in">
          <div className="alp-pathgrid">
            <div>
              <h2><span className="br">{c.path.titleA}</span> {c.path.titleB}</h2>
              <p className="lead">{c.path.lead}</p>
              <ol className="how">{c.path.how.map((s, k) => <li key={s}><b>{k + 1}</b>{s}</li>)}</ol>
              <a className="alp-btn coral" href="/onboarding/" onClick={linkTo("#start-guest")}>{c.path.cta}<Arrow /></a>
              <span className="hint">{c.path.hint}</span>
            </div>
            <svg className="alp-stairs" viewBox="0 0 664 440" role="img" aria-label={c.path.steps.map(s => s.t).join(", ")}>
              <defs><linearGradient id="alpStf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9cdf0" stopOpacity=".12" /><stop offset="1" stopColor="#d9cdf0" stopOpacity="0" /></linearGradient></defs>
              <path d="M20 340H130V270H240V200H350V130H460V60H620V440H20Z" fill="url(#alpStf)" />
              <path className="st" d="M20 340H130V270H240V200H350V130H460V60H620" />
              {c.path.steps.map((s, k) => {
                const x = 20 + k * 110, y = 340 - k * 70;
                return (
                  <g key={s.t}>
                    {k < 4 ? (
                      <g className={`ck${done(k) ? " on" : ""}`}><circle className="ckc" cx={x + 22} cy={y + 25} r="9" /><path className="ckm" d={`M${x + 17.5} ${y + 25}l3 3 5.5-6`} /></g>
                    ) : (
                      <circle cx={x + 22} cy={y + 25} r="9" fill="none" stroke="#e46f4c" strokeWidth="2" strokeDasharray="3 3" />
                    )}
                    <text x={x + 38} y={y + 30}>{s.t}</text>
                    <text className="yr" x={x + 38} y={y + 50}>{s.y}</text>
                  </g>
                );
              })}
              <g>
                {[[584, 52, 20, 7, "#b9a8dc"], [586, 40, 15, 6, "#cbbde6"], [583, 30, 11, 5, "#ddd2f0"], [585, 21, 7, 4, "#e46f4c"]].map(([cx, cy, rx, ry, fill], k) => (
                  <ellipse key={k} className={`stone${done(k) ? " on" : ""}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill as string} />
                ))}
              </g>
              <circle className="halo" cx={meX} cy={meY} r="16" />
              <circle className="me" cx={meX} cy={meY} r="9" />
            </svg>
            <ol className="alp-mstairs">
              {c.path.steps.map((s, k) => (
                <li key={s.t} className={`${k < 4 && done(k) ? "on" : ""}${k === 4 ? " goal" : ""}`}>
                  <span className="c">{k < 4 && <Check />}</span><div><b>{s.t}</b><span className="y">{s.y}</span></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <svg className="ridge" viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <path d="M0 104C120 92 200 70 300 74S470 102 560 96S720 62 820 66S990 98 1080 94S1250 70 1340 76S1420 88 1440 86V150H0Z" fill="#6a46a0" opacity=".4" />
          <path d="M0 132C160 120 280 108 420 114S700 132 860 124S1180 104 1300 112S1420 122 1440 120V150H0Z" fill="#ffffff" />
        </svg>
      </section>

      {/* ===== Trust + FAQ ===== */}
      <section className="alp-sec alp-trustsec" id="vertrauen">
        <div className="alp-in">
          <div className="alp-trust">
            {c.trust.items.map((it, k) => (
              <div className="tr" key={it.t}>
                <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{TRUST_ICONS[k]}</svg>
                <h3>{it.t}</h3><p>{it.p}</p>
              </div>
            ))}
          </div>
          <div className="alp-noteline"><span><b>{c.footer.dataDate}</b></span><span>{c.trust.disclaimer} <a href="https://www.berufsberatung.ch/" rel="noopener">{c.trust.bizLink}</a>.</span></div>
          <div className="alp-faq">
            <h2>{c.trust.faqTitle}</h2>
            <div>
              {c.trust.faq.map((qa, k) => (
                <div className={`qa${openFaq === k ? " open" : ""}`} key={qa.q}>
                  <button type="button" aria-expanded={openFaq === k} aria-controls={`alp-a${k}`} id={`alp-q${k}`} onClick={() => setOpenFaq(openFaq === k ? -1 : k)}>
                    {qa.q}<svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                  <div className="a" id={`alp-a${k}`} role="region" aria-labelledby={`alp-q${k}`}><div><p>{qa.a}</p></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Final: dawn again ===== */}
      <div className="alp-final">
        <div className="alp-grain" aria-hidden="true" />
        <div className="alp-in">
          <div className="copy">
            <div className="zero" aria-hidden="true">0</div>
            <h2><span className="sr-only">0 </span>{c.final.word}</h2>
            <p>{c.final.lead}</p>
            <div className="aud">
              {c.final.aud.map((label, k) => <a key={label} href={hrefOf(audHref[k])} onClick={linkTo(audHref[k])}>{label}<Arrow /></a>)}
            </div>
          </div>
        </div>
        <svg className="land2" viewBox="0 0 1440 340" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
          <defs><radialGradient id="alpSunGlow2"><stop offset="0" stopColor="#ffc9ad" stopOpacity=".85" /><stop offset="1" stopColor="#ffc9ad" stopOpacity="0" /></radialGradient></defs>
          <circle className="rise" cx="1000" cy="104" r="100" fill="url(#alpSunGlow2)" />
          <circle className="rise" cx="1000" cy="98" r="30" fill="#e46f4c" />
          <path d="M0 236L110 218L210 226L330 198L440 214L560 170L640 186L720 150L770 164L840 132L900 150L960 140L1030 116L1080 128L1140 106L1200 132L1270 148L1340 140L1440 162V340H0Z" fill="#d8cbee" />
          <path d="M1140 106L1160 116L1186 130L1200 132L1186 168L1160 152Z M840 132L860 140L900 150L888 182L862 162Z" fill="#ecdff3" />
          <path d="M1140 106L1160 116L1152 122L1156 132L1144 124L1136 130L1136 116Z M840 132L860 140L852 144L855 152L843 145L834 150L835 138Z" fill="#fff" />
          <path d="M0 274L160 250L320 266L480 230L640 258L800 228L960 262L1120 232L1280 258L1440 240V340H0Z" fill="#9c86c9" />
          <path d="M0 304C240 286 420 310 660 298S1040 278 1240 302S1400 294 1440 296V340H0Z" fill="#4a2377" />
        </svg>
      </div>
    </div>
  );
}
