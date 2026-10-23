/**
 * Pre-renders static HTML pages into dist/ after `vite build`, plus sitemap.xml:
 *
 *   /beruf/<slug>/        one page per active profession / programme
 *   /institution/<slug>/  one page per active institution
 *   /ueber-inspirella/    what Inspirella is (the German "About" copy + live counts)
 *   /                     the app shell, with a plain-text home written into #root
 *                         (React replaces it on load) so crawlers see more than an empty page
 *   /impressum/, /datenschutz/   the legal pages (German), real addresses for the same text the app shows
 *   /404.html             served with status 404 for any unknown address (see server.ts)
 *
 * Why static files: Inspirella is a single-page app whose content lives in
 * Supabase, so crawlers (search engines, AI assistants) that do not run
 * JavaScript saw an empty shell. Pre-rendered pages give every record its own
 * address with the text already in the HTML - and because they are plain
 * files, a bot request costs no database query and no server code.
 *
 * Only the public anon key is used (same read access the browser app has).
 * A failure here must never break a deploy: it logs and exits 0, and the app
 * itself keeps working without the pages.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { TRANSLATIONS } from "../src/data";
import { IMPRESSUM, PRIVACY, type LegalDoc } from "../src/features/legalText";

const SITE = (process.env.SITE_URL || "https://www.inspirella.ch").replace(/\/+$/, "");
const DIST = path.join(process.cwd(), "dist");
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const MAX_SCHOOLS_SHOWN = 12;
const MAX_PROFESSIONS_SHOWN = 40;
/** Pages with less text than this look thin to search engines: keep them out of the index. */
const MIN_INDEXABLE_CHARS = 120;

type Row = Record<string, any>;

const TYPE_LABELS: Record<string, string> = {
  apprenticeship_efz: "Lehrberuf EFZ",
  apprenticeship_eba: "Lehrberuf EBA",
  fachausweis: "Eidg. Fachausweis",
  diplom: "Eidg. Diplom",
  hf_diploma: "Höhere Fachschule HF",
  fh_bachelor: "Fachhochschule (Bachelor)",
  university: "Universität / ETH"
};

const REGULATED_LABELS: Record<string, string> = {
  regulated: "Reglementierter Beruf",
  not_regulated: "Nicht reglementiert"
};

const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  federal_institute_of_technology: "Eidgenössische Technische Hochschule",
  teacher_education: "Pädagogische Hochschule",
  university: "Universität",
  university_of_applied_sciences: "Fachhochschule",
  fachmittelschule: "Fachmittelschule",
  gymnasium: "Gymnasium",
  international_school: "Internationale Schule",
  private_school: "Privatschule",
  continuing_education_center: "Weiterbildungszentrum",
  vocational_school: "Berufsfachschule"
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** URL-safe form of a DB slug (umlauts transliterated; DB data stays untouched). */
function pageSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/_/g, "-");
}

/** Trimmed, non-empty text or undefined. */
function txt(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t || undefined;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/** Only http(s) links reach the HTML; anything else (javascript:, data:) is dropped. */
function safeUrl(value: unknown): string | undefined {
  const t = txt(value);
  if (!t) return undefined;
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function fetchAll(build: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: any }>): Promise<Row[]> {
  const out: Row[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await build(from, from + page - 1);
    if (error) throw new Error(error.message || String(error));
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}

const CSS = `
@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin.woff2) format("woff2")}
@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:300 700;font-display:swap;src:url(/fonts/space-grotesk-latin.woff2) format("woff2")}
:root{--bg:#030008;--fg:#e8e4f5;--muted:#a39bc2;--card:rgba(255,255,255,.05);--card-b:rgba(255,255,255,.10);--accent:#a78bfa;--grain:196,181,253}
body.light{--bg:#f5f3ff;--fg:#1e1b4b;--muted:#5b5280;--card:#fff;--card-b:#e9d5ff;--accent:#6d28d9;--grain:109,40,217}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;line-height:1.6;transition:background .4s,color .4s;overflow-x:hidden}
h1,h2{font-family:"Space Grotesk",sans-serif;margin:0;line-height:1.15}
a{color:inherit}
.ambient{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.blob{position:absolute;border-radius:50%;filter:blur(110px);animation:drift 22s ease-in-out infinite}
.b1{width:28rem;height:28rem;top:-2rem;left:-2rem;background:radial-gradient(circle,rgba(139,92,246,.28),rgba(99,102,241,0) 70%)}
.b2{width:26rem;height:26rem;top:35%;right:-5rem;background:radial-gradient(circle,rgba(99,102,241,.25),rgba(79,70,229,0) 70%);animation-duration:26s;animation-direction:reverse}
.b3{width:24rem;height:24rem;bottom:-7rem;left:25%;background:radial-gradient(circle,rgba(192,132,252,.2),rgba(168,85,247,0) 70%);animation-duration:19s}
.b4{width:22rem;height:22rem;top:8%;left:42%;background:radial-gradient(circle,rgba(251,146,60,.14),rgba(139,92,246,.1) 45%,transparent 75%);animation-duration:14s}
body.light .blob{opacity:.75}
@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,-6%) scale(1.08)}}
canvas#sand{position:absolute;inset:0;width:100%;height:100%}
.grain{position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(6,4,10,.5) 100%)}
body.light .vignette{background:radial-gradient(ellipse at center,transparent 40%,rgba(245,243,255,.7) 100%)}
body.light .grain{mix-blend-mode:multiply;opacity:.025}
nav{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;max-width:1080px;margin:0 auto;padding:18px 20px}
.logo{display:flex;align-items:center;gap:10px;font:700 20px "Space Grotesk",sans-serif;text-decoration:none}
.logo img{width:30px;height:30px;object-fit:contain}
.nav-r{display:flex;gap:14px;align-items:center;font-size:14px;flex-wrap:wrap;justify-content:flex-end}
.nav-r a{color:var(--muted);text-decoration:none}.nav-r a:hover{color:var(--accent)}
.tgl{background:var(--card);border:1px solid var(--card-b);color:var(--fg);border-radius:10px;padding:6px 12px;cursor:pointer;font:500 13px Inter,sans-serif}
main{position:relative;z-index:2;max-width:1080px;margin:0 auto;padding:8px 20px 70px}
.crumbs{font-size:13px;color:var(--muted);margin:10px 0 28px}
.crumbs a{text-decoration:none}.crumbs a:hover{color:var(--accent)}
.hero{display:grid;gap:18px;margin-bottom:34px}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.badge{font:600 12px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;padding:5px 12px;border-radius:99px;border:1px solid var(--card-b);background:var(--card);color:var(--accent)}
.badge.warm{color:#fdba74;border-color:rgba(251,146,60,.35)}
body.light .badge.warm{color:#c2410c}
h1{font-size:clamp(30px,5vw,52px);font-weight:700;letter-spacing:-.01em}
.lead{font-size:clamp(17px,2vw,20px);color:var(--muted);max-width:62ch;margin:0}
.cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:14px;font:600 15px Inter,sans-serif;text-decoration:none;border:1px solid transparent;transition:transform .15s}
.btn:active{transform:scale(.96)}
.btn-primary{color:#fff;background:linear-gradient(90deg,#7c3aed,#4f46e5,#9333ea);box-shadow:0 8px 24px -8px rgba(124,58,237,.7);position:relative;overflow:hidden;isolation:isolate}
.btn-primary::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);transform:translateX(-120%);animation:shine 4.5s ease-in-out 1s 3}
.btn-primary:hover::after{animation:shine1 .9s ease-out}
.btn-sec{background:var(--card);border-color:var(--card-b);color:var(--fg)}
.btn-sec:hover{border-color:rgba(167,139,250,.5)}
@keyframes shine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
@keyframes shine1{from{transform:translateX(-120%)}to{transform:translateX(120%)}}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:34px}
.fact{padding:16px 18px}
.fact small{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.fact b{font:600 17px "Space Grotesk",sans-serif}
.card{border-radius:18px;border:1px solid var(--card-b);background-color:var(--card);backdrop-filter:blur(14px);transition:border-color .3s,box-shadow .3s;background-image:radial-gradient(420px circle at var(--sx,50%) var(--sy,50%),rgba(139,92,246,calc(.12*var(--so,0))),transparent 70%)}
.card:hover{--so:1;border-color:rgba(139,92,246,.4);box-shadow:0 0 28px -8px rgba(139,92,246,.35)}
body.light .card{box-shadow:0 4px 25px rgba(46,16,101,.06)}
.grid{display:grid;grid-template-columns:1.55fr 1fr;gap:22px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:22px}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
section.card{padding:26px 28px}
section.card+section.card{margin-top:22px}
.grid2 section.card+section.card{margin-top:0}
.chips{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}.chips li{padding:6px 12px;border-radius:99px;border:1px solid var(--card-b);background:rgba(139,92,246,.08);font-size:14px}
.qa{border-top:1px solid var(--card-b);padding:10px 0}.qa summary{cursor:pointer;font-weight:600}.qa p{margin:8px 0 0;color:var(--muted)}
ul.cols{list-style:none;margin:0;padding:0;columns:2 260px;column-gap:28px}ul.cols li{break-inside:avoid;padding:3px 0}ul.cols a{text-decoration:none}ul.cols a:hover{color:var(--accent)}ul.cols span{color:var(--muted);font-size:13px}
table.cmp{border-collapse:collapse;width:100%;font-size:15px}table.cmp th,table.cmp td{border-bottom:1px solid var(--card-b);padding:9px 12px;text-align:left;vertical-align:top}table.cmp thead th{color:var(--accent);font-size:13px;text-transform:uppercase;letter-spacing:.05em}
h3{font:600 18px "Space Grotesk",sans-serif;margin:0 0 8px}
h2{font-size:22px;margin-bottom:14px;display:flex;align-items:center;gap:10px}
h2::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff,#a78bfa);box-shadow:0 0 12px #a78bfa}
.dl{display:grid;gap:16px;margin:0}
.dl dt{font:600 13px Inter,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:2px}
.dl dd{margin:0}
.schools{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.school{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid var(--card-b);background:rgba(139,92,246,.06);text-decoration:none;color:inherit;transition:border-color .2s,transform .2s}
a.school:hover{border-color:rgba(192,132,252,.55);transform:translateX(3px)}
.school span{font-size:13px;color:var(--muted)}
.cant{font:600 12px "Space Grotesk",sans-serif;font-style:normal;padding:3px 9px;border-radius:99px;border:1px solid rgba(167,139,250,.4);color:var(--accent)}
.more{margin:12px 0 0;color:var(--muted);font-size:14px}
.prose p{margin:0 0 14px}.prose p:last-child{margin:0}.prose ul{margin:0;padding-left:20px}.prose li{margin-bottom:6px}.prose a{color:var(--accent)}
.eyebrow{font:600 12px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:6px}
.source{margin-top:30px;padding:16px 20px;font-size:14px;color:var(--muted);border-radius:14px;border:1px dashed var(--card-b)}
.source a{color:var(--accent)}
.note{margin-top:22px;padding:18px 22px;border-radius:14px;border:1px solid rgba(251,146,60,.3);background:rgba(251,146,60,.06)}
.foot{position:relative;z-index:2;text-align:center;color:var(--muted);font-size:13px;padding:0 20px 40px}
.foot a{text-decoration:none}.foot a:hover{color:var(--accent)}
@media(prefers-reduced-motion:reduce){.blob,.btn-primary::after{animation:none!important}}
`;

const SCRIPT = `
(function(){
  var b=document.body,t=null;
  try{t=localStorage.getItem("inspirella_theme")}catch(e){}
  if(t?t==="light":(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches))b.classList.add("light");
  var g=document.getElementById("tgl");
  if(g)g.onclick=function(){b.classList.toggle("light");try{localStorage.setItem("inspirella_theme",b.classList.contains("light")?"light":"dark")}catch(e){}};
  document.addEventListener("pointermove",function(e){var c=e.target.closest&&e.target.closest(".card");if(!c)return;var r=c.getBoundingClientRect();c.style.setProperty("--sx",(e.clientX-r.left)+"px");c.style.setProperty("--sy",(e.clientY-r.top)+"px")});
  var cv=document.getElementById("sand");if(!cv||!cv.getContext)return;
  var ctx=cv.getContext("2d"),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,W,H,dpr=Math.min(devicePixelRatio||1,2),P=[];
  function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function mk(){return{x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.3,vx:Math.random()*.25+.05,vy:-(Math.random()*.18+.03),a:Math.random()*.6+.2,t:Math.random()*6.28,w:Math.random()<.14}}
  size();var n=Math.round(Math.min(160,W*H/9000));for(var i=0;i<n;i++)P.push(mk());
  addEventListener("resize",size);
  function frame(){
    ctx.clearRect(0,0,W,H);
    var rgb=getComputedStyle(b).getPropertyValue("--grain");
    for(var i=0;i<P.length;i++){var p=P[i];
      if(!reduce){p.t+=.012;p.x+=p.vx+Math.sin(p.t)*.12;p.y+=p.vy}
      if(p.x>W+5)p.x=-5;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}
      var tw=.65+.35*Math.sin(p.t*1.7);
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);
      ctx.fillStyle=p.w?"rgba(251,146,60,"+(p.a*tw*.8)+")":"rgba("+rgb+","+(p.a*tw*.75)+")";
      ctx.shadowBlur=p.r*5;ctx.shadowColor=p.w?"rgba(251,146,60,.8)":"rgba("+rgb+",.8)";
      ctx.fill()}
    if(!reduce)requestAnimationFrame(frame)
  }
  frame()
})();
`;

interface LayoutOptions {
  docTitle: string;
  ogTitle: string;
  description: string;
  url: string;
  indexable: boolean;
  ld: object;
  main: string;
  /** Page language (default German) and its translations, for <html lang> and hreflang. */
  lang?: string;
  alternates?: { lang: string; href: string }[];
  nav?: { about: string; app: string };
}

/** The shared page shell: head/SEO tags, ambient background, nav, footer, theme + sand script. */
function layout(o: LayoutOptions): string {
  const nav = o.nav ?? { about: "Über Inspirella", app: "Zur App" };
  const hreflang = (o.alternates ?? []).map(a => `<link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.href)}">`).join("\n");
  return `<!doctype html>
<html lang="${esc(o.lang ?? "de")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.docTitle)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(o.url)}">
${hreflang ? hreflang + "\n" : ""}${o.indexable ? "" : '<meta name="robots" content="noindex, follow">\n'}<meta name="theme-color" content="#0d0618">
<link rel="icon" type="image/png" href="/logo-mark.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Inspirella">
<meta property="og:title" content="${esc(o.ogTitle)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(o.url)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.png">
<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, "\\u003c")}</script>
<style>${CSS}</style>
</head>
<body>
<div class="ambient" aria-hidden="true"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div><canvas id="sand"></canvas><div class="grain"></div><div class="vignette"></div></div>
<nav>
  <a class="logo" href="/"><img src="/logo-mark-64.png" alt="" width="30" height="29">Inspirella</a>
  <div class="nav-r"><a href="/ueber-inspirella/">${esc(nav.about)}</a><a href="/">${esc(nav.app)}</a><button class="tgl" id="tgl" type="button" aria-label="Design wechseln">☀ / ☾</button></div>
</nav>
<main>
${o.main}
</main>
<div class="foot">© Inspirella · <a href="/">inspirella.ch</a> · <a href="/ueber-inspirella/">Über Inspirella</a> · <a href="/bildungssystem/">Bildungssystem</a> ·<a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a></div>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

function factsHtml(facts: [string, string][]): string {
  return `<div class="facts">${facts.map(([k, v]) => `<div class="card fact"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div>`;
}

function sourceHtml(guidance: string): string {
  return `<div class="source">Quelle &amp; Orientierung: Inspirella ist ein Orientierungswerkzeug. Verbindliche Informationen findest du bei <a href="${esc(
    guidance
  )}" rel="noopener">berufsberatung.ch</a> und beim kantonalen Berufsinformationszentrum (BIZ).</div>`;
}

function dlSection(heading: string, items: [string, string][]): string {
  if (!items.length) return "";
  return `<section class="card"><h2>${esc(heading)}</h2><dl class="dl">${items
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("")}</dl></section>`;
}

interface Link {
  title: string;
  href?: string;
  city?: string;
  canton?: string;
}

function linkListSection(heading: string, list: Link[], max: number, moreText: (n: number) => string): string {
  if (!list.length) return "";
  const shown = list.slice(0, max);
  return `<section class="card"><h2>${esc(heading)}</h2><ul class="schools">${shown
    .map(s => {
      const inner = `<div>${esc(s.title)}${s.city ? `<br><span>${esc(s.city)}</span>` : ""}</div>${s.canton ? `<i class="cant">${esc(s.canton)}</i>` : ""}`;
      return s.href ? `<li><a class="school" href="${esc(s.href)}">${inner}</a></li>` : `<li class="school">${inner}</li>`;
    })
    .join("")}</ul>${list.length > shown.length ? `<p class="more">${esc(moreText(list.length - shown.length))}</p>` : ""}</section>`;
}

// --------------------------------------------------------------------------
// Profession page
// --------------------------------------------------------------------------

/** Everything the profession and school pages need besides the row itself. */
interface Ctx {
  profByCode: Map<string, { slug: string; title: string; type?: string }>;
  profByCategory: Map<string, string[]>;
  detailsByProf: Map<string, Row>;
  traits: Map<number, Row>;
  wagesByProf: Map<string, Row[]>;
  benchByGroup: Map<string, Record<string, Row>>;
  factsByProf: Map<string, Row>;
  instById: Map<string, { slug: string; title: string; city?: string; canton?: string }>;
  today: string;
}

const TYPE_HUBS: Record<string, { slug: string; label: string; heading: string }> = {
  apprenticeship_efz: { slug: "efz", label: "Lehrberufe EFZ", heading: "Lehrberufe mit eidgenössischem Fähigkeitszeugnis (EFZ)" },
  apprenticeship_eba: { slug: "eba", label: "Lehrberufe EBA", heading: "Lehrberufe mit eidgenössischem Berufsattest (EBA)" },
  hf_diploma: { slug: "hf", label: "Höhere Fachschule (HF)", heading: "Berufe der Höheren Fachschule (HF)" },
  fh_bachelor: { slug: "fh", label: "Fachhochschule (FH)", heading: "Berufe mit Fachhochschul-Abschluss (FH)" },
  university: { slug: "uni", label: "Universität / ETH", heading: "Berufe mit Universitäts- und ETH-Abschluss" },
  fachausweis: { slug: "berufspruefung", label: "Berufsprüfung (Fachausweis)", heading: "Berufe mit eidgenössischem Fachausweis (Berufsprüfung)" },
  diplom: { slug: "hoehere-fachpruefung", label: "Höhere Fachprüfung (Diplom)", heading: "Berufe mit eidgenössischem Diplom (Höhere Fachprüfung)" },
  other: { slug: "weitere", label: "Weitere Berufe", heading: "Weitere Berufe und Tätigkeiten" }
};

/** "Polymechanikerin / Polymechaniker EFZ" -> "Polymechaniker/in EFZ" (the short form people search for). */
function shortTitle(title: string): string {
  const m = title.match(/\s+(EFZ|EBA|HF|FH|BP|HFP|NDS HF|NDS|BA|MA)$/);
  const suffix = m ? m[1] : "";
  const core = suffix ? title.slice(0, title.length - m![0].length) : title;
  const parts = core.split(" / ").map(s => s.trim());
  let out = parts[0];
  if (parts.length === 2) {
    const [a, b] = parts;
    if (a.startsWith(b) && ["in", "frau", "e"].includes(a.slice(b.length))) out = `${b}/${a.slice(b.length)}`;
    else if (b.startsWith(a) && ["in", "frau", "e"].includes(b.slice(a.length))) out = `${a}/${b.slice(a.length)}`;
    else {
      // "Bauführerin / Bauführer Gebäudehülle mit eidg. Fachausweis": keep the qualifier that follows the second form
      const aWords = a.split(" ");
      const bWords = b.split(" ");
      if (aWords.length === 1 && bWords.length > 1) {
        const rest = bWords.slice(1).join(" ").replace(/\s*mit eidg\. Fachausweis$/, " BP").replace(/\s*mit eidg\. Diplom$/, " HFP").replace(/\s*mit eidg\. FA$/, " BP");
        out = `${a} ${rest}`.trim();
      }
    }
  }
  return (out + (suffix ? " " + suffix : "")).trim();
}

/** A page title of at most 60 characters; the brand is added only when it fits. */
function fitTitle(base: string, parts: string[], brand = "Inspirella"): string {
  for (let n = parts.length; n >= 0; n--) {
    const t = n ? `${base}: ${parts.slice(0, n).join(", ")}` : base;
    if (`${t} | ${brand}`.length <= 60) return `${t} | ${brand}`;
    if (t.length <= 60) return t;
  }
  return truncate(base, 60);
}

const chf = (n: number) => `CHF ${Math.round(n).toLocaleString("de-CH")}`;
const monthsText = (a?: number | null, b?: number | null): string | undefined => {
  if (a == null || b == null) return undefined;
  const f = (m: number) => (m % 12 === 0 ? `${m / 12} ${m / 12 === 1 ? "Jahr" : "Jahre"}` : `${m} Monate`);
  return a === b ? f(a) : `${f(a)} bis ${f(b)}`;
};
const isoDate = (v: unknown): string | undefined => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined);
const sameText = (a?: string, b?: string) => !!a && !!b && a.replace(/\s+/g, " ").trim().toLowerCase() === b.replace(/\s+/g, " ").trim().toLowerCase();
const PLACEHOLDER = /Auf dem Berufsprofil nicht näher beschrieben/i;

function renderProfession(p: Row, slug: string, schools: Link[], ctx: Ctx): { html: string; indexable: boolean; lastmod?: string } {
  const title = txt(p.title_de) || txt(p.name_de) || slug;
  const url = `${SITE}/beruf/${slug}/`;
  const type = String(p.profession_type || "other");
  const hub = TYPE_HUBS[type] ?? TYPE_HUBS.other;
  const details = ctx.detailsByProf.get(String(p.id));
  const facts = ctx.factsByProf.get(String(p.id));
  const wages = (ctx.wagesByProf.get(String(p.id)) ?? []).sort((a, b) => a.year_no - b.year_no);
  const group = p.isco_group && p.isco_confidence !== "low" ? ctx.benchByGroup.get(String(p.isco_group)) : undefined;
  const bench = group?.total;

  const clean = (v: unknown) => {
    const t = txt(v);
    return t && !PLACEHOLDER.test(t) ? t : undefined;
  };
  const short = clean(p.short_description_de) || clean(p.role_summary_de) || clean(p.summary_de);
  const tasks = clean(p.role_summary_de) && !sameText(clean(p.role_summary_de), short) ? clean(p.role_summary_de) : clean(p.long_description_de);
  const daily = clean(p.daily_work_context_de);

  const traitText = (ids: unknown): string[] => (Array.isArray(ids) ? ids.map(i => txt(ctx.traits.get(Number(i))?.text_de)).filter((x): x is string => !!x) : []);
  const reqs = traitText(details?.requirement_ids);
  const ints = traitText(details?.interest_ids);

  const sections: [string, string | undefined][] = [
    ["Aufgaben", tasks],
    ["Alltag", daily && !sameText(daily, tasks) && !sameText(daily, short) ? daily : undefined],
    ["Arbeitsorte", clean(p.typical_workplace_de)],
    ["Werkzeuge", clean(p.core_tools_de)],
    ["Zugang", clean(p.admission_reality_de)],
    ["Bildungsweg", clean(p.education_notes_de)]
  ];
  // "Wer passt dazu?" now comes from the structured requirements/interests; the free text only when there are none.
  if (!reqs.length && !ints.length) sections.splice(4, 0, ["Wer passt dazu?", clean(p.target_group_de)]);
  const detail = sections.filter((s): s is [string, string] => !!s[1]);
  const progression = clean(p.progression_notes_de);

  const typeLabel = TYPE_LABELS[type];
  const duration = monthsText(details?.duration_min_months, details?.duration_max_months) || (facts?.duration_years ? `${String(facts.duration_years).replace(".", ",")} Jahre` : undefined);
  const wageLines = wages.map(w => `${w.year_no}. Lehrjahr: ${w.min_chf === w.max_chf ? chf(w.min_chf) : `${chf(w.min_chf)} bis ${chf(w.max_chf)}`} pro Monat`);
  const approx = p.isco_confidence === "medium" ? "ungefähr " : "";
  const groupName = bench ? String(bench.group_name_de).replace(/^\d+\s+/, "") : "";
  const medianText = bench ? `${approx}${chf(bench.median)} pro Monat (Median, brutto, Vollzeit; mittlere 50 %: ${chf(bench.p25)} bis ${chf(bench.p75)})` : undefined;
  const ageTexts = group ? (["bis29", "30-49", "ab50"] as const).filter(a => group[a]).map(a => `${a === "bis29" ? "bis 29 Jahre" : a === "30-49" ? "30–49 Jahre" : "ab 50 Jahre"}: ${chf(group[a].median)}`) : [];
  const bm = txt(facts?.bm_possible);
  const bmText = bm ? (/^(ja|yes|true)/i.test(bm) ? "Ja" : /^(nein|no|false)/i.test(bm) ? "Nein" : bm) : undefined;
  const follow = [...(Array.isArray(facts?.fh_followups) ? facts!.fh_followups : []), ...(Array.isArray(facts?.weiterbildung) ? facts!.weiterbildung : [])].map(txt).filter((x): x is string => !!x).slice(0, 8);
  const level = txt(facts?.school_level_de);

  const glance: [string, string][] = [];
  if (typeLabel) glance.push(["Abschluss", typeLabel]);
  if (duration) glance.push(["Dauer", duration]);
  if (wageLines.length) glance.push(["Lehrlingslohn", wageLines.join(" · ")]);
  if (medianText) glance.push([`Lohn im Beruf (Berufsgruppe «${groupName}»)`, medianText]);
  if (level) glance.push(["Voraussetzungen", level]);
  if (bmText) glance.push(["Berufsmaturität möglich", bmText]);
  if (follow.length) glance.push(["Nächste Stufe", follow.join(", ")]);
  const regLabel = REGULATED_LABELS[p.regulated_status as string];
  if (regLabel) glance.push(["Reglementierung", regLabel]);

  const guidance = safeUrl(details?.source_url) || safeUrl(facts?.source_url) || safeUrl(p.official_guidance_url) || "https://www.berufsberatung.ch/";
  const specific = guidance !== "https://www.berufsberatung.ch/" && guidance !== "https://www.berufsberatung.ch";
  const checked = isoDate(details?.retrieved_at) || isoDate(p.last_verified_at) || ctx.today;

  // related professions: the site's "similar" links first, then the same category
  const relatedCodes = [...(Array.isArray(details?.similar_codes) ? details!.similar_codes : [])];
  for (const c of ctx.profByCategory.get(String(p.profession_category_id)) ?? []) {
    if (relatedCodes.length >= 10) break;
    if (!relatedCodes.includes(c) && c !== p.code) relatedCodes.push(c);
  }
  const related: Link[] = relatedCodes
    .map(c => ctx.profByCode.get(String(c)))
    .filter((x): x is { slug: string; title: string } => !!x)
    .slice(0, 10)
    .map(x => ({ title: x.title, href: `/beruf/${x.slug}/` }));

  const totalText = [short, ...detail.map(d => d[1]), progression, ...glance.map(g => g[1])].filter(Boolean).join(" ");
  const indexable = totalText.length >= MIN_INDEXABLE_CHARS;
  const descBits = [short ? truncate(short, 110) : `${title}: Beruf in der Schweiz${typeLabel ? ` (${typeLabel})` : ""}.`, duration ? `Dauer: ${duration}.` : "", wageLines.length ? `Lehrlingslohn ab ${chf(wages[0].min_chf)}.` : bench ? `Lohn: Median ${chf(bench.median)}.` : ""].filter(Boolean);
  if (descBits.join(" ").length < 100) descBits.push(schools.length ? "Mit Schulen und Quelle." : "Mit Quelle und Hinweisen zur Ausbildung.");
  const description = truncate(descBits.join(" ") || title, 158);

  // questions people ask, answered only from data we hold
  const faq: [string, string][] = [];
  if (duration) faq.push([`Wie lange dauert die Ausbildung als ${shortTitle(title)}?`, `${title}: ${duration}.`]);
  if (wageLines.length || medianText) {
    const parts = [wageLines.length ? `Empfohlener Lehrlingslohn: ${wageLines.join("; ")}.` : "", medianText ? `In der Berufsgruppe «${groupName}» liegt der mittlere Monatslohn bei ${medianText}.` : ""].filter(Boolean);
    faq.push([`Was verdient man als ${shortTitle(title)}?`, parts.join(" ") + " Quelle: Berufsverbände (Lehrlingslohn) und Bundesamt für Statistik, Lohnstrukturerhebung 2024 (Berufsgruppe, nicht nur dieser Beruf)."]);
  }
  if (schools.length) faq.push([`Welche Schule braucht man für ${shortTitle(title)}?`, `In Inspirella sind ${schools.length} ${schools.length === 1 ? "Schule" : "Schulen"} zu diesem Beruf aufgeführt, zum Beispiel ${schools.slice(0, 3).map(s => s.title).join(", ")}.`]);
  if (bmText || follow.length) faq.push([`Kann man nach dem Abschluss ${shortTitle(title)} weiterstudieren?`, [bmText ? `Berufsmaturität: ${bmText}.` : "", follow.length ? `Mögliche nächste Stufen: ${follow.join(", ")}.` : ""].filter(Boolean).join(" ")]);

  const ld: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Occupation",
      name: title,
      description,
      url,
      occupationLocation: { "@type": "Country", name: "Schweiz" },
      ...(txt(p.sector) ? { occupationalCategory: txt(p.sector) } : {}),
      ...(typeLabel ? { educationRequirements: typeLabel } : {}),
      ...(bench
        ? {
            estimatedSalary: {
              "@type": "MonetaryAmountDistribution",
              name: `Monatslohn Berufsgruppe ${groupName} (BFS 2024)`,
              currency: "CHF",
              duration: "P1M",
              median: Math.round(bench.median),
              percentile10: Math.round(bench.p10),
              percentile25: Math.round(bench.p25),
              percentile75: Math.round(bench.p75),
              percentile90: Math.round(bench.p90)
            }
          }
        : {})
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inspirella", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Berufe", item: SITE + "/berufe/" },
        { "@type": "ListItem", position: 3, name: hub.label, item: `${SITE}/berufe/${hub.slug}/` },
        { "@type": "ListItem", position: 4, name: title, item: url }
      ]
    }
  ];
  if (faq.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });

  const chips = (title2: string, list: string[]) =>
    list.length ? `<section class="card"><h2>${esc(title2)}</h2><ul class="chips">${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : "";

  const main = `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/berufe/">Berufe</a> › <a href="/berufe/${hub.slug}/">${esc(hub.label)}</a> › ${esc(title)}</div>
  <header class="hero">
    <div class="badges">${typeLabel ? `<span class="badge">${esc(typeLabel)}</span>` : ""}${regLabel ? `<span class="badge warm">${esc(regLabel)}</span>` : ""}</div>
    <h1>${esc(title)}</h1>
    ${short ? `<p class="lead">${esc(short)}</p>` : ""}
    <div class="cta-row"><a class="btn btn-primary" href="/ressourcen/?beruf=${encodeURIComponent(String(p.code || ""))}">Beruf in Inspirella erkunden →</a></div>
  </header>
  ${glance.length ? `<section class="card"><h2>Auf einen Blick</h2><dl class="dl">${glance.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>${ageTexts.length ? `<p class="more">Mittlerer Lohn der Berufsgruppe nach Alter: ${esc(ageTexts.join(" · "))}.</p>` : ""}<p class="more">Lehrlingslohn: Empfehlung der Berufsverbände (berufsberatung.ch), der tatsächliche Lohn hängt von Region und Betrieb ab. Lohn im Beruf: Zahlen für die ganze Berufsgruppe, Bundesamt für Statistik, Lohnstrukturerhebung 2024.</p></section>` : ""}
  <div class="grid">
    <div>
      ${dlSection("Was macht man in diesem Beruf?", detail)}
      ${chips("Das solltest du mitbringen", reqs)}
      ${chips("Passt zu dir, wenn du gern …", ints)}
      ${progression ? `<section class="card"><h2>Wie geht es weiter?</h2><p style="margin:0">${esc(progression)}</p></section>` : ""}
      ${faq.length ? `<section class="card"><h2>Häufige Fragen</h2>${faq.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>` : ""}
    </div>
    <aside>
      ${linkListSection("Wo lernt man das?", schools, 100, n => `und ${n} weitere`)}
      ${linkListSection("Verwandte Berufe", related, 10, n => `und ${n} weitere`)}
    </aside>
  </div>
  <div class="source">Quelle &amp; Orientierung: Inspirella ist ein Orientierungswerkzeug. Verbindliche Informationen findest du ${
    specific ? `im <a href="${esc(guidance)}" rel="noopener">Berufsprofil auf berufsberatung.ch</a>` : `bei <a href="${esc(guidance)}" rel="noopener">berufsberatung.ch</a>`
  } und beim kantonalen Berufsinformationszentrum (BIZ). Zuletzt geprüft: ${esc(checked)}. <a href="/methodik/">So arbeiten wir</a>.</div>`;

  return {
    html: layout({ docTitle: fitTitle(shortTitle(title), [type === "apprenticeship_efz" || type === "apprenticeship_eba" ? "Lehre" : "Ausbildung", ...(wageLines.length || bench ? ["Lohn"] : []), ...(schools.length ? ["Schulen"] : [])]), ogTitle: `${shortTitle(title)} | Inspirella`, description, url, indexable, ld, main }),
    indexable,
    lastmod: isoDate(p.updated_at)
  };
}

// --------------------------------------------------------------------------
// Institution page
// --------------------------------------------------------------------------

const CANTON_NAMES: Record<string, string> = {
  AG: "Aargau", AI: "Appenzell Innerrhoden", AR: "Appenzell Ausserrhoden", BE: "Bern", BL: "Basel-Landschaft", BS: "Basel-Stadt", FR: "Freiburg", GE: "Genf", GL: "Glarus", GR: "Graubünden", JU: "Jura", LU: "Luzern", NE: "Neuenburg", NW: "Nidwalden", OW: "Obwalden", SG: "St. Gallen", SH: "Schaffhausen", SO: "Solothurn", SZ: "Schwyz", TG: "Thurgau", TI: "Tessin", UR: "Uri", VD: "Waadt", VS: "Wallis", ZG: "Zug", ZH: "Zürich"
};

function renderInstitution(i: Row, slug: string, professions: Link[]): { html: string; indexable: boolean; lastmod?: string } {
  const title = txt(i.title_de) || txt(i.name) || slug;
  const url = `${SITE}/institution/${slug}/`;

  const short = txt(i.short_description_de) || txt(i.summary_de) || txt(i.overview_de) || txt(i.description_de);
  const overview = txt(i.overview_de) || txt(i.description_de);
  const sections: [string, string | undefined][] = [
    ["Überblick", overview && overview !== short ? overview : undefined],
    ["Für wen passt die Schule?", txt(i.institution_profile_de)],
    ["Zulassung", txt(i.admissions_summary_de)],
    ["Bewerbung", txt(i.application_notes_de)],
    ["Unterrichtssprache", txt(i.language_environment_de)],
    ["Alltag & Leben", txt(i.student_life_de)],
    ["Internationale Studierende", txt(i.international_support_de)],
    ["Wohnen", txt(i.housing_notes_de)]
  ];
  const detail = sections.filter((s): s is [string, string] => !!s[1]);

  const totalText = [short, ...detail.map(d => d[1])].filter(Boolean).join(" ");
  const indexable = totalText.length >= MIN_INDEXABLE_CHARS;

  const typeLabel = INSTITUTION_TYPE_LABELS[i.institution_subgroup as string];
  const city = txt(i.city);
  const canton = txt(i.canton)?.toUpperCase();
  const cantonName = canton ? CANTON_NAMES[canton] : undefined;
  const address = txt(i.formatted_address)?.replace(/,\s*Switzerland$/i, "");
  const website = safeUrl(i.official_homepage_url) || safeUrl(i.website_url);
  const verified = isoDate(i.last_verified_at);

  // a unique description from the school's own facts, then its text
  const where = [city, cantonName ? `Kanton ${cantonName}` : canton].filter(Boolean).join(", ");
  const lead = `${typeLabel || "Schule"}${where ? ` in ${where}` : ""}.`;
  const descBits = [lead, professions.length ? `${professions.length} ${professions.length === 1 ? "Beruf" : "Berufe"} und Programme in Inspirella.` : "", short ? truncate(short, 100) : ""].filter(Boolean);
  const description = truncate(descBits.join(" "), 158);

  const facts: [string, string][] = [];
  if (typeLabel) facts.push(["Art", typeLabel]);
  if (city || canton) facts.push(["Standort", [city, cantonName ?? canton].filter(Boolean).join(", ")]);
  if (address) facts.push(["Adresse", address]);
  if (professions.length) facts.push(["Berufe in Inspirella", String(professions.length)]);

  const ld: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: title,
      description,
      url: website || url,
      ...(website ? { sameAs: [website] } : {}),
      address: { "@type": "PostalAddress", ...(city ? { addressLocality: city } : {}), ...(canton ? { addressRegion: canton } : {}), addressCountry: "CH" }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inspirella", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Schulen", item: SITE + "/schulen/" },
        ...(canton ? [{ "@type": "ListItem", position: 3, name: cantonName ?? canton, item: `${SITE}/schulen/${canton.toLowerCase()}/` }] : []),
        { "@type": "ListItem", position: canton ? 4 : 3, name: title, item: url }
      ]
    }
  ];

  const main = `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/schulen/">Schulen</a> › ${canton ? `<a href="/schulen/${esc(canton.toLowerCase())}/">${esc(cantonName ?? canton)}</a> › ` : ""}${esc(title)}</div>
  <header class="hero">
    <div class="badges">${typeLabel ? `<span class="badge">${esc(typeLabel)}</span>` : ""}${cantonName ? `<span class="badge warm">Kanton ${esc(cantonName)}</span>` : ""}</div>
    <h1>${esc(title)}</h1>
    ${short ? `<p class="lead">${esc(short)}</p>` : ""}
    <div class="cta-row"><a class="btn btn-primary" href="/karte/">Auf der Karte erkunden →</a>${website ? `<a class="btn btn-sec" href="${esc(website)}" rel="noopener">Offizielle Website</a>` : ""}</div>
  </header>
  ${factsHtml(facts)}
  <div class="grid">
    <div>
      ${dlSection("Über diese Schule", detail)}
    </div>
    <aside>
      ${linkListSection("Berufe und Programme", professions, 200, n => `und ${n} weitere`)}
    </aside>
  </div>
  <div class="source">Quelle &amp; Orientierung: Inspirella ist ein Orientierungswerkzeug. Verbindliche Informationen (Zulassung, Fristen, Kosten) findest du auf der ${
    website ? `<a href="${esc(website)}" rel="noopener">offiziellen Website der Schule</a>` : "offiziellen Website der Schule"
  } und beim kantonalen Berufsinformationszentrum (BIZ). Zuletzt geprüft: ${esc(verified || "siehe Methodik")}. <a href="/methodik/">So arbeiten wir</a>.</div>`;

  return {
    html: layout({ docTitle: fitTitle(title, ["Ausbildungen", "Zulassung"]), ogTitle: `${title} | Inspirella`, description, url, indexable, ld, main }),
    indexable,
    lastmod: isoDate(i.updated_at)
  };
}

// --------------------------------------------------------------------------
// Hub pages: all professions, one per diploma type, all schools, one per canton, and the methodology page
// --------------------------------------------------------------------------

function azList(items: Link[]): string {
  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title, "de"));
  const groups = new Map<string, Link[]>();
  for (const it of sorted) {
    const letter = (it.title.trim().charAt(0).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "") || "#").replace(/[^A-Z]/, "#");
    (groups.get(letter) ?? groups.set(letter, []).get(letter)!).push(it);
  }
  const letters = [...groups.keys()].sort();
  return `<p class="more">${letters.map(l => `<a href="#b-${l === "#" ? "x" : l}">${l}</a>`).join(" · ")}</p>` +
    letters.map(l => `<section class="card" id="b-${l === "#" ? "x" : l}"><h2>${esc(l)}</h2><ul class="cols">${groups.get(l)!.map(it => `<li><a href="${esc(it.href || "#")}">${esc(it.title)}${it.city ? ` <span>${esc(it.city)}</span>` : ""}</a></li>`).join("")}</ul></section>`).join("\n  ");
}

function renderHub(opts: { path: string; title: string; h1: string; lead: string; crumbs: [string, string?][]; body: string; description: string; ld?: object }): string {
  const url = SITE + opts.path;
  return layout({
    docTitle: truncate(opts.title, 60),
    ogTitle: opts.h1,
    description: truncate(opts.description, 158),
    url,
    indexable: true,
    ld: opts.ld ?? { "@context": "https://schema.org", "@type": "CollectionPage", name: opts.h1, url },
    main: `  <div class="crumbs">${opts.crumbs.map(([label, href]) => (href ? `<a href="${esc(href)}">${esc(label)}</a>` : esc(label))).join(" › ")}</div>
  <header class="hero"><h1>${esc(opts.h1)}</h1><p class="lead">${esc(opts.lead)}</p></header>
  ${opts.body}`
  });
}

function renderMethodology(counts: Counts): string {
  const url = `${SITE}/methodik/`;
  const items: [string, string][] = [
    ["Woher die Daten kommen", "Berufsbeschreibungen, Ausbildungsdauer, empfohlene Lehrlingslöhne und ähnliche Berufe stammen aus dem Berufsportal berufsberatung.ch (SDBB), Angaben zu Schulen aus den offiziellen Websites der Schulen und Kantone, Zulassungsregeln aus den Seiten der Kantone, der Hochschulen und von swissuniversities. Die Lohnzahlen im Beruf stammen vom Bundesamt für Statistik (Lohnstrukturerhebung 2024, nach Berufsgruppe)."],
    ["Wie Texte entstehen", "Inspirella fasst offizielle Quellen in eigenen Worten zusammen. Zahlen wie Fristen, Löhne oder Kosten werden aus den Quellen übernommen und nicht geschätzt: Fehlt eine Angabe, zeigen wir die Zeile nicht an."],
    ["Löhne richtig lesen", "Der Lehrlingslohn ist eine Empfehlung der Berufsverbände; Region und Lehrbetrieb bestimmen den tatsächlichen Lohn. Der Lohn im Beruf ist der Median (mittlerer Wert) einer ganzen Berufsgruppe, nicht eines einzelnen Berufs, brutto und auf Vollzeit umgerechnet. Die Zuordnung eines Berufs zu einer Berufsgruppe ist mit «ungefähr» gekennzeichnet, wenn sie nicht eindeutig ist."],
    ["«Verified» und «Provisional»", "«Verified» bedeutet: Die Angaben wurden mit einer offiziellen Quelle abgeglichen. «Provisional» bedeutet: Der Eintrag ist noch nicht vollständig geprüft oder stützt sich auf weniger eindeutige Quellen."],
    ["Aktualität", `Fristen und Bedingungen ändern sich jedes Jahr. Auf jeder Seite steht, wann der Eintrag zuletzt geprüft wurde, und ein Link zur offiziellen Quelle. Aktueller Stand des Katalogs: ${counts.professions} Berufe und Programme, ${counts.institutions} Schulen und Institutionen, ${counts.resources} Ressourcen (${dataDate()}).`],
    ["Fehler melden", "Wenn dir ein Fehler auffällt, schreib uns über die Kontaktseite der App. Wir korrigieren Angaben, sobald wir sie mit der Quelle abgeglichen haben."]
  ];
  return layout({
    docTitle: "Methodik: Quellen und Aktualität | Inspirella",
    ogTitle: "Methodik | Inspirella",
    description: "Woher die Daten von Inspirella stammen, wie Texte entstehen, wie Löhne zu lesen sind und was «Verified» und «Provisional» bedeuten.",
    url,
    indexable: true,
    ld: { "@context": "https://schema.org", "@type": "WebPage", name: "Methodik", url },
    main: `  <div class="crumbs"><a href="/">Inspirella</a> › Methodik</div>
  <header class="hero"><h1>Methodik: Quellen und Aktualität</h1><p class="lead">Orientierung ist nur nützlich, wenn man ihr vertrauen kann. Hier steht, woher unsere Angaben kommen und wie du sie lesen solltest.</p></header>
  <section class="card"><dl class="dl">${items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>
  <div class="source">Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle. Verbindliche Informationen findest du bei <a href="https://www.berufsberatung.ch/" rel="noopener">berufsberatung.ch</a> und beim kantonalen Berufsinformationszentrum (BIZ).</div>`
  });
}

// --------------------------------------------------------------------------
// About page
// --------------------------------------------------------------------------

interface Counts {
  professions: number;
  institutions: number;
  resources: number;
}

function renderAbout(counts: Counts): string {
  const t = TRANSLATIONS.de;
  const url = `${SITE}/ueber-inspirella/`;
  const description = truncate(t.aboutMissionBody || "Inspirella hilft dir, den passenden Bildungsweg in der Schweiz zu finden.", 155);

  const features: [string, string][] = [
    ["Berufe & Bildungswege", `Durchsuchbare Datenbank mit ${counts.professions} Berufen und Programmen (Lehre EFZ/EBA, Höhere Berufsbildung, Fachhochschule, Universität) – mit Alltag, Arbeitsorten, Entwicklungswegen und passenden Schulen.`],
    ["Schulen & Institutionen", `${counts.institutions} Schulen, Hochschulen und Weiterbildungszentren, mit Profil, Zulassung, Sprache und Standort – vergleichbar nebeneinander.`],
    ["Interaktive Karte", "Alle Institutionen auf einer Karte der Schweiz, mit Detailinformationen zu jedem Standort."],
    ["Persönlicher Weg", "Aus Interessen, Zielen und aktuellem Stand entsteht ein persönlicher Bildungsweg („My Path“) – als Leiter vom heutigen Stand zum Ziel."],
    ["Tracker", "Eigene Ziele und Schritte festhalten und den Fortschritt verfolgen (mit Konto)."],
    ["Ressourcen", `${counts.resources} geprüfte Ressourcen und offizielle Anlaufstellen zu Berufswahl, Ausbildung und Studium.`],
    ["Fünf Sprachen", "Deutsch, Französisch, Italienisch, Englisch und Ukrainisch."]
  ];

  const values: [string, string][] = [1, 2, 3, 4].map(n => [t[`aboutValue${n}Title`], t[`aboutValue${n}Desc`]] as [string, string]).filter(([a, b]) => a && b);

  const main = `  <div class="crumbs"><a href="/">Inspirella</a> › Über Inspirella</div>
  <header class="hero">
    <div class="badges"><span class="badge">Über Inspirella</span><span class="badge warm">Schweiz</span></div>
    <h1>${esc(t.aboutTitle || "Über Inspirella")}</h1>
    <p class="lead">Inspirella hilft Schülerinnen, Schülern, Lernenden, Eltern und Quereinsteigenden, sich im dualen Bildungssystem der Schweiz zurechtzufinden: Berufslehre, Gymnasium, Höhere Berufsbildung, Fachhochschule und Universität.</p>
    <div class="cta-row"><a class="btn btn-primary" href="/">Inspirella öffnen →</a></div>
  </header>
  ${factsHtml([
    ["Berufe & Programme", String(counts.professions)],
    ["Schulen & Institutionen", String(counts.institutions)],
    ["Ressourcen", String(counts.resources)],
    ["Sprachen", "DE · FR · IT · EN"],
    ["Stand der Daten", dataDate()]
  ])}
  <section class="card prose"><span class="eyebrow">${esc(t.aboutMissionEyebrow)}</span><p>${esc(t.aboutMissionBody)}</p><p>${esc(t.aboutPara1)}</p></section>
  <section class="card prose"><span class="eyebrow">${esc(t.aboutWhyEyebrow)}</span><p>${esc(t.aboutWhyBody)}</p></section>
  <section class="card"><h2>Was Inspirella bietet</h2><dl class="dl">${features.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>
  <section class="card"><h2>${esc(t.aboutValuesTitle)}</h2><dl class="dl">${values.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>
  <div class="note"><span class="eyebrow">${esc(t.aboutStageEyebrow)}</span>${esc(t.aboutStageBody)}</div>
  <section class="card prose" style="margin-top:22px"><span class="eyebrow">${esc(t.aboutWhoEyebrow)}</span><p>${esc(t.aboutWhoBody)}</p></section>
  <section class="card prose" style="margin-top:22px"><span class="eyebrow">${esc(t.aboutVisionEyebrow)}</span><p>${esc(t.aboutVisionBody)}</p></section>
  <div class="source">Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle. Verbindliche Informationen findest du bei <a href="https://www.berufsberatung.ch/" rel="noopener">berufsberatung.ch</a> und beim kantonalen Berufsinformationszentrum (BIZ).</div>`;

  return layout({
    docTitle: "Über Inspirella – Bildungswege in der Schweiz entdecken",
    ogTitle: "Über Inspirella",
    description,
    url,
    indexable: true,
    ld: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Inspirella",
      url: SITE + "/",
      logo: `${SITE}/logo-mark.png`,
      description
    },
    main
  });
}

// --------------------------------------------------------------------------
// The education system overview (/bildungssystem/ and its translations)
// --------------------------------------------------------------------------

type SysLang = "de" | "en" | "uk";

interface SysCopy {
  path: string;
  htmlLang: string;
  hreflang: string;
  title: string;
  h1: string;
  lead: string;
  description: string;
  crumb: string;
  cta: string;
  ctaNote: string;
  bands: Record<string, string>;
  duration: string;
  age: string;
  diploma: string;
  requirements: string;
  cantonal: string;
  good: string;
  official: string;
  waysTitle: string;
  waysLead: string;
  statusTitle: string;
  statusLead: string;
  factsNodes: string;
  factsWays: string;
  factsCantons: string;
  factsData: string;
  detailsNote: string;
  disclaimer: string;
  nav: { about: string; app: string };
}

const SYS: Record<SysLang, SysCopy> = {
  de: {
    path: "/bildungssystem/",
    htmlLang: "de",
    hreflang: "de",
    title: "Das Schweizer Bildungssystem auf einen Blick – alle Stufen und Wege | Inspirella",
    h1: "Das Schweizer Bildungssystem auf einen Blick",
    lead: "Von der Primarschule bis zur Weiterbildung: alle Stufen, wer wo einsteigen kann und wie man von einem Weg in einen anderen wechselt. Kurz erklärt, mit Quellen. Das Schweizer System ist durchlässig: Kein Abschluss ist eine Sackgasse.",
    description: "Alle Stufen des Schweizer Bildungssystems erklärt: Primarstufe, Sekundarstufe I und II, Berufslehre EFZ/EBA, Gymnasium, Berufsmatura, Fachhochschule, Universität und Wege dazwischen – mit offiziellen Quellen.",
    crumb: "Bildungssystem",
    cta: "Karte interaktiv öffnen →",
    ctaNote: "In der interaktiven Swiss Path Map wählst du deinen Kanton und siehst die Wege und Bedingungen dazu.",
    bands: { "-1": "Ankommen", "0": "Primarstufe", "1": "Sekundarstufe I", "2": "Sekundarstufe II", "3": "Tertiärstufe", "4": "Master, Doktorat, Weiterbildung" },
    duration: "Dauer",
    age: "Typisches Alter",
    diploma: "Abschluss",
    requirements: "Wer kann starten",
    cantonal: "Unterschiede zwischen den Kantonen",
    good: "Gut zu wissen",
    official: "Offizielle Seite",
    waysTitle: "Wege zwischen den Stufen",
    waysLead: "Wie man von einer Stufe zur nächsten kommt, auch über Umwege: Zweitausbildung, Passerelle, Berufsmatura und mehr.",
    statusTitle: "Mit Schutzstatus S (Ukraine)",
    statusLead: "Kurz und mit offiziellen Quellen: Schule, Sprache, Lehre, Diplome, Studium.",
    factsNodes: "Stufen",
    factsWays: "Wege dazwischen",
    factsCantons: "Kantone",
    factsData: "Stand der Daten",
    detailsNote: "",
    disclaimer: "Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle. Regeln unterscheiden sich je nach Kanton und Schule. Verbindliche Informationen findest du bei berufsberatung.ch, beim SBFI, bei der EDK, bei swissuniversities und beim kantonalen Berufsinformationszentrum (BIZ).",
    nav: { about: "Über Inspirella", app: "Zur App" }
  },
  en: {
    path: "/en/swiss-education-system/",
    htmlLang: "en",
    hreflang: "en",
    title: "The Swiss education system at a glance – every stage and route | Inspirella",
    h1: "The Swiss education system at a glance",
    lead: "From primary school to continuing education: every stage, who can start where, and how to move from one route to another. Short explanations with sources. The Swiss system is permeable: no qualification is a dead end.",
    description: "Every stage of the Swiss education system explained: primary, lower and upper secondary, apprenticeships (EFZ/EBA), Gymnasium, vocational Matura, universities of applied sciences, universities and the routes between them, with official sources.",
    crumb: "Education system",
    cta: "Open the interactive map →",
    ctaNote: "In the interactive Swiss Path Map you choose your canton and see the routes and conditions for it.",
    bands: { "-1": "Arriving", "0": "Primary", "1": "Lower secondary", "2": "Upper secondary", "3": "Tertiary", "4": "Master, doctorate, continuing education" },
    duration: "Duration",
    age: "Typical age",
    diploma: "Qualification",
    requirements: "Who can start",
    cantonal: "Differences between cantons",
    good: "Good to know",
    official: "Official page",
    waysTitle: "Routes between the stages",
    waysLead: "",
    statusTitle: "With protection status S (Ukraine)",
    statusLead: "Short and sourced from official pages: school, language, apprenticeship, diplomas, university.",
    factsNodes: "Stages",
    factsWays: "Routes between them",
    factsCantons: "Cantons",
    factsData: "Data as of",
    detailsNote: "Conditions, ages and cantonal details are available in German and Ukrainian on the other language versions of this page and in the interactive Swiss Path Map.",
    disclaimer: "Inspirella is an orientation tool, not an official authority. Rules differ by canton and school. For binding information see berufsberatung.ch, SERI, EDK, swissuniversities and your cantonal careers office (BIZ).",
    nav: { about: "About Inspirella", app: "Open the app" }
  },
  uk: {
    path: "/uk/systema-osvity-shveitsarii/",
    htmlLang: "uk",
    hreflang: "uk",
    title: "Система освіти Швейцарії: усі етапи й шляхи на одній сторінці | Inspirella",
    h1: "Система освіти Швейцарії: усі етапи й шляхи",
    lead: "Від початкової школи до підвищення кваліфікації: усі етапи, хто звідки може почати і як перейти з одного шляху на інший. Коротко, з джерелами. Швейцарська система гнучка: жоден диплом не веде в глухий кут.",
    description: "Система освіти Швейцарії простими словами: початкова й середня школа, професійне навчання з практикою (EFZ/EBA), гімназія, професійна матура, університети прикладних наук, університети та переходи між ними, з офіційними джерелами.",
    crumb: "Система освіти",
    cta: "Відкрити інтерактивну мапу →",
    ctaNote: "В інтерактивній Swiss Path Map ти обираєш свій кантон і бачиш шляхи та умови саме для нього.",
    bands: { "-1": "Прибуття", "0": "Початкова школа", "1": "Нижча середня школа (Sekundarstufe I)", "2": "Вища середня школа (Sekundarstufe II)", "3": "Вища освіта", "4": "Магістратура, докторантура, підвищення кваліфікації" },
    duration: "Тривалість",
    age: "Типовий вік",
    diploma: "Кваліфікація",
    requirements: "Хто може почати",
    cantonal: "Відмінності між кантонами",
    good: "Корисно знати",
    official: "Офіційна сторінка",
    waysTitle: "Переходи між етапами",
    waysLead: "Як потрапити з одного етапу на наступний, зокрема обхідними шляхами: друга професія, пасерель, професійна матура та інше.",
    statusTitle: "Зі статусом захисту S (Україна)",
    statusLead: "Коротко й з офіційними джерелами: школа, мова, професійне навчання з практикою (Lehre), дипломи, університет.",
    factsNodes: "Етапів",
    factsWays: "Переходів між ними",
    factsCantons: "Кантонів",
    factsData: "Дані станом на",
    detailsNote: "",
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Правила різняться залежно від кантону й школи. Обов’язкову інформацію шукай на berufsberatung.ch, у SBFI, EDK, swissuniversities і в кантональному центрі профорієнтації (BIZ). Тексти взято з офіційних німецькомовних джерел і перекладено.",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" }
  }
};

const MONTHS_UK = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --------------------------------------------------------------------------
// Protection status S guide: a hub plus one page per canton (German, English, Ukrainian)
// Built only from verified audience_facts rows; nothing is added that is not in the data.
// --------------------------------------------------------------------------

type SLang = "de" | "en" | "uk";

const CANTON_NAMES_I18N: Record<"en" | "uk", Record<string, string>> = {
  en: { AG: "Aargau", AI: "Appenzell Innerrhoden", AR: "Appenzell Ausserrhoden", BE: "Bern", BL: "Basel-Landschaft", BS: "Basel-Stadt", FR: "Fribourg", GE: "Geneva", GL: "Glarus", GR: "Graubünden", JU: "Jura", LU: "Lucerne", NE: "Neuchâtel", NW: "Nidwalden", OW: "Obwalden", SG: "St. Gallen", SH: "Schaffhausen", SO: "Solothurn", SZ: "Schwyz", TG: "Thurgau", TI: "Ticino", UR: "Uri", VD: "Vaud", VS: "Valais", ZG: "Zug", ZH: "Zurich" },
  uk: { AG: "Аргау", AI: "Аппенцелль-Іннерроден", AR: "Аппенцелль-Ауссерроден", BE: "Берн", BL: "Базель-Ландшафт", BS: "Базель-Штадт", FR: "Фрібур", GE: "Женева", GL: "Гларус", GR: "Граубюнден", JU: "Юра", LU: "Люцерн", NE: "Невшатель", NW: "Нідвальден", OW: "Обвальден", SG: "Санкт-Галлен", SH: "Шаффгаузен", SO: "Золотурн", SZ: "Швіц", TG: "Тургау", TI: "Тічино", UR: "Урі", VD: "Во", VS: "Вале", ZG: "Цуг", ZH: "Цюрих" }
};

const STATUS_TOPIC_ORDER = ["contact", "school_registration", "school_language_support", "language_courses", "youth_transition"];

interface StatusCopy {
  base: string;
  htmlLang: string;
  hubTitle: string;
  hubH1: string;
  hubLead: string;
  hubDescription: string;
  crumb: string;
  nationalTitle: string;
  cantonsTitle: string;
  cantonsLead: string;
  otherCantons: string;
  cantonTitles: (name: string) => string[];
  cantonH1: (name: string) => string;
  cantonLead: (name: string) => string;
  cantonDescription: (name: string) => string;
  more: string;
  cta: string;
  ctaNote: string;
  official: string;
  disclaimer: string;
  updated: string;
  nav: { about: string; app: string };
}

const STATUS_S: Record<SLang, StatusCopy> = {
  de: {
    base: "/status-s/",
    htmlLang: "de",
    hubTitle: "Schutzstatus S: Schule, Sprache und Lehre nach Kanton",
    hubH1: "Schutzstatus S in der Schweiz: Schule, Sprache und Lehre",
    hubLead: "Du bist mit Schutzstatus S (Ukraine) in die Schweiz gekommen oder begleitest jemanden? Hier steht, wo du anfängst, und für jeden Kanton, wo du dich meldest: Schule, Deutschkurse, Berufsbildung und Kontaktstellen. Jede Angabe führt zur offiziellen Seite.",
    hubDescription: "Schutzstatus S in der Schweiz: Schule anmelden, Deutschkurse, Lehre und Diplome. Kontaktstellen und Wege in jedem Kanton, mit offiziellen Quellen.",
    crumb: "Schutzstatus S",
    nationalTitle: "Das Wichtigste für die ganze Schweiz",
    cantonsTitle: "Wähle deinen Kanton",
    cantonsLead: "Schule, Sprache und Berufsbildung sind Sache der Kantone. Darum unterscheiden sich Anmeldung, Kurse und Ansprechstellen.",
    otherCantons: "Andere Kantone",
    cantonTitles: n => [`Schutzstatus S im Kanton ${n}: Schule, Deutsch, Lehre`, `Schutzstatus S im Kanton ${n}`, `Status S: ${n}`],
    cantonH1: n => `Schutzstatus S im Kanton ${n}`,
    cantonLead: n => `Schule, Deutschkurse und Berufsbildung für Personen mit Schutzstatus S im Kanton ${n}: Anmeldung, Kontaktstellen und Angebote, jeweils mit Link auf die offizielle Seite.`,
    cantonDescription: n => `Schutzstatus S im Kanton ${n}: Schule anmelden, Deutschkurse, Integrationsangebote und Lehre. Kontaktstellen und offizielle Quellen.`,
    more: "Mehr dazu",
    cta: "Swiss Path Map öffnen →",
    ctaNote: "In der interaktiven Karte siehst du die Wege vom Ankommen bis zum Abschluss.",
    official: "Offizielle Seite →",
    disclaimer: "Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle. Regeln, Fristen und Kontaktdaten ändern sich: bitte immer auf der offiziellen Seite prüfen.",
    updated: "Zuletzt aktualisiert",
    nav: { about: "Über Inspirella", app: "Zur App" }
  },
  en: {
    base: "/en/status-s/",
    htmlLang: "en",
    hubTitle: "Protection status S in Switzerland: school, language, work",
    hubH1: "Protection status S in Switzerland: school, language and apprenticeships",
    hubLead: "Did you come to Switzerland with protection status S (Ukraine), or are you helping someone who did? Here is where to start, and for each canton where to register: school, German courses, vocational training and contact points. Every item links to the official page.",
    hubDescription: "Protection status S in Switzerland: register for school, German courses, apprenticeships and diplomas. Contact points and routes in every canton, with official sources.",
    crumb: "Status S",
    nationalTitle: "The essentials for all of Switzerland",
    cantonsTitle: "Choose your canton",
    cantonsLead: "School, language and vocational training are run by the cantons, so registration, courses and contact points differ.",
    otherCantons: "Other cantons",
    cantonTitles: n => [`Status S in Canton ${n}: school, German, apprenticeship`, `Protection status S in Canton ${n}`, `Status S: ${n}`],
    cantonH1: n => `Protection status S in Canton ${n}`,
    cantonLead: n => `School, German courses and vocational training for people with protection status S in Canton ${n}: registration, contact points and programmes, each with a link to the official page.`,
    cantonDescription: n => `Protection status S in Canton ${n}: register for school, German courses, integration programmes and apprenticeships. Contact points and official sources.`,
    more: "More",
    cta: "Open the Swiss Path Map →",
    ctaNote: "The interactive map shows the routes from arriving to a qualification.",
    official: "Official page →",
    disclaimer: "Inspirella is an orientation tool, not an official authority. Rules, deadlines and contact details change: please always check the official page. Texts are based on official German-language sources and translated.",
    updated: "Last updated",
    nav: { about: "About Inspirella", app: "Open the app" }
  },
  uk: {
    base: "/uk/status-s/",
    htmlLang: "uk",
    hubTitle: "Статус S у Швейцарії: школа, мова, навчання за кантонами",
    hubH1: "Статус захисту S у Швейцарії: школа, мова і професійне навчання",
    hubLead: "Ти приїхав(ла) до Швейцарії зі статусом захисту S (Україна) або допомагаєш комусь? Тут написано, з чого почати, і для кожного кантону, куди звертатися: школа, курси німецької, професійне навчання та контакти. Кожен пункт веде на офіційну сторінку.",
    hubDescription: "Статус захисту S у Швейцарії: запис до школи, курси німецької, професійне навчання (Lehre) і дипломи. Контакти та шляхи в кожному кантоні, з офіційними джерелами.",
    crumb: "Статус S",
    nationalTitle: "Найважливіше для всієї Швейцарії",
    cantonsTitle: "Обери свій кантон",
    cantonsLead: "Школа, мова і професійне навчання — справа кантонів, тому запис, курси та контакти відрізняються.",
    otherCantons: "Інші кантони",
    cantonTitles: n => [`Статус S у кантоні ${n}: школа, мова, навчання`, `Статус захисту S у кантоні ${n}`, `Статус S: ${n}`],
    cantonH1: n => `Статус захисту S у кантоні ${n}`,
    cantonLead: n => `Школа, курси німецької та професійне навчання для людей зі статусом захисту S у кантоні ${n}: запис, контакти й програми, кожен пункт з посиланням на офіційну сторінку.`,
    cantonDescription: n => `Статус захисту S у кантоні ${n}: запис до школи, курси німецької, програми інтеграції та професійне навчання. Контакти й офіційні джерела.`,
    more: "Детальніше",
    cta: "Відкрити Swiss Path Map →",
    ctaNote: "В інтерактивній мапі видно шляхи від прибуття до диплома.",
    official: "Офіційна сторінка →",
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Правила, строки й контакти змінюються: завжди перевіряй офіційну сторінку. Тексти взято з офіційних німецькомовних джерел і перекладено.",
    updated: "Востаннє оновлено",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" }
  }
};

function statusCantonName(lang: SLang, code: string): string {
  return lang === "de" ? CANTON_NAMES[code] : CANTON_NAMES_I18N[lang][code];
}

function statusFact(f: Row, lang: SLang): { head: string; body: string; href?: string } | undefined {
  const head = txt(f[`headline_${lang}`]);
  const body = txt(f[`text_${lang}`]);
  if (!head || !body) return undefined;
  return { head, body, href: safeUrl(f.official_url) ?? safeUrl(f.evidence_url) };
}

function statusSections(facts: Row[], lang: SLang): string {
  const c = STATUS_S[lang];
  return facts
    .map(f => {
      const p = statusFact(f, lang)!;
      return `<section class="card prose"><h2>${esc(p.head)}</h2><p>${esc(p.body)}</p>${p.href ? `<p class="more"><a href="${esc(p.href)}" rel="noopener">${esc(c.official)}</a></p>` : ""}</section>`;
    })
    .join("\n  ");
}

function statusDate(lang: SLang, iso: string): string {
  const d = new Date(iso);
  return lang === "de" ? dataDate(d) : lang === "en" ? `${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()}` : `${MONTHS_UK[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function newest(rows: Row[], fallback: string): string {
  const dates = rows.map(r => String(r.updated_at || "").slice(0, 10)).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : fallback;
}

function renderStatusPage(lang: SLang, canton: string | null, national: Row[], byCanton: Map<string, Row[]>, availableIn: (code: string) => SLang[], today: string): string {
  const c = STATUS_S[lang];
  const hubUrl = SITE + c.base;
  const cantonCodes = [...byCanton.keys()].filter(code => availableIn(code).includes(lang)).sort((a, b) => statusCantonName(lang, a).localeCompare(statusCantonName(lang, b), lang));
  const path = canton ? `${c.base}${canton.toLowerCase()}/` : c.base;
  const url = SITE + path;

  const facts = canton
    ? [...(byCanton.get(canton) ?? [])].filter(f => statusFact(f, lang)).sort((a, b) => STATUS_TOPIC_ORDER.indexOf(String(a.topic)) - STATUS_TOPIC_ORDER.indexOf(String(b.topic)))
    : national.filter(f => statusFact(f, lang));
  const updated = newest(facts, today);

  const name = canton ? statusCantonName(lang, canton) : "";
  const brand = " | Inspirella";
  const titles = canton ? c.cantonTitles(name) : [c.hubTitle];
  const base = titles.find(t => t.length + brand.length <= 60) ?? titles.find(t => t.length <= 60) ?? truncate(titles[titles.length - 1], 60);
  const docTitle = base.length + brand.length <= 60 ? base + brand : base;
  const h1 = canton ? c.cantonH1(name) : c.hubH1;
  const lead = canton ? c.cantonLead(name) : c.hubLead;
  const description = truncate(canton ? c.cantonDescription(name) : c.hubDescription, 158);

  const cantonList = (exclude?: string) =>
    `<ul class="cols">${cantonCodes.filter(code => code !== exclude).map(code => `<li><a href="${c.base}${code.toLowerCase()}/" lang="${c.htmlLang}">${esc(statusCantonName(lang, code))}</a></li>`).join("")}</ul>`;

  const body = canton
    ? `${statusSections(facts, lang)}
  <h2 style="margin-top:34px">${esc(c.otherCantons)}</h2>
  <section class="card">${cantonList(canton)}</section>
  <p class="more"><a href="${c.base}">${esc(c.crumb)}</a></p>`
    : `<h2 style="margin-top:6px">${esc(c.nationalTitle)}</h2>
  ${statusSections(facts, lang)}
  <h2 style="margin-top:34px">${esc(c.cantonsTitle)}</h2>
  <section class="card"><p>${esc(c.cantonsLead)}</p>${cantonList()}</section>`;

  const alternates: { lang: string; href: string }[] = (["de", "en", "uk"] as SLang[])
    .filter(l => canton === null || availableIn(canton).includes(l))
    .map(l => ({ lang: l, href: SITE + (canton ? `${STATUS_S[l].base}${canton.toLowerCase()}/` : STATUS_S[l].base) }));
  alternates.push({ lang: "x-default", href: SITE + (canton ? `${STATUS_S.de.base}${canton.toLowerCase()}/` : STATUS_S.de.base) });

  const crumbs = canton
    ? `<a href="/">Inspirella</a> › <a href="${c.base}">${esc(c.crumb)}</a> › ${esc(name)}`
    : `<a href="/">Inspirella</a> › ${esc(c.crumb)}`;
  const ldCrumbs = [{ name: "Inspirella", item: SITE + "/" }, { name: c.crumb, item: hubUrl }, ...(canton ? [{ name, item: url }] : [])];

  return layout({
    docTitle,
    ogTitle: h1,
    description,
    url,
    indexable: facts.length > 0,
    lang: c.htmlLang,
    alternates,
    nav: c.nav,
    ld: [
      { "@context": "https://schema.org", "@type": "Article", headline: h1, url, inLanguage: c.htmlLang, description, dateModified: updated, publisher: { "@type": "Organization", name: "Inspirella", url: SITE + "/" } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: ldCrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.item })) }
    ],
    main: `  <div class="crumbs">${crumbs}</div>
  <header class="hero"><h1>${esc(h1)}</h1><p class="lead">${esc(lead)}</p>${canton ? "" : `<div class="cta-row"><a class="btn btn-primary" href="/pathmap/">${esc(c.cta)}</a></div><p class="more" style="margin:0">${esc(c.ctaNote)}</p>`}</header>
  ${body}
  <div class="source">${esc(c.disclaimer)} ${esc(c.updated)}: ${esc(statusDate(lang, updated))}.</div>`
  });
}

// --------------------------------------------------------------------------
// Bridge programmes (Brückenangebote) by canton and the adult-qualification guide (German, Ukrainian)
// Built only from education_programs / education_nodes rows; nothing is added that is not in the data.
// --------------------------------------------------------------------------

type GLang = "de" | "uk";

const BRIDGE_KIND_ORDER = ["bridge_year", "vorlehre", "integration_vorlehre", "motivation_semester", "other"];

interface GuideCopy {
  bridgeBase: string;
  adultPath: string;
  htmlLang: string;
  nav: { about: string; app: string };
  updated: string;
  official: string;
  disclaimer: string;
  crumb: string;
  bridgeHubTitles: string[];
  bridgeHubH1: string;
  bridgeHubDescription: string;
  bridgeCantonsTitle: string;
  bridgeCantonsLead: string;
  bridgeCantonTitles: (n: string) => string[];
  bridgeCantonH1: (n: string) => string;
  bridgeCantonLead: (n: string) => string;
  bridgeCantonDescription: (n: string) => string;
  otherCantons: string;
  goodTitle: string;
  kinds: Record<string, string>;
  dl: { target: string; duration: string; admission: string; provider: string };
  statusLink: string;
  adultLink: string;
  bridgeLink: string;
  adultTitles: string[];
  adultH1: string;
  adultDescription: string;
  adultFacts: Record<string, string>;
  adultCrumb: string;
  adultCta: string;
}

const GUIDES: Record<GLang, GuideCopy> = {
  de: {
    bridgeBase: "/brueckenangebote/",
    adultPath: "/berufsabschluss-fuer-erwachsene/",
    htmlLang: "de",
    nav: { about: "Über Inspirella", app: "Zur App" },
    updated: "Zuletzt aktualisiert",
    official: "Offizielle Seite →",
    disclaimer: "Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle. Anmeldefristen, Voraussetzungen und Angebote ändern sich: bitte immer auf der offiziellen Seite prüfen. Verbindliche Auskunft gibt das kantonale Berufsinformationszentrum (BIZ).",
    crumb: "Brückenangebote",
    bridgeHubTitles: ["Brückenangebote nach Kanton: Vorlehre, Brückenjahr", "Brückenangebote nach Kanton"],
    bridgeHubH1: "Brückenangebote in der Schweiz: Übersicht nach Kanton",
    bridgeHubDescription: "Brückenangebote nach der obligatorischen Schule: Vorlehre, Berufsvorbereitungsjahr, Integrationsvorlehre und Motivationssemester in jedem Kanton, mit Zulassung und Quellen.",
    bridgeCantonsTitle: "Wähle deinen Kanton",
    bridgeCantonsLead: "Brückenangebote werden von den Kantonen organisiert. Darum unterscheiden sich Namen, Voraussetzungen und Anmeldung.",
    bridgeCantonTitles: n => [`Brückenangebote im Kanton ${n}: Vorlehre, Brückenjahr`, `Brückenangebote im Kanton ${n}`, `Brückenangebote: ${n}`],
    bridgeCantonH1: n => `Brückenangebote im Kanton ${n}`,
    bridgeCantonLead: n => `Vorlehre, Berufsvorbereitungsjahr, Integrationsvorlehre und weitere Angebote zwischen Schule und Lehre im Kanton ${n}: für wen sie gedacht sind, wie man sich anmeldet und wo die offizielle Seite ist.`,
    bridgeCantonDescription: n => `Brückenangebote im Kanton ${n}: Vorlehre, Berufsvorbereitungsjahr und Integrationsvorlehre mit Zielgruppe, Zulassung und offiziellen Quellen.`,
    otherCantons: "Andere Kantone",
    goodTitle: "Gut zu wissen",
    kinds: { bridge_year: "Brückenjahr / Berufsvorbereitungsjahr", vorlehre: "Vorlehre", integration_vorlehre: "Integrationsvorlehre", motivation_semester: "Motivationssemester", other: "Weitere Angebote" },
    dl: { target: "Für wen", duration: "Dauer", admission: "Zulassung und Anmeldung", provider: "Anbieter" },
    statusLink: "Mit Schutzstatus S: Angebote nach Kanton",
    adultLink: "Berufsabschluss für Erwachsene",
    bridgeLink: "Brückenangebote nach Kanton",
    adultTitles: ["Berufsabschluss für Erwachsene: EFZ nachholen", "Berufsabschluss für Erwachsene"],
    adultH1: "Berufsabschluss für Erwachsene: EFZ oder EBA nachholen",
    adultDescription: "Berufsabschluss für Erwachsene in der Schweiz: vier Wege zum EFZ oder EBA (reguläre Lehre, verkürzte Lehre, Artikel 32, Validierung), mit offizieller Quelle.",
    adultFacts: { duration: "Dauer", typical_age: "Typisches Alter", diploma: "Abschluss", requirements: "Wer kann starten", cantonal_note: "Unterschiede zwischen den Kantonen" },
    adultCrumb: "Berufsabschluss für Erwachsene",
    adultCta: "Swiss Path Map öffnen →"
  },
  uk: {
    bridgeBase: "/uk/perekhidni-prohramy/",
    adultPath: "/uk/diplom-dlia-doroslykh/",
    htmlLang: "uk",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" },
    updated: "Востаннє оновлено",
    official: "Офіційна сторінка →",
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Строки подання, вимоги й пропозиції змінюються: завжди перевіряй офіційну сторінку. Обов’язкову інформацію дає кантональний центр профорієнтації (BIZ). Тексти взято з офіційних німецькомовних джерел і перекладено.",
    crumb: "Перехідні програми",
    bridgeHubTitles: ["Перехідні програми у Швейцарії за кантонами", "Перехідні програми за кантонами"],
    bridgeHubH1: "Перехідні програми у Швейцарії: огляд за кантонами",
    bridgeHubDescription: "Перехідні програми після обов’язкової школи: Vorlehre, підготовчий рік, Integrationsvorlehre і мотиваційний семестр у кожному кантоні, з умовами вступу та джерелами.",
    bridgeCantonsTitle: "Обери свій кантон",
    bridgeCantonsLead: "Перехідні програми організують кантони, тому назви, вимоги й запис відрізняються.",
    bridgeCantonTitles: n => [`Перехідні програми у кантоні ${n}: Vorlehre, рік`, `Перехідні програми у кантоні ${n}`, `Програми: ${n}`],
    bridgeCantonH1: n => `Перехідні програми у кантоні ${n}`,
    bridgeCantonLead: n => `Vorlehre, підготовчий рік, Integrationsvorlehre та інші програми між школою і Lehre у кантоні ${n}: для кого вони, як записатися і де офіційна сторінка.`,
    bridgeCantonDescription: n => `Перехідні програми у кантоні ${n}: Vorlehre, підготовчий рік і Integrationsvorlehre з цільовою групою, умовами вступу та офіційними джерелами.`,
    otherCantons: "Інші кантони",
    goodTitle: "Корисно знати",
    kinds: { bridge_year: "Підготовчий рік", vorlehre: "Vorlehre", integration_vorlehre: "Integrationsvorlehre", motivation_semester: "Мотиваційний семестр", other: "Інші програми" },
    dl: { target: "Для кого", duration: "Тривалість", admission: "Вступ і запис", provider: "Організатор" },
    statusLink: "Зі статусом S: пропозиції за кантонами",
    adultLink: "Диплом для дорослих",
    bridgeLink: "Перехідні програми за кантонами",
    adultTitles: ["Диплом EFZ для дорослих у Швейцарії: 4 шляхи", "Диплом для дорослих у Швейцарії"],
    adultH1: "Професійний диплом для дорослих: EFZ або EBA",
    adultDescription: "Професійний диплом для дорослих у Швейцарії: чотири шляхи до EFZ або EBA (звичайне навчання, скорочене, стаття 32, валідація), з офіційним джерелом.",
    adultFacts: { duration: "Тривалість", typical_age: "Типовий вік", diploma: "Кваліфікація", requirements: "Хто може почати", cantonal_note: "Відмінності між кантонами" },
    adultCrumb: "Диплом для дорослих",
    adultCta: "Відкрити Swiss Path Map →"
  }
};

function guideField(row: Row, base: string, lang: GLang): string | undefined {
  return txt(row[`${base}_${lang}`]);
}

function pickTitle(titles: string[]): { docTitle: string } {
  const brand = " | Inspirella";
  const base = titles.find(t => t.length <= 60) ?? truncate(titles[titles.length - 1], 60);
  return { docTitle: base.length + brand.length <= 60 ? base + brand : base };
}

function guideAlternates(pathFor: (l: GLang) => string, langs: GLang[]): { lang: string; href: string }[] {
  const alts: { lang: string; href: string }[] = langs.map(l => ({ lang: l, href: SITE + pathFor(l) }));
  alts.push({ lang: "x-default", href: SITE + pathFor("de") });
  return alts;
}

function renderBridgePage(lang: GLang, canton: string | null, byCanton: Map<string, Row[]>, availableIn: (code: string) => GLang[], node: Row | undefined, today: string): string {
  const c = GUIDES[lang];
  const cantonCodes = [...byCanton.keys()].filter(code => availableIn(code).includes(lang)).sort((a, b) => statusCantonName(lang, a).localeCompare(statusCantonName(lang, b), lang));
  const path = canton ? `${c.bridgeBase}${canton.toLowerCase()}/` : c.bridgeBase;
  const url = SITE + path;
  const name = canton ? statusCantonName(lang, canton) : "";
  const rows = canton ? (byCanton.get(canton) ?? []).filter(r => guideField(r, "title", lang) && guideField(r, "description", lang)) : [];
  const updated = newest(canton ? rows : [...byCanton.values()].flat(), today);

  const cantonList = (exclude?: string) =>
    `<ul class="cols">${cantonCodes.filter(code => code !== exclude).map(code => `<li><a href="${c.bridgeBase}${code.toLowerCase()}/" lang="${c.htmlLang}">${esc(statusCantonName(lang, code))}</a></li>`).join("")}</ul>`;

  const card = (r: Row): string => {
    const dl = [
      [c.dl.target, guideField(r, "target_group", lang)],
      [c.dl.duration, guideField(r, "duration_text", lang)],
      [c.dl.admission, guideField(r, "admission", lang)],
      [c.dl.provider, txt(r.provider_name)]
    ].filter(([, v]) => v);
    const href = safeUrl(r.official_url) ?? safeUrl(r.evidence_url);
    return `<section class="card prose"><h3>${esc(guideField(r, "title", lang)!)}</h3><p>${esc(guideField(r, "description", lang)!)}</p><dl class="dl">${dl.map(([k, v]) => `<div><dt>${esc(k as string)}</dt><dd>${esc(v as string)}</dd></div>`).join("")}</dl>${href ? `<p class="more"><a href="${esc(href)}" rel="noopener">${esc(c.official)}</a></p>` : ""}</section>`;
  };

  let body: string;
  if (canton) {
    const groups = BRIDGE_KIND_ORDER.map(kind => ({ kind, items: rows.filter(r => String(r.kind) === kind) })).filter(g => g.items.length);
    body = `${groups.map(g => `<h2 style="margin-top:30px">${esc(c.kinds[g.kind])}</h2>\n  ${g.items.map(card).join("\n  ")}`).join("\n  ")}
  <h2 style="margin-top:34px">${esc(c.otherCantons)}</h2>
  <section class="card">${cantonList(canton)}</section>
  <p class="more"><a href="${c.bridgeBase}">${esc(c.bridgeLink)}</a> · <a href="${GUIDES[lang].adultPath}">${esc(c.adultLink)}</a></p>`;
  } else {
    const good = Array.isArray(node?.[`good_to_know_${lang}`]) ? (node![`good_to_know_${lang}`] as unknown[]).map(txt).filter((x): x is string => !!x) : [];
    const official = node ? safeUrl(node.official_url) : undefined;
    body = `${good.length ? `<section class="card prose"><h2>${esc(c.goodTitle)}</h2><ul>${good.map(g => `<li>${esc(g)}</li>`).join("")}</ul>${official ? `<p class="more"><a href="${esc(official)}" rel="noopener">${esc(c.official)}</a></p>` : ""}</section>` : ""}
  <h2 style="margin-top:34px">${esc(c.bridgeCantonsTitle)}</h2>
  <section class="card"><p>${esc(c.bridgeCantonsLead)}</p>${cantonList()}</section>
  <p class="more"><a href="${STATUS_S[lang].base}">${esc(c.statusLink)}</a> · <a href="${c.adultPath}">${esc(c.adultLink)}</a></p>`;
  }

  const h1 = canton ? c.bridgeCantonH1(name) : c.bridgeHubH1;
  const nodeSummary = node ? guideField(node, "summary", lang) : undefined;
  const lead = canton ? c.bridgeCantonLead(name) : nodeSummary ?? c.bridgeHubDescription;
  const description = truncate(canton ? c.bridgeCantonDescription(name) : c.bridgeHubDescription, 158);
  const { docTitle } = pickTitle(canton ? c.bridgeCantonTitles(name) : c.bridgeHubTitles);
  const crumbs = canton ? `<a href="/">Inspirella</a> › <a href="${c.bridgeBase}">${esc(c.crumb)}</a> › ${esc(name)}` : `<a href="/">Inspirella</a> › ${esc(c.crumb)}`;
  const ldCrumbs = [{ name: "Inspirella", item: SITE + "/" }, { name: c.crumb, item: SITE + c.bridgeBase }, ...(canton ? [{ name, item: url }] : [])];
  const alternates = guideAlternates(l => (canton ? `${GUIDES[l].bridgeBase}${canton.toLowerCase()}/` : GUIDES[l].bridgeBase), canton ? availableIn(canton) : (["de", "uk"] as GLang[]));

  return layout({
    docTitle,
    ogTitle: h1,
    description,
    url,
    indexable: canton ? rows.length > 0 : true,
    lang: c.htmlLang,
    alternates,
    nav: c.nav,
    ld: [
      { "@context": "https://schema.org", "@type": "Article", headline: h1, url, inLanguage: c.htmlLang, description, dateModified: updated, publisher: { "@type": "Organization", name: "Inspirella", url: SITE + "/" } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: ldCrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.item })) }
    ],
    main: `  <div class="crumbs">${crumbs}</div>
  <header class="hero"><h1>${esc(h1)}</h1><p class="lead">${esc(lead)}</p></header>
  ${body}
  <div class="source">${esc(c.disclaimer)} ${esc(c.updated)}: ${esc(statusDate(lang, updated))}.</div>`
  });
}

function renderAdultGuide(lang: GLang, node: Row, today: string): string {
  const c = GUIDES[lang];
  const url = SITE + c.adultPath;
  const summary = guideField(node, "summary", lang) ?? c.adultDescription;
  const facts = Object.entries(c.adultFacts)
    .map(([key, label]) => [label, guideField(node, key, lang)] as [string, string | undefined])
    .filter((r): r is [string, string] => !!r[1]);
  const good = Array.isArray(node[`good_to_know_${lang}`]) ? (node[`good_to_know_${lang}`] as unknown[]).map(txt).filter((x): x is string => !!x) : [];
  const official = safeUrl(node.official_url);
  const updated = newest([node], today);
  const h1 = c.adultH1;
  const description = truncate(c.adultDescription, 158);
  const { docTitle } = pickTitle(c.adultTitles);
  const crumbs = `<a href="/">Inspirella</a> › ${esc(c.adultCrumb)}`;
  return layout({
    docTitle,
    ogTitle: h1,
    description,
    url,
    indexable: true,
    lang: c.htmlLang,
    alternates: guideAlternates(l => GUIDES[l].adultPath, ["de", "uk"]),
    nav: c.nav,
    ld: [
      { "@context": "https://schema.org", "@type": "Article", headline: h1, url, inLanguage: c.htmlLang, description, dateModified: updated, publisher: { "@type": "Organization", name: "Inspirella", url: SITE + "/" } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inspirella", item: SITE + "/" }, { "@type": "ListItem", position: 2, name: c.adultCrumb, item: url }] }
    ],
    main: `  <div class="crumbs">${crumbs}</div>
  <header class="hero"><h1>${esc(h1)}</h1><p class="lead">${esc(summary)}</p><div class="cta-row"><a class="btn btn-primary" href="/pathmap/">${esc(c.adultCta)}</a></div></header>
  ${facts.length ? `<section class="card prose"><dl class="dl">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>` : ""}
  ${good.length ? `<section class="card prose"><h2>${esc(c.goodTitle)}</h2><ul>${good.map(g => `<li>${esc(g)}</li>`).join("")}</ul>${official ? `<p class="more"><a href="${esc(official)}" rel="noopener">${esc(c.official)}</a></p>` : ""}</section>` : official ? `<p class="more"><a href="${esc(official)}" rel="noopener">${esc(c.official)}</a></p>` : ""}
  <p class="more"><a href="${c.bridgeBase}">${esc(c.bridgeLink)}</a> · <a href="${STATUS_S[lang].base}">${esc(c.statusLink)}</a></p>
  <div class="source">${esc(c.disclaimer)} ${esc(c.updated)}: ${esc(statusDate(lang, updated))}.</div>`
  });
}

// --------------------------------------------------------------------------
// Admission to Gymnasium, FMS, HMS and Berufsmaturität by canton (German, Ukrainian)
// Built only from verified admission_conditions rows without an institution (cantonal rules).
// --------------------------------------------------------------------------

const ADMISSION_ROUTES = ["gymnasium_kurz", "gymnasium_lang", "fms", "hms", "bms_bm1", "bms_bm2"];

interface AdmissionCopy {
  base: string;
  htmlLang: string;
  nav: { about: string; app: string };
  crumb: string;
  hubTitles: string[];
  hubH1: string;
  hubLead: string;
  hubDescription: string;
  cantonTitles: (n: string) => string[];
  cantonH1: (n: string) => string;
  cantonLead: (n: string) => string;
  cantonDescription: (n: string) => string;
  routes: Record<string, string>;
  routeHints: Record<string, string>;
  dl: { requirements: string; exam: string; deadline: string; timing: string; cost: string };
  tableTitle: string;
  tableLead: string;
  tableCanton: string;
  otherCantons: string;
  official: string;
  disclaimer: string;
  updated: string;
  links: { bridge: string; adult: string; status: string };
}

const ADMISSION: Record<GLang, AdmissionCopy> = {
  de: {
    base: "/zulassung/",
    htmlLang: "de",
    nav: { about: "Über Inspirella", app: "Zur App" },
    crumb: "Zulassung",
    hubTitles: ["Zulassung Gymnasium, FMS und Berufsmatura nach Kanton", "Zulassung nach Kanton"],
    hubH1: "Zulassung zu Gymnasium, FMS und Berufsmatura: Regeln nach Kanton",
    hubLead: "Wie kommt man nach der obligatorischen Schule ans Gymnasium, an die Fachmittelschule oder zur Berufsmaturität? Das regeln die Kantone. Hier sind die Voraussetzungen, Prüfungen und Anmeldefristen pro Kanton, jeweils mit Link auf die offizielle Seite.",
    hubDescription: "Zulassung zu Gymnasium, Fachmittelschule, Handelsmittelschule und Berufsmaturität in allen Kantonen: Voraussetzungen, Aufnahmeprüfung, Anmeldung und Kosten, mit offiziellen Quellen.",
    cantonTitles: n => [`Aufnahme Gymnasium, FMS und BM im Kanton ${n}`, `Zulassung Gymnasium und FMS im Kanton ${n}`, `Zulassung im Kanton ${n}`],
    cantonH1: n => `Zulassung zu Gymnasium, FMS und Berufsmatura im Kanton ${n}`,
    cantonLead: n => `Voraussetzungen, Prüfung, Anmeldung und Kosten für den Eintritt ins Gymnasium, in die Fachmittelschule und zur Berufsmaturität im Kanton ${n}, jeweils mit Link auf die offizielle Seite.`,
    cantonDescription: n => `Zulassung im Kanton ${n}: Gymnasium, Fachmittelschule, Handelsmittelschule und Berufsmaturität mit Voraussetzungen, Prüfung, Anmeldefrist und Kosten.`,
    routes: { gymnasium_kurz: "Kurzgymnasium", gymnasium_lang: "Langgymnasium", fms: "Fachmittelschule (FMS)", hms: "Handelsmittelschule (HMS)", bms_bm1: "Berufsmaturität während der Lehre (BM 1)", bms_bm2: "Berufsmaturität nach der Lehre (BM 2)" },
    routeHints: { gymnasium_kurz: "Gymnasium", gymnasium_lang: "Langgymnasium", fms: "FMS", hms: "HMS", bms_bm1: "BM 1", bms_bm2: "BM 2" },
    dl: { requirements: "Voraussetzungen", exam: "Prüfung und Verfahren", deadline: "Anmeldung", timing: "Zeitpunkt", cost: "Kosten" },
    tableTitle: "Übersicht: Welcher Kanton bietet was?",
    tableLead: "Ein Punkt bedeutet: Für diesen Weg steht eine geprüfte Angabe zum Kanton zur Verfügung. Ein Strich bedeutet: keine Angabe in unserer Datenbank.",
    tableCanton: "Kanton",
    otherCantons: "Andere Kantone",
    official: "Offizielle Seite →",
    disclaimer: "Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle. Fristen, Noten und Bedingungen ändern sich jedes Jahr: bitte immer auf der offiziellen Seite prüfen. Verbindliche Auskunft gibt die Schule oder das kantonale Berufsinformationszentrum (BIZ).",
    updated: "Zuletzt aktualisiert",
    links: { bridge: "Brückenangebote nach Kanton", adult: "Berufsabschluss für Erwachsene", status: "Mit Schutzstatus S: Angebote nach Kanton" }
  },
  uk: {
    base: "/uk/pryjom/",
    htmlLang: "uk",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" },
    crumb: "Вступ",
    hubTitles: ["Вступ до гімназії, FMS і професійної матури за кантонами", "Вступ за кантонами"],
    hubH1: "Вступ до гімназії, FMS і професійної матури: правила за кантонами",
    hubLead: "Як після обов’язкової школи потрапити до гімназії, до середньої фахової школи (FMS) або на професійну матуру? Це визначають кантони. Тут умови, іспити та строки подання для кожного кантону, з посиланням на офіційну сторінку.",
    hubDescription: "Вступ до гімназії, FMS, торговельної середньої школи та професійної матури в усіх кантонах: умови, вступний іспит, запис і вартість, з офіційними джерелами.",
    cantonTitles: n => [`Вступ до гімназії, FMS і матури у кантоні ${n}`, `Вступ до гімназії та FMS у кантоні ${n}`, `Вступ у кантоні ${n}`],
    cantonH1: n => `Вступ до гімназії, FMS і професійної матури у кантоні ${n}`,
    cantonLead: n => `Умови, іспит, запис і вартість вступу до гімназії, середньої фахової школи (FMS) і на професійну матуру у кантоні ${n}, з посиланням на офіційну сторінку.`,
    cantonDescription: n => `Вступ у кантоні ${n}: гімназія, FMS, торговельна середня школа та професійна матура з умовами, іспитом, строком подання й вартістю.`,
    routes: { gymnasium_kurz: "Коротка гімназія (Kurzgymnasium)", gymnasium_lang: "Довга гімназія (Langgymnasium)", fms: "Середня фахова школа (FMS)", hms: "Торговельна середня школа (HMS)", bms_bm1: "Професійна матура під час навчання (BM 1)", bms_bm2: "Професійна матура після навчання (BM 2)" },
    routeHints: { gymnasium_kurz: "Гімназія", gymnasium_lang: "Довга гімн.", fms: "FMS", hms: "HMS", bms_bm1: "BM 1", bms_bm2: "BM 2" },
    dl: { requirements: "Умови", exam: "Іспит і порядок", deadline: "Запис", timing: "Строки", cost: "Вартість" },
    tableTitle: "Огляд: що пропонує кожен кантон",
    tableLead: "Крапка означає: для цього шляху є перевірені дані про кантон. Риска означає: у нашій базі даних немає.",
    tableCanton: "Кантон",
    otherCantons: "Інші кантони",
    official: "Офіційна сторінка →",
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Строки, оцінки й умови змінюються щороку: завжди перевіряй офіційну сторінку. Обов’язкову інформацію дає школа або кантональний центр профорієнтації (BIZ). Тексти взято з офіційних німецькомовних джерел і перекладено.",
    updated: "Востаннє оновлено",
    links: { bridge: "Перехідні програми за кантонами", adult: "Диплом для дорослих", status: "Зі статусом S: пропозиції за кантонами" }
  }
};

function admissionField(row: Row, base: string, lang: GLang): string | undefined {
  return txt(row[`${base}_${lang}`]);
}

function renderAdmissionPage(lang: GLang, canton: string | null, byCanton: Map<string, Row[]>, availableIn: (code: string) => GLang[], today: string): string {
  const c = ADMISSION[lang];
  const g = GUIDES[lang];
  const cantonCodes = [...byCanton.keys()].filter(code => availableIn(code).includes(lang)).sort((a, b) => statusCantonName(lang, a).localeCompare(statusCantonName(lang, b), lang));
  const path = canton ? `${c.base}${canton.toLowerCase()}/` : c.base;
  const url = SITE + path;
  const name = canton ? statusCantonName(lang, canton) : "";
  const rows = canton
    ? ADMISSION_ROUTES.map(route => (byCanton.get(canton) ?? []).find(r => String(r.route) === route)).filter((r): r is Row => !!r && !!admissionField(r, "headline", lang))
    : [];
  const updated = newest(canton ? rows : [...byCanton.values()].flat(), today);

  const cantonList = (exclude?: string) =>
    `<ul class="cols">${cantonCodes.filter(code => code !== exclude).map(code => `<li><a href="${c.base}${code.toLowerCase()}/" lang="${c.htmlLang}">${esc(statusCantonName(lang, code))}</a></li>`).join("")}</ul>`;

  const card = (r: Row): string => {
    const dl = [
      [c.dl.requirements, admissionField(r, "requirements", lang)],
      [c.dl.exam, admissionField(r, "exam_info", lang)],
      [c.dl.deadline, admissionField(r, "deadline_text", lang)],
      [c.dl.timing, admissionField(r, "typical_timing", lang)],
      [c.dl.cost, admissionField(r, "cost_note", lang)]
    ].filter(([, v]) => v);
    const href = safeUrl(r.official_url) ?? safeUrl(r.evidence_url);
    return `<section class="card prose"><h2>${esc(c.routes[String(r.route)])}</h2><p>${esc(admissionField(r, "headline", lang)!)}</p><dl class="dl">${dl.map(([k, v]) => `<div><dt>${esc(k as string)}</dt><dd>${esc(v as string)}</dd></div>`).join("")}</dl>${href ? `<p class="more"><a href="${esc(href)}" rel="noopener">${esc(c.official)}</a></p>` : ""}</section>`;
  };

  let body: string;
  if (canton) {
    body = `${rows.map(card).join("\n  ")}
  <h2 style="margin-top:34px">${esc(c.otherCantons)}</h2>
  <section class="card">${cantonList(canton)}</section>
  <p class="more"><a href="${c.base}">${esc(c.crumb)}</a> · <a href="${g.bridgeBase}">${esc(c.links.bridge)}</a> · <a href="${g.adultPath}">${esc(c.links.adult)}</a></p>`;
  } else {
    const head = `<tr><th>${esc(c.tableCanton)}</th>${ADMISSION_ROUTES.map(r => `<th>${esc(c.routeHints[r])}</th>`).join("")}</tr>`;
    const lines = cantonCodes
      .map(code => {
        const have = new Set((byCanton.get(code) ?? []).filter(r => admissionField(r, "headline", lang)).map(r => String(r.route)));
        return `<tr><th><a href="${c.base}${code.toLowerCase()}/" lang="${c.htmlLang}">${esc(statusCantonName(lang, code))}</a></th>${ADMISSION_ROUTES.map(r => `<td>${have.has(r) ? "●" : "–"}</td>`).join("")}</tr>`;
      })
      .join("");
    body = `<h2 style="margin-top:6px">${esc(c.tableTitle)}</h2>
  <section class="card"><p>${esc(c.tableLead)}</p><div style="overflow-x:auto"><table class="cmp"><thead>${head}</thead><tbody>${lines}</tbody></table></div></section>
  <h2 style="margin-top:34px">${esc(lang === "de" ? "Wähle deinen Kanton" : "Обери свій кантон")}</h2>
  <section class="card">${cantonList()}</section>
  <p class="more"><a href="${g.bridgeBase}">${esc(c.links.bridge)}</a> · <a href="${g.adultPath}">${esc(c.links.adult)}</a> · <a href="${STATUS_S[lang].base}">${esc(c.links.status)}</a></p>`;
  }

  const h1 = canton ? c.cantonH1(name) : c.hubH1;
  const lead = canton ? c.cantonLead(name) : c.hubLead;
  const description = truncate(canton ? c.cantonDescription(name) : c.hubDescription, 158);
  const { docTitle } = pickTitle(canton ? c.cantonTitles(name) : c.hubTitles);
  const crumbs = canton ? `<a href="/">Inspirella</a> › <a href="${c.base}">${esc(c.crumb)}</a> › ${esc(name)}` : `<a href="/">Inspirella</a> › ${esc(c.crumb)}`;
  const ldCrumbs = [{ name: "Inspirella", item: SITE + "/" }, { name: c.crumb, item: SITE + c.base }, ...(canton ? [{ name, item: url }] : [])];
  const alternates = guideAlternates(l => (canton ? `${ADMISSION[l].base}${canton.toLowerCase()}/` : ADMISSION[l].base), canton ? availableIn(canton) : (["de", "uk"] as GLang[]));

  return layout({
    docTitle,
    ogTitle: h1,
    description,
    url,
    indexable: canton ? rows.length > 0 : true,
    lang: c.htmlLang,
    alternates,
    nav: c.nav,
    ld: [
      { "@context": "https://schema.org", "@type": "Article", headline: h1, url, inLanguage: c.htmlLang, description, dateModified: updated, publisher: { "@type": "Organization", name: "Inspirella", url: SITE + "/" } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: ldCrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.item })) }
    ],
    main: `  <div class="crumbs">${crumbs}</div>
  <header class="hero"><h1>${esc(h1)}</h1><p class="lead">${esc(lead)}</p></header>
  ${body}
  <div class="source">${esc(c.disclaimer)} ${esc(c.updated)}: ${esc(statusDate(lang, updated))}.</div>`
  });
}

function renderSystem(lang: SysLang, nodes: Row[], transitions: Row[], statusFacts: Row[]): string {
  const c = SYS[lang];
  const url = SITE + c.path;
  const now = new Date();
  const dateText = lang === "de" ? dataDate(now) : lang === "en" ? `${MONTHS_EN[now.getUTCMonth()]} ${now.getUTCFullYear()}` : `${MONTHS_UK[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
  const field = (row: Row, base: string): string | undefined => {
    if (lang === "uk") return txt(row[`${base}_uk`]);
    if (lang === "en") return txt(row[`${base}_en`]);
    return txt(row[`${base}_de`]);
  };
  // Stage texts have English; the detail fields exist in German and Ukrainian only.
  const label = (row: Row) => (lang === "en" ? txt(row.label_en) : field(row, "label")) ?? txt(row.label_de) ?? "";
  const summary = (row: Row) => (lang === "en" ? txt(row.summary_en) : field(row, "summary")) ?? txt(row.summary_en) ?? txt(row.summary_de) ?? "";
  const detail = (row: Row, base: string) => (lang === "en" ? undefined : field(row, base));
  const goodList = (row: Row): string[] => {
    const raw = lang === "uk" ? row.good_to_know_uk : lang === "de" ? row.good_to_know_de : undefined;
    return Array.isArray(raw) ? raw.map(txt).filter((x): x is string => !!x) : [];
  };

  const sorted = [...nodes].sort((a, b) => Number(a.band) - Number(b.band) || Number(a.sort_order) - Number(b.sort_order));
  const byBand = new Map<string, Row[]>();
  for (const n of sorted) (byBand.get(String(n.band)) ?? byBand.set(String(n.band), []).get(String(n.band))!).push(n);

  const bandsHtml = [...byBand.entries()]
    .map(([band, list]) => {
      const cards = list
        .map(n => {
          const rows: [string, string][] = [];
          const dur = detail(n, "duration");
          const age = detail(n, "typical_age");
          const dip = detail(n, "diploma");
          const req = detail(n, "requirements");
          const cant = detail(n, "cantonal_note");
          if (dur) rows.push([c.duration, dur]);
          if (age) rows.push([c.age, age]);
          if (dip) rows.push([c.diploma, dip]);
          if (req) rows.push([c.requirements, req]);
          if (cant) rows.push([c.cantonal, cant]);
          const good = goodList(n);
          const href = safeUrl(n.official_url) ?? safeUrl(n.evidence_url);
          return `<section class="card prose" id="${esc(n.code)}"><h3>${esc(label(n))}</h3><p>${esc(summary(n))}</p>${
            rows.length ? `<dl class="dl">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""
          }${good.length ? `<span class="eyebrow" style="margin-top:14px">${esc(c.good)}</span><ul>${good.map(g => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}${
            href ? `<p class="more"><a href="${esc(href)}" rel="noopener">${esc(c.official)} →</a></p>` : ""
          }</section>`;
        })
        .join("\n  ");
      return `<h2 style="margin-top:34px">${esc(c.bands[band] ?? band)}</h2>\n  ${cards}`;
    })
    .join("\n  ");

  const waysHtml =
    lang === "en" || transitions.length === 0
      ? ""
      : `<h2 style="margin-top:40px">${esc(c.waysTitle)}</h2>
  <section class="card prose"><p>${esc(c.waysLead)}</p><ul>${transitions
          .map(t => {
            const lab = field(t, "label") ?? txt(t.label_de);
            const cond = detail(t, "conditions") ?? detail(t, "notes");
            return lab ? `<li><strong>${esc(lab)}</strong>${cond ? ": " + esc(truncate(cond, 220)) : ""}</li>` : "";
          })
          .join("")}</ul></section>`;

  const statusRows = statusFacts
    .map(f => {
      const head = lang === "uk" ? txt(f.headline_uk) ?? txt(f.headline_en) : lang === "en" ? txt(f.headline_en) ?? txt(f.headline_de) : txt(f.headline_de);
      const body = lang === "uk" ? txt(f.text_uk) ?? txt(f.text_en) : lang === "en" ? txt(f.text_en) ?? txt(f.text_de) : txt(f.text_de);
      const href = safeUrl(f.official_url) ?? safeUrl(f.evidence_url);
      return head && body ? `<li><strong>${esc(head)}</strong> ${esc(body)}${href ? ` <a href="${esc(href)}" rel="noopener">→</a>` : ""}</li>` : "";
    })
    .join("");
  const statusHtml = statusRows
    ? `<h2 style="margin-top:40px">${esc(c.statusTitle)}</h2>\n  <section class="card prose"><p>${esc(c.statusLead)}</p><ul>${statusRows}</ul><p class="more"><a href="${STATUS_S[lang].base}">${esc(STATUS_S[lang].crumb)} →</a></p></section>`
    : "";

  const alternates = (Object.keys(SYS) as SysLang[]).map(l => ({ lang: SYS[l].hreflang, href: SITE + SYS[l].path }));
  alternates.push({ lang: "x-default", href: SITE + SYS.de.path });

  const main = `  <div class="crumbs"><a href="/">Inspirella</a> › ${esc(c.crumb)}</div>
  <header class="hero">
    <div class="badges"><span class="badge">${esc(c.crumb)}</span><span class="badge warm">Schweiz · Suisse · Svizzera</span></div>
    <h1>${esc(c.h1)}</h1>
    <p class="lead">${esc(c.lead)}</p>
    <div class="cta-row"><a class="btn btn-primary" href="/pathmap/">${esc(c.cta)}</a></div>
    <p class="more" style="margin:0">${esc(c.ctaNote)}</p>
  </header>
  ${factsHtml([
    [c.factsNodes, String(nodes.length)],
    [c.factsWays, String(transitions.length)],
    [c.factsCantons, "26"],
    [c.factsData, dateText]
  ])}
  ${c.detailsNote ? `<div class="note">${esc(c.detailsNote)}</div>` : ""}
  ${bandsHtml}
  ${waysHtml}
  ${statusHtml}
  <div class="source">${esc(c.disclaimer)}</div>`;

  return layout({
    docTitle: c.title,
    ogTitle: c.h1,
    description: c.description,
    url,
    indexable: nodes.length > 0,
    lang: c.htmlLang,
    alternates,
    nav: c.nav,
    ld: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: c.h1,
      url,
      inLanguage: c.htmlLang,
      description: c.description,
      isPartOf: { "@type": "WebSite", name: "Inspirella", url: SITE + "/" }
    },
    main
  });
}

// --------------------------------------------------------------------------
// Home (written into the SPA shell) and 404
// --------------------------------------------------------------------------

const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
/** "Oktober 2026": when this build read the database. Shown as the data's "Stand". */
function dataDate(d = new Date()): string {
  return `${MONTHS_DE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

interface HomeFeatured {
  professions: Link[];
  institutions: Link[];
}

/**
 * Plain, readable home content for crawlers and no-JS visitors. It sits inside
 * #root, so React discards it the moment the app mounts. Everything is inline:
 * the app's own stylesheet knows nothing about it.
 */
function renderHomeBlock(counts: Counts, featured: HomeFeatured): string {
  const list = (items: Link[]) =>
    items.map(i => `<li><a href="${esc(i.href)}" style="color:#c4b5fd">${esc(i.title)}</a></li>`).join("");
  return `<div style="max-width:760px;margin:0 auto;padding:56px 20px;font-family:Inter,system-ui,sans-serif;color:#e8e4f5;line-height:1.65">
<h1 style="font:700 38px 'Space Grotesk',system-ui,sans-serif;margin:0 0 14px;line-height:1.15">Inspirella</h1>
<p style="font-size:19px;margin:0 0 12px">Inspirella turns Switzerland's education system into one clear, personal path: careers that fit you, where to learn them, and the next small step to take.</p>
<p lang="de" style="color:#b7aed6;margin:0 0 24px">Inspirella hilft dir, dich im Schweizer Bildungssystem zurechtzufinden: Berufe, die zu dir passen, Schulen, wo du sie lernst, und der nächste kleine Schritt. Kostenlos, auf Deutsch, Französisch, Italienisch und Englisch.</p>
<p style="margin:0 0 24px">${counts.professions} professions and programmes, ${counts.institutions} schools and institutions, ${counts.resources} official resources. Data as of ${esc(dataDate())}. Inspirella is an orientation tool, not an official authority: for binding information see <a href="https://www.berufsberatung.ch/" style="color:#c4b5fd">berufsberatung.ch</a> and your cantonal careers office (BIZ).</p>
<p style="margin:0 0 28px"><a href="/berufe/" lang="de" style="color:#c4b5fd">Alle Berufe</a> · <a href="/schulen/" lang="de" style="color:#c4b5fd">Alle Schulen</a> · <a href="/lehrlingsloehne/" lang="de" style="color:#c4b5fd">Lehrlingslöhne</a> · <a href="/passerelle/" lang="de" style="color:#c4b5fd">Passerelle</a> · <a href="/status-s/" lang="de" style="color:#c4b5fd">Schutzstatus S</a> · <a href="/zulassung/" lang="de" style="color:#c4b5fd">Zulassung nach Kanton</a> · <a href="/brueckenangebote/" lang="de" style="color:#c4b5fd">Brückenangebote</a> · <a href="/berufsabschluss-fuer-erwachsene/" lang="de" style="color:#c4b5fd">Berufsabschluss für Erwachsene</a> · <a href="/methodik/" lang="de" style="color:#c4b5fd">Methodik</a> · <a href="/ueber-inspirella/" style="color:#c4b5fd">About Inspirella</a> · <a href="/en/swiss-education-system/" style="color:#c4b5fd">Swiss education system</a> · <a href="/bildungssystem/" lang="de" style="color:#c4b5fd">Bildungssystem</a> · <a href="/uk/systema-osvity-shveitsarii/" lang="uk" style="color:#c4b5fd">Система освіти Швейцарії</a> ·<a href="/sitemap.xml" style="color:#c4b5fd">Sitemap</a> · <a href="/llms.txt" style="color:#c4b5fd">For AI assistants (llms.txt)</a> · <a href="/impressum/" style="color:#c4b5fd">Impressum</a> · <a href="/datenschutz/" style="color:#c4b5fd">Datenschutz</a></p>
<h2 style="font:600 20px 'Space Grotesk',system-ui,sans-serif;margin:0 0 8px">Professions</h2>
<ul style="margin:0 0 24px;padding-left:20px">${list(featured.professions)}</ul>
<h2 style="font:600 20px 'Space Grotesk',system-ui,sans-serif;margin:0 0 8px">Schools and institutions</h2>
<ul style="margin:0;padding-left:20px">${list(featured.institutions)}</ul>
<noscript><p style="margin-top:28px;color:#fdba74">The interactive app (map, personal path, tracker) needs JavaScript.</p></noscript>
</div>`;
}

/** **bold** and e-mail addresses inside legal text, escaped. */
function legalInline(text: string): string {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');
}

function renderLegal(doc: LegalDoc, slug: string): string {
  const url = `${SITE}/${slug}/`;
  const sections = doc.sections
    .map(
      sec =>
        `<section class="card prose"><h2>${esc(sec.heading)}</h2>${(sec.paragraphs ?? []).map(p => `<p>${legalInline(p)}</p>`).join("")}${
          sec.bullets ? `<ul>${sec.bullets.map(b => `<li>${legalInline(b)}</li>`).join("")}</ul>` : ""
        }</section>`
    )
    .join("\n  ");
  return layout({
    docTitle: `${doc.title} | Inspirella`,
    ogTitle: `${doc.title} | Inspirella`,
    description: truncate(doc.updated, 155),
    url,
    indexable: true,
    ld: { "@context": "https://schema.org", "@type": "WebPage", name: doc.title, url },
    main: `  <div class="crumbs"><a href="/">Inspirella</a> › ${esc(doc.title)}</div>
  <header class="hero"><h1>${esc(doc.title)}</h1><p class="lead">${esc(doc.updated)}</p></header>
  ${sections}
  ${doc.closing ? `<div class="source">${esc(doc.closing)}</div>` : ""}`
  });
}

function render404(): string {
  return layout({
    docTitle: "Seite nicht gefunden | Inspirella",
    ogTitle: "Seite nicht gefunden | Inspirella",
    description: "Diese Adresse gibt es bei Inspirella nicht.",
    url: SITE + "/",
    indexable: false,
    ld: { "@context": "https://schema.org", "@type": "WebPage", name: "Seite nicht gefunden" },
    main: `  <header class="hero">
    <div class="badges"><span class="badge warm">404</span></div>
    <h1>Diese Seite gibt es nicht</h1>
    <p class="lead">Der Link ist vielleicht veraltet oder falsch geschrieben. Von der Startseite aus findest du Berufe, Schulen und deinen persönlichen Weg.</p>
    <div class="cta-row"><a class="btn btn-primary" href="/">Zur Startseite →</a><a class="btn btn-sec" href="/ueber-inspirella/">Über Inspirella</a></div>
  </header>`
  });
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Guide pages built only from data we hold: apprentice pay table, EFZ vs EBA, HF vs FH, Passerelle
// --------------------------------------------------------------------------

function nodeRows(n: Row): [string, string][] {
  const rows: [string, string][] = [];
  const add = (k: string, v: unknown) => { const t = txt(v); if (t) rows.push([k, t]); };
  add("Dauer", n.duration_de);
  add("Typisches Alter", n.typical_age_de);
  add("Abschluss", n.diploma_de);
  add("Wer kann starten", n.requirements_de);
  add("Unterschiede zwischen den Kantonen", n.cantonal_note_de);
  return rows;
}

function renderCompare(a: Row, b: Row, o: { path: string; title: string; h1: string; lead: string; description: string; extra?: string }): string {
  const url = SITE + o.path;
  const la = txt(a.label_de) || String(a.code);
  const lb = txt(b.label_de) || String(b.code);
  const ra = new Map(nodeRows(a));
  const rb = new Map(nodeRows(b));
  const keys = [...new Set([...ra.keys(), ...rb.keys()])];
  const goodList = (n: Row) => (Array.isArray(n.good_to_know_de) ? n.good_to_know_de.map(txt).filter((x): x is string => !!x) : []);
  const side = (n: Row, label: string) => `<section class="card prose"><h2>${esc(label)}</h2><p>${esc(txt(n.summary_de) || "")}</p>${goodList(n).length ? `<ul>${goodList(n).map(g => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}${safeUrl(n.official_url) ? `<p class="more"><a href="${esc(safeUrl(n.official_url)!)}" rel="noopener">Offizielle Quelle →</a></p>` : ""}</section>`;
  const table = `<section class="card"><h2>Die wichtigsten Unterschiede</h2><div style="overflow-x:auto"><table class="cmp"><thead><tr><th></th><th>${esc(la)}</th><th>${esc(lb)}</th></tr></thead><tbody>${keys.map(k => `<tr><th>${esc(k)}</th><td>${esc(ra.get(k) || "–")}</td><td>${esc(rb.get(k) || "–")}</td></tr>`).join("")}</tbody></table></div></section>`;
  return layout({
    docTitle: truncate(o.title, 60),
    ogTitle: o.h1,
    description: truncate(o.description, 158),
    url,
    indexable: true,
    ld: { "@context": "https://schema.org", "@type": "Article", headline: o.h1, url, inLanguage: "de", dateModified: new Date().toISOString().slice(0, 10), publisher: { "@type": "Organization", name: "Inspirella", url: SITE + "/" } },
    main: `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/bildungssystem/">Bildungssystem</a> › ${esc(o.h1)}</div>
  <header class="hero"><h1>${esc(o.h1)}</h1><p class="lead">${esc(o.lead)}</p></header>
  ${table}
  <div class="grid2">${side(a, la)}${side(b, lb)}</div>
  ${o.extra ?? ""}
  <div class="source">Quelle: offizielle Stellen (berufsberatung.ch, SBFI, EDK, swissuniversities), zusammengefasst von Inspirella. Zuletzt aktualisiert: ${esc(new Date().toISOString().slice(0, 10))}. <a href="/methodik/">So arbeiten wir</a>. Verbindliche Informationen findest du beim kantonalen Berufsinformationszentrum (BIZ).</div>`
  });
}

function renderApprenticeWages(rows: { title: string; href: string; wages: Row[] }[]): string {
  const url = `${SITE}/lehrlingsloehne/`;
  const maxYears = 4;
  const sorted = [...rows].sort((x, y) => x.title.localeCompare(y.title, "de"));
  const cell = (w?: Row) => (w ? (w.min_chf === w.max_chf ? chf(w.min_chf) : `${chf(w.min_chf)}–${Math.round(w.max_chf).toLocaleString("de-CH")}`) : "–");
  const body = sorted
    .map(r => {
      const byYear = new Map(r.wages.map(w => [Number(w.year_no), w]));
      return `<tr><th><a href="${esc(r.href)}">${esc(r.title)}</a></th>${Array.from({ length: maxYears }, (_, i) => `<td>${esc(cell(byYear.get(i + 1)))}</td>`).join("")}</tr>`;
    })
    .join("");
  const description = `Empfohlene Lehrlingslöhne pro Lehrjahr für ${rows.length} Lehrberufe in der Schweiz (EFZ und EBA), in CHF pro Monat, mit Quelle.`;
  return layout({
    docTitle: "Lehrlingslöhne in der Schweiz: Tabelle nach Beruf | Inspirella",
    ogTitle: "Lehrlingslöhne in der Schweiz",
    description,
    url,
    indexable: true,
    ld: { "@context": "https://schema.org", "@type": "Dataset", name: "Empfohlene Lehrlingslöhne in der Schweiz", description, url, inLanguage: "de", creator: { "@type": "Organization", name: "Inspirella" }, isBasedOn: "https://www.berufsberatung.ch/" },
    main: `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/berufe/">Berufe</a> › Lehrlingslöhne</div>
  <header class="hero"><h1>Lehrlingslöhne in der Schweiz: Tabelle nach Beruf</h1><p class="lead">Was verdient man während der Lehre? Hier stehen die von den Berufsverbänden empfohlenen Monatslöhne pro Lehrjahr für ${rows.length} Lehrberufe.</p></header>
  <section class="card"><div style="overflow-x:auto"><table class="cmp"><thead><tr><th>Beruf</th><th>1. Lehrjahr</th><th>2. Lehrjahr</th><th>3. Lehrjahr</th><th>4. Lehrjahr</th></tr></thead><tbody>${body}</tbody></table></div></section>
  <div class="note">Beträge in CHF pro Monat. Das sind Empfehlungen der Berufsverbände, keine Garantie: Region und Lehrbetrieb bestimmen den tatsächlichen Lohn. Wo eine Zelle «–» zeigt, dauert die Lehre kürzer oder es gibt keine Angabe.</div>
  <div class="source">Quelle: Lohnempfehlungen auf den Berufsprofilen von berufsberatung.ch, Stand ${esc(new Date().toISOString().slice(0, 10))}. <a href="/methodik/">So arbeiten wir</a>.</div>`
  });
}

function renderPasserelle(node: Row | undefined, programs: Row[]): string {
  const url = `${SITE}/passerelle/`;
  const list = programs
    .map(p => ({ canton: txt(p.canton_code)?.toUpperCase() || "CH", title: txt(p.title_de) || "", desc: txt(p.description_de), dur: txt(p.duration_text_de), adm: txt(p.admission_de), url: safeUrl(p.official_url) || safeUrl(p.evidence_url) }))
    .filter(p => p.title)
    .sort((x, y) => x.canton.localeCompare(y.canton) || x.title.localeCompare(y.title, "de"));
  const nat = list.filter(p => p.canton === "CH");
  const cant = list.filter(p => p.canton !== "CH");
  const card = (p: (typeof list)[number]) => `<section class="card prose"><h3>${esc(p.title)}${p.canton !== "CH" ? ` <i class="cant">${esc(p.canton)}</i>` : ""}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ""}<dl class="dl">${[["Dauer", p.dur], ["Zulassung und Anmeldung", p.adm]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v as string)}</dd></div>`).join("")}</dl>${p.url ? `<p class="more"><a href="${esc(p.url)}" rel="noopener">Offizielle Seite →</a></p>` : ""}</section>`;
  const summary = txt(node?.summary_de) || "Mit der Passerelle (Ergänzungsprüfung) bekommen Personen mit Berufsmaturität oder Fachmaturität Zugang zu allen Universitäten.";
  const good = Array.isArray(node?.good_to_know_de) ? node!.good_to_know_de.map(txt).filter((x: unknown): x is string => !!x) : [];
  const description = "Passerelle: von der Berufsmatura oder Fachmatura an die Universität. Ablauf, Dauer, Zulassung und Vorbereitungskurse nach Kanton, mit offiziellen Quellen.";
  return layout({
    docTitle: "Passerelle: von der Berufsmatura an die Uni | Inspirella",
    ogTitle: "Passerelle: von der Berufsmatura an die Universität",
    description,
    url,
    indexable: true,
    ld: { "@context": "https://schema.org", "@type": "Article", headline: "Passerelle: von der Berufsmatura an die Universität", url, inLanguage: "de", dateModified: new Date().toISOString().slice(0, 10), publisher: { "@type": "Organization", name: "Inspirella", url: SITE + "/" } },
    main: `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/bildungssystem/">Bildungssystem</a> › Passerelle</div>
  <header class="hero"><h1>Passerelle: von der Berufsmatura an die Universität</h1><p class="lead">${esc(summary)}</p></header>
  ${good.length ? `<section class="card prose"><h2>Gut zu wissen</h2><ul>${good.map(g => `<li>${esc(g)}</li>`).join("")}</ul></section>` : ""}
  ${nat.length ? `<h2 style="margin-top:34px">Schweizweit</h2>${nat.map(card).join("\n  ")}` : ""}
  ${cant.length ? `<h2 style="margin-top:34px">Vorbereitungskurse und Anmeldung nach Kanton</h2>${cant.map(card).join("\n  ")}` : ""}
  <div class="source">Quelle: swissuniversities, kantonale Bildungsämter und die Schulen selbst; zusammengefasst von Inspirella. Fristen ändern sich jedes Jahr: bitte auf der offiziellen Seite prüfen. Zuletzt aktualisiert: ${esc(new Date().toISOString().slice(0, 10))}. <a href="/methodik/">So arbeiten wir</a>.</div>`
  });
}

async function writePage(segments: string[], html: string): Promise<void> {
  const dir = path.join(DIST, ...segments);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
}

async function main() {
  try {
    await fs.access(DIST);
  } catch {
    console.warn("[pages] dist/ not found - run after `vite build`. Skipping.");
    return;
  }

  const rawUrl = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!rawUrl || !key) {
    console.warn("[pages] SUPABASE_URL / SUPABASE_ANON_KEY not set at build time. Skipping page generation.");
    return;
  }
  // Tolerate a pasted REST endpoint (".../rest/v1") - the client wants the bare project URL.
  const supabase = createClient(rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, ""), key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const professions = await fetchAll((from, to) =>
    supabase.from("professions").select("*").eq("is_active", true).eq("is_public", true).order("id", { ascending: true }).range(from, to)
  );
  const institutions = await fetchAll((from, to) =>
    supabase.from("institutions").select("*").eq("is_active", true).eq("is_public", true).order("id", { ascending: true }).range(from, to)
  );
  const links = await fetchAll((from, to) =>
    supabase.from("profession_institutions").select("profession_id, institution_id").eq("is_active", true).order("id", { ascending: true }).range(from, to)
  );
  const { count: resourceCount } = await supabase.from("resources").select("*", { count: "exact", head: true }).eq("is_active", true);

  // data for the richer profession pages (all public-read tables)
  const grab = (table: string, cols = "*", more?: (q: any) => any) =>
    fetchAll((from, to) => { let q: any = supabase.from(table).select(cols); if (more) q = more(q); return q.range(from, to); }).catch(() => [] as Row[]);
  const detailRows = await grab("profession_details");
  const traitRows = await grab("profession_traits");
  const wageRows = await grab("apprentice_wage_recommendations");
  const benchRows = await grab("salary_benchmarks", "*", q => q.eq("region", "Schweiz"));
  const factRows = await grab("profession_facts");

  if (!professions.length) {
    console.warn("[pages] No professions returned - leaving dist/ untouched.");
    return;
  }

  // Index both record types by id so each page can link to the other side.
  const profInfo = new Map<string, { slug: string; title: string }>();
  const profByCode = new Map<string, { slug: string; title: string; type?: string }>();
  const profByCategory = new Map<string, string[]>();
  const taken = new Set<string>();
  const profSlug = new Map<string, string>();
  const redirects: Record<string, string> = {};
  for (const p of professions) {
    const old = pageSlug(p.slug);
    let slug = pageSlug(p.page_slug || p.slug);
    if (!SLUG_RE.test(slug) || taken.has(slug)) slug = old; // a clash keeps the old address
    if (!SLUG_RE.test(slug) || taken.has(slug)) continue;
    taken.add(slug);
    profSlug.set(String(p.id), slug);
    if (slug !== old && SLUG_RE.test(old)) redirects[`/beruf/${old}/`] = `/beruf/${slug}/`;
    const title = txt(p.title_de) || txt(p.name_de) || slug;
    profInfo.set(String(p.id), { slug, title });
    if (p.code) profByCode.set(String(p.code), { slug, title, type: p.profession_type });
    if (p.profession_category_id && p.code) (profByCategory.get(String(p.profession_category_id)) ?? profByCategory.set(String(p.profession_category_id), []).get(String(p.profession_category_id))!).push(String(p.code));
  }
  const today = new Date().toISOString().slice(0, 10);
  const benchByGroup = new Map<string, Record<string, Row>>();
  for (const b of benchRows) {
    const g = (benchByGroup.get(String(b.isco_group)) ?? benchByGroup.set(String(b.isco_group), {}).get(String(b.isco_group))!);
    g[String(b.age_group)] = b;
  }
  const wagesByProf = new Map<string, Row[]>();
  for (const w of wageRows) (wagesByProf.get(String(w.profession_id)) ?? wagesByProf.set(String(w.profession_id), []).get(String(w.profession_id))!).push(w);
  const ctx: Ctx = {
    profByCode,
    profByCategory,
    detailsByProf: new Map(detailRows.map(d => [String(d.profession_id), d])),
    traits: new Map(traitRows.map(t => [Number(t.id), t])),
    wagesByProf,
    benchByGroup,
    factsByProf: new Map(factRows.map(f => [String(f.profession_id), f])),
    instById: new Map(),
    today
  };
  const instInfo = new Map<string, { slug: string; title: string; city?: string; canton?: string }>();
  for (const i of institutions) {
    const slug = pageSlug(i.slug);
    const title = txt(i.title_de) || txt(i.name);
    if (SLUG_RE.test(slug) && title) instInfo.set(String(i.id), { slug, title, city: txt(i.city), canton: txt(i.canton) });
  }

  for (const [k, v] of instInfo) ctx.instById.set(k, v);
  const schoolsByProfession = new Map<string, Link[]>();
  const professionsByInstitution = new Map<string, Link[]>();
  for (const l of links) {
    const prof = profInfo.get(String(l.profession_id));
    const inst = instInfo.get(String(l.institution_id));
    if (!prof || !inst) continue;
    const pid = String(l.profession_id);
    const iid = String(l.institution_id);
    (schoolsByProfession.get(pid) ?? schoolsByProfession.set(pid, []).get(pid)!).push({
      title: inst.title,
      city: inst.city,
      canton: inst.canton,
      href: `/institution/${inst.slug}/`
    });
    (professionsByInstitution.get(iid) ?? professionsByInstitution.set(iid, []).get(iid)!).push({
      title: prof.title,
      href: `/beruf/${prof.slug}/`
    });
  }
  const byTitle = (a: Link, b: Link) => a.title.localeCompare(b.title, "de");

  const urls: { loc: string; lastmod?: string }[] = [{ loc: `${SITE}/`, lastmod: today }, { loc: `${SITE}/ueber-inspirella/`, lastmod: today }, { loc: `${SITE}/impressum/`, lastmod: today }, { loc: `${SITE}/datenschutz/`, lastmod: today }, { loc: `${SITE}/methodik/`, lastmod: today }, { loc: `${SITE}/berufe/`, lastmod: today }, { loc: `${SITE}/schulen/`, lastmod: today }];
  const stats = { professions: 0, professionsNoindex: 0, institutions: 0, institutionsNoindex: 0, skipped: 0 };
  const lastmodOf = (row: Row) => (typeof row.updated_at === "string" ? row.updated_at.slice(0, 10) : undefined);

  const indexableProfs: Link[] = [];
  const indexableByType = new Map<string, Link[]>();
  const indexableSchools: (Link & { cantonCode?: string })[] = [];
  for (const p of professions) {
    const slug = profSlug.get(String(p.id));
    if (!slug) {
      stats.skipped++;
      continue;
    }
    const { html, indexable, lastmod } = renderProfession(p, slug, (schoolsByProfession.get(String(p.id)) ?? []).sort(byTitle), ctx);
    await writePage(["beruf", slug], html);
    stats.professions++;
    if (!indexable) {
      stats.professionsNoindex++;
      continue;
    }
    urls.push({ loc: `${SITE}/beruf/${slug}/`, lastmod: lastmod || today });
    const link: Link = { title: txt(p.title_de) || txt(p.name_de) || slug, href: `/beruf/${slug}/` };
    indexableProfs.push(link);
    const t = String(p.profession_type || "other");
    (indexableByType.get(t) ?? indexableByType.set(t, []).get(t)!).push(link);
  }

  const instTaken = new Set<string>();
  for (const i of institutions) {
    const slug = pageSlug(i.slug);
    if (!SLUG_RE.test(slug) || instTaken.has(slug)) {
      stats.skipped++;
      continue;
    }
    instTaken.add(slug);
    const { html, indexable, lastmod } = renderInstitution(i, slug, (professionsByInstitution.get(String(i.id)) ?? []).sort(byTitle));
    await writePage(["institution", slug], html);
    stats.institutions++;
    if (!indexable) {
      stats.institutionsNoindex++;
      continue;
    }
    urls.push({ loc: `${SITE}/institution/${slug}/`, lastmod: lastmod || today });
    indexableSchools.push({ title: txt(i.title_de) || txt(i.name) || slug, href: `/institution/${slug}/`, city: [txt(i.city), txt(i.canton)].filter(Boolean).join(", "), cantonCode: txt(i.canton)?.toUpperCase() });
  }

  const counts: Counts = { professions: professions.length, institutions: institutions.length, resources: resourceCount ?? 0 };
  await writePage(["ueber-inspirella"], renderAbout(counts));
  await writePage(["methodik"], renderMethodology(counts));

  // guide pages from the data we hold
  try {
    const nodeRowsAll = await fetchAll((from, to) => supabase.from("education_nodes").select("*").eq("is_active", true).order("id", { ascending: true }).range(from, to));
    const nodeBy = (c: string) => nodeRowsAll.find(n => n.code === c);
    const programRows = await fetchAll((from, to) => supabase.from("education_programs").select("*").eq("is_active", true).order("code", { ascending: true }).range(from, to));
    const efz = nodeBy("efz"), eba = nodeBy("eba"), hf = nodeBy("hf"), fh = nodeBy("fh"), pass = nodeBy("passerelle");
    if (efz && eba) {
      await writePage(["efz-oder-eba"], renderCompare(efz, eba, { path: "/efz-oder-eba/", title: "EFZ oder EBA? Die Unterschiede einfach erklärt | Inspirella", h1: "EFZ oder EBA? Die Unterschiede einfach erklärt", lead: "Beide Lehren führen zu einem eidgenössischen Abschluss. Sie unterscheiden sich in Dauer, Anforderungen und Weiterbildungsmöglichkeiten.", description: "EFZ oder EBA: Dauer, Anforderungen, Abschluss und Anschlussmöglichkeiten der zwei Lehrformen in der Schweiz im Vergleich, mit offiziellen Quellen." }));
      urls.push({ loc: `${SITE}/efz-oder-eba/`, lastmod: today });
    }
    if (hf && fh) {
      await writePage(["hf-oder-fh"], renderCompare(hf, fh, { path: "/hf-oder-fh/", title: "HF oder FH? Höhere Fachschule und Fachhochschule | Inspirella", h1: "HF oder FH: was ist der Unterschied?", lead: "Höhere Fachschule und Fachhochschule bauen beide auf einer Berufsbildung auf, sind aber verschieden aufgebaut. Hier der direkte Vergleich.", description: "HF oder FH: Zulassung, Dauer, Abschluss und Praxisnähe der Höheren Fachschule und der Fachhochschule in der Schweiz im Vergleich." }));
      urls.push({ loc: `${SITE}/hf-oder-fh/`, lastmod: today });
    }
    await writePage(["passerelle"], renderPasserelle(pass, programRows.filter(r => String(r.kind) === "passerelle")));
    urls.push({ loc: `${SITE}/passerelle/`, lastmod: today });
    const wageTable = professions.filter(pr => (wagesByProf.get(String(pr.id)) ?? []).length > 0 && profSlug.has(String(pr.id))).map(pr => ({ title: shortTitle(txt(pr.title_de) || txt(pr.name_de) || ""), href: `/beruf/${profSlug.get(String(pr.id))}/`, wages: (wagesByProf.get(String(pr.id)) ?? []).sort((a, b) => a.year_no - b.year_no) }));
    if (wageTable.length) {
      await writePage(["lehrlingsloehne"], renderApprenticeWages(wageTable));
      urls.push({ loc: `${SITE}/lehrlingsloehne/`, lastmod: today });
    }
  } catch (err: any) {
    console.warn("[pages] Guide pages skipped:", err?.message || err);
  }

  // hub pages: plain link lists so every profession and school page has links pointing to it
  const hubTypes = Object.entries(TYPE_HUBS).filter(([t]) => (indexableByType.get(t) ?? []).length > 0);
  await writePage(["berufe"], renderHub({
    path: "/berufe/",
    title: "Alle Berufe in der Schweiz von A bis Z",
    h1: "Alle Berufe in der Schweiz von A bis Z",
    lead: `${indexableProfs.length} Berufe und Ausbildungen mit Dauer, Lohn und Schulen: Lehre (EFZ, EBA), Höhere Berufsbildung, Fachhochschule und Universität.`,
    description: "Alle Berufe und Ausbildungen der Schweiz von A bis Z: Lehre EFZ und EBA, Höhere Fachschule, Fachhochschule, Universität, Berufsprüfung und höhere Fachprüfung.",
    crumbs: [["Inspirella", "/"], ["Berufe"]],
    body: `<section class="card"><h2>Nach Abschluss</h2><ul class="cols">${hubTypes.map(([t, h]) => `<li><a href="/berufe/${h.slug}/">${esc(h.label)} (${(indexableByType.get(t) ?? []).length})</a></li>`).join("")}</ul></section>\n  ${azList(indexableProfs)}`
  }));
  for (const [t, h] of hubTypes) {
    const list = indexableByType.get(t) ?? [];
    await writePage(["berufe", h.slug], renderHub({
      path: `/berufe/${h.slug}/`,
      title: h.heading,
      h1: h.heading,
      lead: `${list.length} Berufe in dieser Kategorie, von A bis Z.`,
      description: `${h.heading}: ${list.length} Berufe mit Beschreibung, Dauer, Lohn und Schulen.`,
      crumbs: [["Inspirella", "/"], ["Berufe", "/berufe/"], [h.label]],
      body: azList(list)
    }));
    urls.push({ loc: `${SITE}/berufe/${h.slug}/`, lastmod: today });
  }
  const cantonsPresent = [...new Set(indexableSchools.map(s => s.cantonCode).filter((c): c is string => !!c && !!CANTON_NAMES[c]))].sort((a, b) => CANTON_NAMES[a].localeCompare(CANTON_NAMES[b], "de"));
  await writePage(["schulen"], renderHub({
    path: "/schulen/",
    title: "Alle Schulen und Hochschulen der Schweiz",
    h1: "Alle Schulen und Hochschulen der Schweiz",
    lead: `${indexableSchools.length} Gymnasien, Berufsfachschulen, Fachhochschulen und Universitäten, nach Kanton geordnet.`,
    description: "Schulen, Hochschulen und Ausbildungszentren der Schweiz nach Kanton: Berufsfachschulen, Gymnasien, Höhere Fachschulen, Fachhochschulen und Universitäten.",
    crumbs: [["Inspirella", "/"], ["Schulen"]],
    body: `<section class="card"><h2>Nach Kanton</h2><ul class="cols">${cantonsPresent.map(c => `<li><a href="/schulen/${c.toLowerCase()}/">${esc(CANTON_NAMES[c])} (${indexableSchools.filter(s => s.cantonCode === c).length})</a></li>`).join("")}</ul></section>\n  ${azList(indexableSchools)}`
  }));
  for (const c of cantonsPresent) {
    const list = indexableSchools.filter(s => s.cantonCode === c);
    await writePage(["schulen", c.toLowerCase()], renderHub({
      path: `/schulen/${c.toLowerCase()}/`,
      title: `Schulen und Hochschulen im Kanton ${CANTON_NAMES[c]}`,
      h1: `Schulen und Hochschulen im Kanton ${CANTON_NAMES[c]}`,
      lead: `${list.length} Schulen, Hochschulen und Ausbildungszentren im Kanton ${CANTON_NAMES[c]}.`,
      description: `Schulen im Kanton ${CANTON_NAMES[c]}: ${list.length} Gymnasien, Berufsfachschulen und Hochschulen mit Zulassung und Ausbildungen.`,
      crumbs: [["Inspirella", "/"], ["Schulen", "/schulen/"], [CANTON_NAMES[c]]],
      body: azList(list)
    }));
    urls.push({ loc: `${SITE}/schulen/${c.toLowerCase()}/`, lastmod: today });
  }
  await fs.writeFile(path.join(DIST, "redirects.json"), JSON.stringify(redirects), "utf8");

  // Education system overview in German, English and Ukrainian (a failure here only skips these pages).
  try {
    const nodes = await fetchAll((from, to) => supabase.from("education_nodes").select("*").eq("is_active", true).order("id", { ascending: true }).range(from, to));
    const transitions = await fetchAll((from, to) => supabase.from("education_transitions").select("*").eq("is_active", true).order("code", { ascending: true }).range(from, to));
    const statusFacts = await fetchAll((from, to) =>
      supabase.from("audience_facts").select("*").eq("is_active", true).eq("audience", "ukraine_s").is("canton_code", null).order("sort_order", { ascending: true }).range(from, to)
    );
    if (nodes.length) {
      for (const lang of Object.keys(SYS) as SysLang[]) {
        await writePage(SYS[lang].path.split("/").filter(Boolean), renderSystem(lang, nodes, transitions, statusFacts));
        urls.push({ loc: SITE + SYS[lang].path, lastmod: today });
      }
      console.log(`[pages] education system pages: ${nodes.length} stages, ${transitions.length} routes, ${statusFacts.length} status S facts.`);
    }
  } catch (err: any) {
    console.warn("[pages] Education system pages skipped:", err?.message || err);
  }
  // Protection status S guide: hub plus one page per canton in German, English and Ukrainian (verified facts only).
  try {
    const sFacts = await fetchAll((from, to) =>
      supabase.from("audience_facts").select("*").eq("is_active", true).eq("audience", "ukraine_s").eq("verification_status", "verified").order("sort_order", { ascending: true }).range(from, to)
    );
    const national = sFacts.filter(f => !f.canton_code);
    const byCanton = new Map<string, Row[]>();
    for (const f of sFacts) {
      const code = String(f.canton_code || "").toUpperCase();
      if (!code || !CANTON_NAMES[code]) continue;
      byCanton.set(code, [...(byCanton.get(code) ?? []), f]);
    }
    const langs: SLang[] = ["de", "en", "uk"];
    const avail = new Map<string, SLang[]>();
    for (const [code, rows] of byCanton) avail.set(code, langs.filter(l => rows.some(r => statusFact(r, l))));
    const availableIn = (code: string): SLang[] => avail.get(code) ?? [];
    let statusPages = 0;
    for (const lang of langs) {
      if (!national.some(f => statusFact(f, lang))) continue;
      const segs = STATUS_S[lang].base.split("/").filter(Boolean);
      await writePage(segs, renderStatusPage(lang, null, national, byCanton, availableIn, today));
      urls.push({ loc: SITE + STATUS_S[lang].base, lastmod: newest(national, today) });
      statusPages++;
      for (const code of byCanton.keys()) {
        if (!availableIn(code).includes(lang)) continue;
        await writePage([...segs, code.toLowerCase()], renderStatusPage(lang, code, national, byCanton, availableIn, today));
        urls.push({ loc: `${SITE}${STATUS_S[lang].base}${code.toLowerCase()}/`, lastmod: newest(byCanton.get(code)!, today) });
        statusPages++;
      }
    }
    console.log(`[pages] status S pages: ${statusPages} (${national.length} national facts, ${byCanton.size} cantons).`);
  } catch (err: any) {
    console.warn("[pages] Status S pages skipped:", err?.message || err);
  }
  // Bridge programmes by canton + adult qualification guide (German and Ukrainian, verified rows only).
  try {
    const progs = await fetchAll((from, to) =>
      supabase.from("education_programs").select("*").eq("is_active", true).eq("verification_status", "verified").order("code", { ascending: true }).range(from, to)
    );
    const bridgeRows = progs.filter(r => BRIDGE_KIND_ORDER.includes(String(r.kind)));
    const byCanton = new Map<string, Row[]>();
    for (const r of bridgeRows) {
      const code = String(r.canton_code || "").toUpperCase();
      if (!code || !CANTON_NAMES[code]) continue;
      byCanton.set(code, [...(byCanton.get(code) ?? []), r]);
    }
    const guideNodes = await fetchAll((from, to) => supabase.from("education_nodes").select("*").eq("is_active", true).in("code", ["bridge", "adult"]).range(from, to));
    const bridgeNode = guideNodes.find(n => n.code === "bridge");
    const adultNode = guideNodes.find(n => n.code === "adult");
    const glangs: GLang[] = ["de", "uk"];
    const gavail = new Map<string, GLang[]>();
    for (const [code, rows] of byCanton) gavail.set(code, glangs.filter(l => rows.some(r => guideField(r, "title", l) && guideField(r, "description", l))));
    const gavailableIn = (code: string): GLang[] => gavail.get(code) ?? [];
    let guidePages = 0;
    for (const lang of glangs) {
      const g = GUIDES[lang];
      const segs = g.bridgeBase.split("/").filter(Boolean);
      if (byCanton.size) {
        await writePage(segs, renderBridgePage(lang, null, byCanton, gavailableIn, bridgeNode, today));
        urls.push({ loc: SITE + g.bridgeBase, lastmod: newest(bridgeRows, today) });
        guidePages++;
        for (const code of byCanton.keys()) {
          if (!gavailableIn(code).includes(lang)) continue;
          await writePage([...segs, code.toLowerCase()], renderBridgePage(lang, code, byCanton, gavailableIn, bridgeNode, today));
          urls.push({ loc: `${SITE}${g.bridgeBase}${code.toLowerCase()}/`, lastmod: newest(byCanton.get(code)!, today) });
          guidePages++;
        }
      }
      if (adultNode && guideField(adultNode, "summary", lang)) {
        await writePage(g.adultPath.split("/").filter(Boolean), renderAdultGuide(lang, adultNode, today));
        urls.push({ loc: SITE + g.adultPath, lastmod: newest([adultNode], today) });
        guidePages++;
      }
    }
    console.log(`[pages] bridge/adult guide pages: ${guidePages} (${bridgeRows.length} programmes, ${byCanton.size} cantons).`);
  } catch (err: any) {
    console.warn("[pages] Bridge/adult guide pages skipped:", err?.message || err);
  }
  // Admission rules (Gymnasium, FMS, HMS, Berufsmaturität) by canton, German and Ukrainian, verified cantonal rows only.
  try {
    const adm = await fetchAll((from, to) =>
      supabase.from("admission_conditions").select("*").eq("is_active", true).eq("verification_status", "verified").is("institution_id", null).order("code", { ascending: true }).range(from, to)
    );
    const admRows = adm.filter(r => ADMISSION_ROUTES.includes(String(r.route)));
    const byCantonAdm = new Map<string, Row[]>();
    for (const r of admRows) {
      const code = String(r.canton_code || "").toUpperCase();
      if (!code || !CANTON_NAMES[code]) continue;
      byCantonAdm.set(code, [...(byCantonAdm.get(code) ?? []), r]);
    }
    const alangs: GLang[] = ["de", "uk"];
    const aavail = new Map<string, GLang[]>();
    for (const [code, rows] of byCantonAdm) aavail.set(code, alangs.filter(l => rows.some(r => admissionField(r, "headline", l))));
    const aavailableIn = (code: string): GLang[] => aavail.get(code) ?? [];
    let admissionPages = 0;
    for (const lang of alangs) {
      const a = ADMISSION[lang];
      const segs = a.base.split("/").filter(Boolean);
      if (!byCantonAdm.size) continue;
      await writePage(segs, renderAdmissionPage(lang, null, byCantonAdm, aavailableIn, today));
      urls.push({ loc: SITE + a.base, lastmod: newest(admRows, today) });
      admissionPages++;
      for (const code of byCantonAdm.keys()) {
        if (!aavailableIn(code).includes(lang)) continue;
        await writePage([...segs, code.toLowerCase()], renderAdmissionPage(lang, code, byCantonAdm, aavailableIn, today));
        urls.push({ loc: `${SITE}${a.base}${code.toLowerCase()}/`, lastmod: newest(byCantonAdm.get(code)!, today) });
        admissionPages++;
      }
    }
    console.log(`[pages] admission pages: ${admissionPages} (${admRows.length} rules, ${byCantonAdm.size} cantons).`);
  } catch (err: any) {
    console.warn("[pages] Admission pages skipped:", err?.message || err);
  }
  await fs.writeFile(path.join(DIST, "404.html"), render404(), "utf8");
  await writePage(["impressum"], renderLegal(IMPRESSUM.de, "impressum"));
  await writePage(["datenschutz"], renderLegal(PRIVACY.de, "datenschutz"));

  // Home: write plain content into the app shell. Featured links = the best-connected records.
  const popular = (m: Map<string, Link[]>, pick: Map<string, { slug: string; title: string }>, base: string, n: number): Link[] =>
    [...m.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, n)
      .map(([id]) => ({ title: pick.get(id)!.title, href: `/${base}/${pick.get(id)!.slug}/` }));
  const featured: HomeFeatured = {
    professions: popular(schoolsByProfession, profInfo, "beruf", 12),
    institutions: popular(professionsByInstitution, instInfo, "institution", 12)
  };
  try {
    const shellPath = path.join(DIST, "index.html");
    const shell = await fs.readFile(shellPath, "utf8");
    if (shell.includes("<!--prerender-home-->")) {
      await fs.writeFile(shellPath, shell.replace("<!--prerender-home-->", renderHomeBlock(counts, featured)), "utf8");
    } else {
      console.warn("[pages] Home marker not found in dist/index.html - home left as is.");
    }
  } catch (err: any) {
    console.warn("[pages] Could not write the home content:", err?.message || err);
  }

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod || today}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  await fs.writeFile(path.join(DIST, "sitemap.xml"), sitemap, "utf8");

  console.log(
    `[pages] ${stats.professions} profession pages (${stats.professionsNoindex} noindex), ${stats.institutions} institution pages (${stats.institutionsNoindex} noindex), about page, ${stats.skipped} skipped for bad slug; sitemap has ${urls.length} URLs.`
  );
}

main().catch(err => {
  // Never fail the deploy over SEO pages.
  console.error("[pages] Generation failed, continuing without pre-rendered pages:", err?.message || err);
});
