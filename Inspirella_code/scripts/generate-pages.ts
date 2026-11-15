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
@font-face{font-family:"Manrope";font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/manrope-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Manrope";font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/manrope-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Manrope";font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/manrope-cyrillic.woff2) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:"Wix Madefor Display";font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/wix-display-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Wix Madefor Display";font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/wix-display-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Wix Madefor Display";font-style:normal;font-weight:400 800;font-display:swap;src:url(/fonts/wix-display-cyrillic.woff2) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
:root{--bg:#f8f5fc;--fg:#1e1730;--muted:#5c5470;--card:#fff;--card-b:#e7e1ee;--accent:#4a2377;--accent-2:#a8401a;--coral:#e46f4c;--tint:rgba(74,35,119,.06);--btn:#4a2377;--btn-h:#3a1a60;--sky:#e6daf6;--shadow:0 2px 4px rgba(30,23,48,.04),0 24px 48px -30px rgba(74,35,119,.4);--grain:109,40,217}
body.nacht{--bg:#0b0812;--fg:#ece8f5;--muted:#a9a2bb;--card:rgba(255,255,255,.05);--card-b:rgba(255,255,255,.10);--accent:#c4b5fd;--accent-2:#f4a27f;--tint:rgba(196,181,253,.08);--btn:#7c3aed;--btn-h:#6d28d9;--sky:#1a1030;--shadow:none;--grain:196,181,253}
*{box-sizing:border-box}
html{scrollbar-color:#b9a8dc transparent}
body{margin:0;background:var(--bg) linear-gradient(180deg,var(--sky) 0,var(--bg) 460px) no-repeat;color:var(--fg);font-family:Manrope,"Segoe UI",system-ui,sans-serif;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased}
::selection{background:rgba(228,111,76,.28)}
:focus-visible{outline:3px solid var(--coral);outline-offset:3px;border-radius:6px}
h1,h2,h3{font-family:"Wix Madefor Display",Manrope,sans-serif;margin:0;line-height:1.12;text-wrap:balance}
a{color:inherit;text-underline-offset:4px}
main li,main dd,main td,main th,main p{overflow-wrap:anywhere}
.topo{position:absolute;top:0;right:0;width:min(560px,70vw);height:420px;pointer-events:none;z-index:0;opacity:.9}
.topo path{fill:none;stroke:#e6dcf3;stroke-width:1.1}
body.nacht .topo path{stroke:rgba(196,181,253,.08)}
nav{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;max-width:1080px;margin:0 auto;padding:18px 20px}
.logo{display:flex;align-items:center;gap:10px;font:700 21px Manrope,sans-serif;letter-spacing:-.02em;text-decoration:none}
.logo svg{width:30px;height:30px;color:var(--accent)}
.nav-r{display:flex;gap:18px;align-items:center;font-size:15px;font-weight:500;flex-wrap:wrap;justify-content:flex-end}
.nav-r a{color:var(--muted);text-decoration:none}.nav-r a:hover{color:var(--fg)}
.nav-r a.app{color:#fff;background:var(--btn);padding:9px 14px;border-radius:12px;font-weight:650}
.nav-r a.app:hover{background:var(--btn-h);color:#fff}
.tgl{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;background:var(--card);border:1px solid var(--card-b);color:var(--fg);border-radius:10px;cursor:pointer}
.tgl svg{width:18px;height:18px}
@media(max-width:640px){.nav-r .opt{display:none}}
main{position:relative;z-index:2;max-width:1080px;margin:0 auto;padding:8px 20px 80px}
.crumbs{font-size:13.5px;color:var(--muted);margin:10px 0 28px}
.crumbs a{text-decoration:none}.crumbs a:hover{color:var(--accent)}
.hero{display:grid;gap:18px;margin-bottom:36px}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.badge{font:700 13px Manrope,sans-serif;padding:5px 12px;border-radius:99px;border:1px solid var(--card-b);background:var(--card);color:var(--accent)}
.badge.warm{color:var(--accent-2);background:#fbe3d9;border-color:#f5cdbd}
body.nacht .badge.warm{background:rgba(244,162,127,.1);border-color:rgba(244,162,127,.3)}
h1{font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-.035em}
.lead{font-size:clamp(17px,2vw,20px);color:var(--muted);max-width:62ch;margin:0}
.cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:13px 22px;border-radius:14px;font:650 15.5px Manrope,sans-serif;text-decoration:none;border:1px solid transparent;transition:transform .15s,background .2s}
.btn:active{transform:scale(.98)}
.btn-primary{color:#fff;background:var(--btn);box-shadow:0 12px 26px -14px rgba(74,35,119,.75)}
.btn-primary:hover{background:var(--btn-h)}
.btn-sec{background:var(--card);border-color:var(--card-b);color:var(--fg)}
.btn-sec:hover{border-color:var(--accent)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:36px}
.fact{padding:16px 18px}
.fact small{display:block;color:var(--muted);font-size:13px;font-weight:600;margin-bottom:4px}
.fact b{font:800 19px "Wix Madefor Display",sans-serif;letter-spacing:-.01em}
.card{border-radius:20px;border:1px solid var(--card-b);background:var(--card);box-shadow:var(--shadow);transition:border-color .3s}
a.card:hover,.card:hover{border-color:#d4c7e8}
body.nacht .card:hover{border-color:rgba(196,181,253,.3)}
.grid{display:grid;grid-template-columns:1.55fr 1fr;gap:22px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:22px}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
section.card{padding:26px 28px}
section.card+section.card{margin-top:22px}
.grid2 section.card+section.card{margin-top:0}
.chips{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}.chips li{padding:6px 12px;border-radius:99px;border:1px solid var(--card-b);background:var(--tint);font-size:14px}
.qa{border-top:1px solid var(--card-b);padding:12px 0}.qa summary{cursor:pointer;font-weight:700}.qa p{margin:8px 0 0;color:var(--muted)}
ul.cols{list-style:none;margin:0;padding:0;columns:2 260px;column-gap:28px}ul.cols li{break-inside:avoid;padding:3px 0}ul.cols a{text-decoration:none}ul.cols a:hover{color:var(--accent);text-decoration:underline}ul.cols span{color:var(--muted);font-size:13px}
table.cmp{border-collapse:collapse;width:100%;font-size:15px;font-variant-numeric:tabular-nums}table.cmp th,table.cmp td{border-bottom:1px solid var(--card-b);padding:9px 12px;text-align:left;vertical-align:top}table.cmp thead th{color:var(--accent);font-size:13.5px;font-weight:700}
h3{font:700 18px "Wix Madefor Display",sans-serif;margin:0 0 8px}
h2{font-size:23px;font-weight:800;letter-spacing:-.02em;margin-bottom:14px}
.dl{display:grid;gap:16px;margin:0}
.dl dt{font:700 13.5px Manrope,sans-serif;color:var(--accent);margin-bottom:2px}
.dl dd{margin:0;max-width:75ch}
.schools{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.school{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;border:1px solid var(--card-b);background:var(--tint);text-decoration:none;color:inherit;transition:border-color .2s,transform .2s}
a.school:hover{border-color:var(--accent);transform:translateX(3px)}
.school span{font-size:13px;color:var(--muted)}
.cant{font:700 12px Manrope,sans-serif;font-style:normal;padding:3px 9px;border-radius:99px;border:1px solid var(--card-b);color:var(--accent);background:var(--card)}
.more{margin:12px 0 0;color:var(--muted);font-size:14px}
.prose p{margin:0 0 14px}.prose p:last-child{margin:0}.prose ul{margin:0;padding-left:20px}.prose li{margin-bottom:6px}.prose a{color:var(--accent)}
.eyebrow{font:700 13.5px Manrope,sans-serif;color:var(--accent-2);display:block;margin-bottom:6px}
.source{margin-top:30px;padding:16px 20px;font-size:14px;color:var(--muted);border-radius:14px;border:1px dashed var(--card-b)}
.source a{color:var(--accent)}
.note{margin-top:22px;padding:18px 22px;border-radius:14px;border:1px solid #f5cdbd;background:#fdf1ea}
body.nacht .note{border-color:rgba(251,146,60,.3);background:rgba(251,146,60,.06)}
.foot{position:relative;z-index:2;background:#1b0d30;color:#cfc5e0;font-size:14px;padding:34px 20px 40px}
.foot .in{max-width:1080px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center}
.foot .brand{display:inline-flex;align-items:center;gap:9px;font:700 18px Manrope,sans-serif;color:#fff;text-decoration:none;margin-right:10px}
.foot .brand svg{width:26px;height:26px;color:#d8cbee}
.foot a{text-decoration:none;color:#cfc5e0}.foot a:hover{color:#fff;text-decoration:underline}
.foot .date{margin-left:auto;color:#a99cc2}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const SCRIPT = `
(function(){
  var b=document.body,t=null;
  try{t=localStorage.getItem("inspirella_theme")}catch(e){}
  if(t==="nacht"||t==="dark")b.classList.add("nacht");
  var g=document.getElementById("tgl");
  if(g)g.onclick=function(){var n=b.classList.toggle("nacht");try{localStorage.setItem("inspirella_theme",n?"nacht":"alpen")}catch(e){}};
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

/** Entries for the share-preview images the server draws on request (dist/og-index.json, see ogImage.ts). */
const OG_INDEX: Record<string, { t: string; s?: string; k?: string }> = {};
const OG_KINDS: Record<string, string> = {
  beruf: "Beruf",
  institution: "Schule",
  berufe: "Berufe",
  schulen: "Schulen",
  methodik: "Methodik",
  lehrlingsloehne: "Lehrlingslöhne",
  "status-s": "Schutzstatus S",
  zulassung: "Zulassung",
  brueckenangebote: "Brückenangebote",
  passerelle: "Passerelle",
  "berufsabschluss-fuer-erwachsene": "Berufsabschluss für Erwachsene",
  bildungssystem: "Bildungssystem",
  "swiss-education-system": "Education system",
  "systema-osvity-shveitsarii": "Система освіти",
  pryjom: "Вступ",
  "perekhidni-prohramy": "Перехідні програми",
  "diplom-dlia-doroslykh": "Диплом для дорослих"
};
const OG_KINDS_UK: Record<string, string> = { beruf: "Професія", institution: "Школа" };
const OG_KINDS_EN: Record<string, string> = { beruf: "Career", institution: "School" };
function registerOg(url: string, title: string, description: string): string {
  const p = new URL(url).pathname.replace(/\/+$/, "");
  if (!p) return SITE + "/og-image.png";
  const parts = p.split("/").filter(Boolean);
  const seg = parts[0] === "en" || parts[0] === "uk" ? parts[1] ?? "" : parts[0];
  OG_INDEX[p] = { t: title.replace(/\s*\|\s*Inspirella$/, ""), s: truncate(description, 110), k: (parts[0] === "uk" ? OG_KINDS_UK[seg] : parts[0] === "en" ? OG_KINDS_EN[seg] : undefined) ?? OG_KINDS[seg] ?? "Inspirella" };
  return `${SITE}/og${p}.png`;
}

const SWIFT_SVG = "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path d=\"M24 24C19 19.5 11 15.5 2 15.5C9 18.5 15.5 23.5 20.6 28.6L18.2 40.5L24 34.6L29.8 40.5L27.4 28.6C32.5 23.5 39 18.5 46 15.5C37 15.5 29 19.5 24 24Z\" fill=\"currentColor\"/><circle cx=\"24\" cy=\"17.2\" r=\"3.8\" fill=\"#e46f4c\"/></svg>";
const TOPO_SVG = "<svg class=\"topo\" viewBox=\"0 0 560 420\" preserveAspectRatio=\"xMaxYMin slice\" aria-hidden=\"true\"><path d=\"M529 40C530 42 530 44 529 45C528 47 525 49 521 50C518 51 512 51 508 51C503 51 497 50 493 50C489 49 485 48 482 47C479 46 478 45 477 46C476 46 477 46 477 48C477 49 478 52 478 55C478 58 478 61 477 65C475 68 473 72 470 75C467 78 463 80 459 82C455 83 450 83 446 83C442 82 439 80 437 78C435 75 434 72 434 69C434 66 436 62 437 59C439 56 442 53 444 51C446 49 449 47 450 46C451 45 452 44 452 43C451 43 450 43 448 42C446 41 443 41 441 40C438 39 435 38 433 37C431 35 430 34 429 32C428 31 428 29 429 28C430 27 431 26 433 25C435 24 437 23 439 22C441 21 443 21 445 20C447 19 449 19 450 18C452 17 454 16 456 15C458 14 460 13 462 12C465 11 467 10 470 10C473 9 476 9 478 10C481 11 483 12 485 13C487 14 489 16 490 18C491 20 491 22 491 23C492 25 491 26 492 27C493 28 493 29 495 30C496 30 498 30 501 31C504 31 508 32 511 32C514 33 519 34 522 35C525 37 528 38 529 40Z\"/><path d=\"M576 45C577 48 576 52 574 55C572 58 567 61 562 63C557 66 550 67 543 68C537 69 530 70 524 70C518 70 512 70 508 70C503 70 500 71 498 72C496 73 495 75 493 78C491 81 491 84 488 88C486 92 483 97 479 101C475 105 470 110 464 113C458 116 450 118 444 119C437 120 429 119 423 118C417 116 411 113 407 109C403 106 400 101 399 96C398 92 398 87 399 83C399 78 401 74 402 71C403 68 404 65 404 63C404 60 404 58 402 57C400 55 397 53 395 51C392 49 388 47 385 45C382 43 379 40 377 37C375 34 374 31 374 28C374 25 375 22 377 20C379 17 383 15 386 12C389 10 393 8 397 7C401 5 405 3 409 2C413 0 417 -2 421 -3C425 -5 429 -7 434 -8C438 -10 443 -12 448 -13C453 -14 459 -15 464 -15C469 -15 475 -15 480 -14C485 -13 490 -11 495 -9C499 -7 502 -4 506 -2C509 1 511 4 513 6C516 8 517 11 520 13C522 15 525 17 528 18C531 20 536 21 540 23C544 24 550 26 554 28C559 30 564 33 568 36C572 38 575 42 576 45Z\"/><path d=\"M622 50C623 55 621 60 618 65C615 69 609 73 602 77C595 80 586 83 578 85C570 88 561 89 554 90C546 91 539 92 533 93C528 95 523 96 519 99C515 101 513 104 510 108C506 112 503 117 499 122C494 127 489 133 482 138C475 143 467 148 458 151C449 154 438 156 429 156C419 157 409 155 400 153C392 150 384 146 378 141C372 136 368 129 365 124C362 118 362 111 361 106C360 101 361 95 360 91C360 86 360 83 359 79C357 76 355 73 352 70C349 67 345 64 341 61C337 57 332 54 328 50C325 46 321 42 320 37C318 33 317 28 318 24C319 19 322 15 325 11C329 7 334 3 339 0C344 -3 350 -6 356 -9C361 -12 368 -14 374 -17C380 -19 386 -22 392 -24C399 -27 405 -29 412 -32C419 -34 426 -36 434 -37C442 -39 450 -40 458 -40C466 -40 474 -39 482 -38C490 -36 497 -34 504 -31C510 -28 516 -25 521 -22C527 -18 531 -14 535 -11C540 -8 543 -5 548 -2C552 1 557 4 562 7C567 9 573 12 579 14C585 17 592 20 598 24C604 27 610 31 614 36C618 40 622 45 622 50Z\"/><path d=\"M669 55C669 61 666 68 662 74C657 80 649 86 641 90C633 95 622 99 613 102C603 105 592 108 583 110C574 112 566 114 559 117C552 119 547 122 541 126C536 130 532 134 527 140C522 145 517 151 510 157C503 163 495 170 485 176C476 181 464 186 452 189C440 192 426 194 414 194C401 193 388 191 378 187C367 183 357 177 349 171C342 165 336 157 332 150C328 143 326 136 324 129C322 122 321 116 319 111C317 105 316 100 313 96C310 91 306 87 302 83C297 79 291 75 286 70C281 65 275 60 271 55C267 50 264 44 262 38C261 32 261 25 263 20C265 14 269 8 273 3C278 -3 285 -8 292 -12C298 -17 306 -21 314 -25C322 -28 330 -32 338 -35C346 -39 354 -42 363 -46C372 -49 381 -52 390 -55C400 -57 410 -60 420 -62C430 -63 441 -64 452 -64C463 -64 474 -63 484 -61C494 -59 504 -56 513 -53C522 -49 530 -45 537 -41C544 -37 550 -32 557 -28C563 -24 569 -20 576 -16C582 -12 589 -9 596 -5C603 -2 611 2 619 6C627 10 636 14 643 19C650 24 657 30 661 36C665 42 668 49 669 55Z\"/><path d=\"M714 60C714 68 710 76 704 84C699 91 689 98 679 104C670 110 657 114 646 119C635 123 623 126 613 130C603 133 593 136 585 140C577 144 571 148 564 153C557 159 552 165 545 171C537 178 530 186 521 193C512 200 501 208 488 214C476 219 461 225 446 228C431 230 414 232 399 230C384 229 368 226 355 221C342 216 331 208 321 201C312 194 305 184 299 176C294 168 291 159 287 152C284 144 282 137 278 130C275 124 272 118 267 113C262 107 257 102 251 97C245 91 237 86 231 80C225 74 218 67 213 60C209 53 205 45 204 38C203 30 204 23 207 15C210 8 215 1 221 -6C227 -13 236 -19 244 -24C253 -30 263 -35 272 -40C282 -45 292 -50 302 -54C312 -59 323 -63 334 -67C345 -71 356 -75 368 -78C380 -81 393 -84 406 -86C419 -88 433 -89 446 -88C459 -88 473 -87 486 -84C498 -82 511 -78 522 -74C533 -70 543 -65 552 -60C562 -55 570 -50 579 -45C587 -40 595 -35 604 -31C612 -26 621 -22 630 -17C640 -12 650 -8 659 -3C669 3 679 8 687 15C695 21 703 29 708 36C712 44 715 52 714 60Z\"/><path d=\"M760 65C758 74 753 84 746 93C739 102 728 110 717 117C706 124 692 130 680 135C667 141 654 145 643 150C631 155 621 159 612 164C603 169 595 175 587 182C579 188 572 196 563 204C554 212 545 221 533 229C521 237 507 246 491 252C476 258 458 264 440 266C422 269 402 269 384 267C367 265 349 260 333 254C318 248 305 239 294 230C283 221 275 211 268 202C261 192 256 182 251 174C246 165 243 157 238 150C233 142 227 136 221 129C214 123 207 117 199 110C191 103 182 97 175 89C167 82 160 74 155 65C150 56 146 47 146 38C145 29 147 20 151 11C155 2 161 -7 169 -14C177 -22 187 -30 197 -37C207 -43 219 -50 230 -56C242 -62 254 -67 266 -73C279 -78 291 -83 304 -88C318 -93 332 -98 346 -101C361 -105 376 -108 392 -110C407 -112 424 -113 440 -113C456 -112 472 -110 487 -107C502 -104 517 -100 530 -95C544 -91 556 -85 568 -79C579 -74 590 -68 600 -62C611 -57 621 -51 632 -46C643 -40 654 -35 665 -29C677 -24 689 -18 700 -11C711 -5 723 2 732 10C741 18 749 27 754 36C759 45 761 56 760 65Z\"/><path d=\"M804 70C802 81 796 92 787 102C779 112 766 122 754 130C741 138 726 145 713 152C699 158 685 164 673 170C660 176 649 181 639 188C629 195 620 202 611 210C601 218 593 228 582 237C571 247 559 257 545 266C530 275 513 284 495 291C476 297 455 302 434 304C413 306 390 306 370 303C350 300 329 293 312 286C295 279 280 268 267 258C255 248 245 237 237 226C228 216 222 205 216 196C209 186 204 177 197 169C190 161 183 154 174 146C166 139 156 132 146 124C137 116 126 108 118 99C109 90 101 80 96 70C90 60 87 49 87 38C87 28 89 17 94 6C100 -4 108 -14 117 -23C126 -32 138 -41 150 -49C162 -57 175 -64 189 -71C202 -78 216 -85 230 -91C245 -98 260 -104 275 -110C291 -115 307 -120 324 -125C341 -129 360 -132 378 -134C396 -136 415 -137 434 -136C453 -136 471 -133 489 -130C506 -127 523 -122 539 -116C555 -111 569 -105 583 -98C597 -92 609 -86 622 -79C635 -73 648 -67 661 -61C674 -54 687 -48 701 -42C714 -35 728 -28 741 -20C754 -12 767 -4 777 6C787 15 796 26 800 37C805 47 806 59 804 70Z\"/></svg>";

/** The shared page shell: head/SEO tags, ambient background, nav, footer, theme + sand script. */
function layout(o: LayoutOptions): string {
  const nav = o.nav ?? { about: "Über Inspirella", app: "Zur App" };
  const ogImage = registerOg(o.url, o.ogTitle, o.description);
  const hreflang = (o.alternates ?? []).map(a => `<link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.href)}">`).join("\n");
  return `<!doctype html>
<html lang="${esc(o.lang ?? "de")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.docTitle)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(o.url)}">
${hreflang ? hreflang + "\n" : ""}${o.indexable ? "" : '<meta name="robots" content="noindex, follow">\n'}<meta name="theme-color" content="#e6daf6">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/swift-mark-64.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Inspirella">
<meta property="og:title" content="${esc(o.ogTitle)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(o.url)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImage}">
<link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, "\\u003c")}</script>
<style>${CSS}</style>
<script src="/analytics.js" defer></script>
</head>
<body>
<script>try{var __t=localStorage.getItem("inspirella_theme");if(__t==="nacht"||__t==="dark")document.body.classList.add("nacht")}catch(e){}</script>
${TOPO_SVG}
<nav>
  <a class="logo" href="/" aria-label="Inspirella">${SWIFT_SVG}inspirella</a>
  <div class="nav-r"><a class="opt" href="${o.lang === "uk" ? "/uk/beruf/" : o.lang === "en" ? "/en/beruf/" : "/berufe/"}">${o.lang === "uk" ? "Професії" : o.lang === "en" ? "Careers" : "Berufe"}</a><a class="opt" href="/schulen/">${o.lang === "uk" ? "Школи" : o.lang === "en" ? "Schools" : "Schulen"}</a><a class="opt" href="/ueber-inspirella/">${esc(nav.about)}</a><button class="tgl" id="tgl" type="button" aria-label="${o.lang === "uk" ? "Денний або нічний режим" : o.lang === "en" ? "Day or night mode" : "Tag- oder Nachtmodus"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg></button><a class="app" href="/">${esc(nav.app)}</a></div>
</nav>
<main>
${o.main}
</main>
<div class="foot"><div class="in"><a class="brand" href="/">${SWIFT_SVG}inspirella</a> ${
    o.lang === "uk"
      ? `<a href="/ueber-inspirella/">Про Inspirella</a> · <a href="/uk/systema-osvity-shveitsarii/">Система освіти</a> · <a href="/impressum/">Імпресум</a> · <a href="/datenschutz/">Конфіденційність</a> · <a href="#cookie-settings" data-cookie-settings>Налаштування cookie</a>`
      : o.lang === "en"
        ? `<a href="/ueber-inspirella/">About Inspirella</a> · <a href="/en/swiss-education-system/">Education system</a> · <a href="/impressum/">Imprint</a> · <a href="/datenschutz/">Privacy</a> · <a href="#cookie-settings" data-cookie-settings>Cookie settings</a>`
        : `<a href="/ueber-inspirella/">Über Inspirella</a> · <a href="/bildungssystem/">Bildungssystem</a> · <a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a> · <a href="#cookie-settings" data-cookie-settings>Cookie-Einstellungen</a>`
  }<span class="date">© 2026 Inspirella</span></div></div>
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
  regionByGroup: Map<string, Row[]>;
  factsByProf: Map<string, Row>;
  profRowByCode: Map<string, Row>;
  instById: Map<string, { slug: string; title: string; city?: string; canton?: string }>;
  today: string;
}

const WAGE_REGIONS: [string, string][] = [
  ["Zürich", "ZH"],
  ["Nordwestschweiz", "BS, BL, AG"],
  ["Espace Mittelland", "BE, FR, SO, NE, JU"],
  ["Genferseeregion", "VD, VS, GE"],
  ["Zentralschweiz", "LU, UR, SZ, OW, NW, ZG"],
  ["Ostschweiz", "GL, SH, AR, AI, SG, GR, TG"],
  ["Tessin", "TI"]
];

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

/** The short title, or the full one when another page already took that short title (keeps every page title unique). */
const USED_TITLE_BASES = new Set<string>();
function uniqueBase(title: string): string {
  const short = shortTitle(title);
  if (USED_TITLE_BASES.has(short)) return title;
  USED_TITLE_BASES.add(short);
  return short;
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

function renderProfession(p: Row, slug: string, schools: Link[], ctx: Ctx, langs: PLang[] = []): { html: string; indexable: boolean; lastmod?: string } {
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

  // "Davor / danach": links to the next and previous steps of the Swiss system, by type of qualification
  const STEP_LINKS: Record<string, { before?: [string, string][]; after?: [string, string][] }> = {
    apprenticeship_eba: { before: [["Brückenangebote nach Kanton", "/brueckenangebote/"]], after: [["Lehrberufe EFZ", "/berufe/efz/"]] },
    apprenticeship_efz: {
      before: [["Brückenangebote nach Kanton", "/brueckenangebote/"], ["Lehrberufe EBA", "/berufe/eba/"]],
      after: [["Höhere Fachschule (HF)", "/berufe/hf/"], ["Berufsprüfung (Fachausweis)", "/berufe/berufspruefung/"], ["Fachhochschule (FH), mit Berufsmaturität", "/berufe/fh/"]]
    },
    hf_diploma: { before: [["Lehrberufe EFZ", "/berufe/efz/"]], after: [["Höhere Fachprüfung (Diplom)", "/berufe/hoehere-fachpruefung/"]] },
    fachausweis: { before: [["Lehrberufe EFZ", "/berufe/efz/"]], after: [["Höhere Fachprüfung (Diplom)", "/berufe/hoehere-fachpruefung/"]] },
    diplom: { before: [["Berufsprüfung (Fachausweis)", "/berufe/berufspruefung/"]] },
    fh_bachelor: { before: [["Zulassung nach Kanton", "/zulassung/"], ["Lehrberufe EFZ", "/berufe/efz/"]] },
    university: { before: [["Zulassung nach Kanton", "/zulassung/"]] }
  };
  const steps = STEP_LINKS[type];
  const stepList = (label: string, items?: [string, string][]) => (items?.length ? `<p style="margin:0 0 6px"><strong>${label}</strong></p><ul>${items.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join("")}</ul>` : "");
  const stepsHtml = steps ? `<section class="card prose"><h2>Davor und danach</h2>${stepList("Davor", steps.before)}${stepList("Danach", steps.after)}</section>` : "";

  const typeLabel = TYPE_LABELS[type];
  const duration = monthsText(details?.duration_min_months, details?.duration_max_months) || (facts?.duration_years ? `${String(facts.duration_years).replace(".", ",")} Jahre` : undefined);
  const wageLines = wages.map(w => `${w.year_no}. Lehrjahr: ${w.min_chf === w.max_chf ? chf(w.min_chf) : `${chf(w.min_chf)} bis ${chf(w.max_chf)}`} pro Monat`);
  const approx = p.isco_confidence === "medium" ? "ungefähr " : "";
  const groupName = bench ? String(bench.group_name_de).replace(/^\d+\s+/, "") : "";
  const medianText = bench ? `${approx}${chf(bench.median)} pro Monat (Median, brutto, Vollzeit; mittlere 50 %: ${chf(bench.p25)} bis ${chf(bench.p75)})` : undefined;
  const regionRows = bench ? ctx.regionByGroup.get(String(p.isco_group)) ?? [] : [];
  const regionHtml =
    bench && regionRows.length >= 4
      ? `<section class="card"><h2>Lohn nach Region (Berufsgruppe «${esc(groupName)}»)</h2><div style="overflow-x:auto"><table class="cmp"><thead><tr><th>Grossregion (Kantone)</th><th>Median, CHF pro Monat</th></tr></thead><tbody>${WAGE_REGIONS.map(([name, cantons]) => {
          const row = regionRows.find(r => String(r.region) === name);
          return row ? `<tr><th>${esc(name)} <small>(${esc(cantons)})</small></th><td>${esc(approx + chf(row.median))}</td></tr>` : "";
        }).join("")}<tr><th>Schweiz</th><td>${esc(approx + chf(bench.median))}</td></tr></tbody></table></div><p class="more">Zahlen für die ganze Berufsgruppe, nicht für diesen Beruf allein: brutto, Vollzeit, Median, Bundesamt für Statistik, Lohnstrukturerhebung 2024. Das BFS weist die Löhne nach Grossregionen aus; die Kantone sind der jeweiligen Region zugeordnet. Wo eine Region fehlt, ist die Zahl statistisch unsicher oder geschützt.</p></section>`
      : "";
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
  // name what the page covers in the words people search with (Ausbildung, Lohn/Gehalt, Schulen)
  const covers = ["Ausbildung", ...(wageLines.length || bench ? ["Lohn (Gehalt)"] : []), ...(schools.length ? ["Schulen"] : [])];
  const coverText = `Mit ${covers.length > 1 ? `${covers.slice(0, -1).join(", ")} und ${covers[covers.length - 1]}` : covers[0]}.`;
  if (descBits.join(" ").length + coverText.length < 158) descBits.push(coverText);
  else if (descBits.join(" ").length < 100) descBits.push(schools.length ? "Mit Schulen und Quelle." : "Mit Quelle und Hinweisen zur Ausbildung.");
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
    ${langs.length ? `<p class="more" style="margin-top:10px">${langs.map(l => `<a href="/${l}/beruf/${slug}/" hreflang="${l}" lang="${l}">${l === "uk" ? "Українською" : "In English"}</a>`).join(" · ")}</p>` : ""}
  </header>
  ${glance.length ? `<section class="card"><h2>Auf einen Blick</h2><dl class="dl">${glance.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>${ageTexts.length ? `<p class="more">Mittlerer Lohn der Berufsgruppe nach Alter: ${esc(ageTexts.join(" · "))}.</p>` : ""}${wageLines.length || medianText ? `<p class="more">${wageLines.length ? "Lehrlingslohn: Empfehlung der Berufsverbände (berufsberatung.ch), der tatsächliche Lohn hängt von Region und Betrieb ab. " : ""}${medianText ? "Lohn im Beruf: Zahlen für die ganze Berufsgruppe, Bundesamt für Statistik, Lohnstrukturerhebung 2024." : ""}</p>` : ""}</section>` : ""}
  ${regionHtml}
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
      ${stepsHtml}
      ${linkListSection("Verwandte Berufe", related, 10, n => `und ${n} weitere`)}
    </aside>
  </div>
  <div class="source">Quelle &amp; Orientierung: Inspirella ist ein Orientierungswerkzeug. Verbindliche Informationen findest du ${
    specific ? `im <a href="${esc(guidance)}" rel="noopener">Berufsprofil auf berufsberatung.ch</a>` : `bei <a href="${esc(guidance)}" rel="noopener">berufsberatung.ch</a>`
  } und beim kantonalen Berufsinformationszentrum (BIZ). Zuletzt geprüft: ${esc(checked)}. <a href="/methodik/">So arbeiten wir</a>.</div>`;

  return {
    html: layout({ docTitle: fitTitle(uniqueBase(title), [type === "apprenticeship_efz" || type === "apprenticeship_eba" ? "Lehre" : "Ausbildung", ...(wageLines.length || bench ? ["Lohn"] : []), ...(schools.length ? ["Schulen"] : [])]), ogTitle: `${shortTitle(title)} | Inspirella`, description, url, indexable, ld, main, ...(langs.length ? { alternates: profAlternates(slug, langs) } : {}) }),
    indexable,
    lastmod: isoDate(p.updated_at)
  };
}

// --------------------------------------------------------------------------
// Profession page in Ukrainian and English (/uk/beruf/<slug>/, /en/beruf/<slug>/)
// --------------------------------------------------------------------------

type PLang = "uk" | "en";
const PROF_LANGS: PLang[] = ["uk", "en"];

/** A translated profession page is built only when the row has its own title and description in that language. */
function profLangReady(p: Row, lang: PLang): boolean {
  return !!txt(p[`title_${lang}`]) && !!(txt(p[`short_description_${lang}`]) || txt(p[`summary_${lang}`]) || txt(p[`description_${lang}`]));
}

function profAlternates(slug: string, langs: PLang[]): { lang: string; href: string }[] {
  const alts = [{ lang: "de", href: `${SITE}/beruf/${slug}/` }, ...langs.map(l => ({ lang: l, href: `${SITE}/${l}/beruf/${slug}/` }))];
  alts.push({ lang: "x-default", href: `${SITE}/beruf/${slug}/` });
  return alts;
}

const PL = {
  uk: {
    careers: "Професії",
    types: { apprenticeship_efz: "Професійне навчання EFZ", apprenticeship_eba: "Професійне навчання EBA", fachausweis: "Федеральний сертифікат (Fachausweis)", diplom: "Федеральний диплом", hf_diploma: "Вища фахова школа HF", fh_bachelor: "Університет прикладних наук (бакалавр)", university: "Університет / ETH" } as Record<string, string>,
    regulated: "Регульована професія",
    year: (n: number) => (n === 1 ? "1 рік" : n < 5 ? `${n} роки` : `${n} років`),
    months: (n: number) => `${n} міс.`,
    range: (a: string, b: string) => `від ${a} до ${b}`,
    perMonth: "на місяць",
    lyear: (n: number) => `${n}-й рік навчання`,
    glance: "Коротко",
    degree: "Диплом",
    duration: "Тривалість",
    appWage: "Зарплата учня",
    wage: (g: string) => `Зарплата в професії (група «${g}»)`,
    median: (v: string, a: string, b: string) => `${v} на місяць (медіана, брутто, повна зайнятість; середні 50 %: ${a}–${b})`,
    approx: "приблизно ",
    wageNote: "Зарплата учня: рекомендація професійних об’єднань (berufsberatung.ch), реальна сума залежить від регіону та підприємства. Зарплата в професії: дані для всієї професійної групи, Федеральне статистичне управління, обстеження 2024.",
    bm: "Професійна матура (BM) можлива",
    yes: "Так",
    no: "Ні",
    next: "Наступний рівень",
    what: "Що робить людина в цій професії?",
    tasks: "Завдання",
    daily: "Робочий день",
    places: "Де працюють",
    tools: "Інструменти",
    access: "Як потрапити",
    path: "Шлях навчання",
    fit: "Кому підходить?",
    reqs: "Що варто вміти",
    ints: "Підходить вам, якщо ви любите …",
    onward: "Що далі?",
    schools: "Де цьому вчаться?",
    related: "Схожі професії",
    more: (n: number) => `і ще ${n}`,
    cta: "Відкрити професію в Inspirella →",
    deVersion: "Сторінка німецькою",
    lead: (t: string) => `${t}: професія у Швейцарії.`,
    descDur: (d: string) => `Тривалість: ${d}.`,
    descWage: (v: string) => `Зарплата учня від ${v}.`,
    descMedian: (v: string) => `Зарплата: медіана ${v}.`,
    titleParts: (apprentice: boolean, wage: boolean, schools: boolean) => [apprentice ? "навчання" : "освіта", ...(wage ? ["зарплата"] : []), ...(schools ? ["школи"] : [])],
    source: (link: string, date: string) => `Джерело та орієнтир: Inspirella допомагає зорієнтуватися. Офіційну інформацію шукайте ${link} та в кантональному центрі профорієнтації (BIZ). Перевірено: ${date}. <a href="/methodik/">Як ми працюємо</a> (нім.).`,
    sourceSpecific: (u: string) => `у <a href="${u}" rel="noopener">профілі професії на berufsberatung.ch</a> (нім., фр., італ.)`,
    sourceGeneral: (u: string) => `на <a href="${u}" rel="noopener">berufsberatung.ch</a>`,
    nav: { about: "Про Inspirella", app: "До застосунку" },
    country: "Швейцарія"
  },
  en: {
    careers: "Careers",
    types: { apprenticeship_efz: "Apprenticeship EFZ", apprenticeship_eba: "Apprenticeship EBA", fachausweis: "Federal certificate (Fachausweis)", diplom: "Federal diploma", hf_diploma: "College of higher education (HF)", fh_bachelor: "University of applied sciences (Bachelor)", university: "University / ETH" } as Record<string, string>,
    regulated: "Regulated profession",
    year: (n: number) => (n === 1 ? "1 year" : `${n} years`),
    months: (n: number) => `${n} months`,
    range: (a: string, b: string) => `${a} to ${b}`,
    perMonth: "per month",
    lyear: (n: number) => `Year ${n}`,
    glance: "At a glance",
    degree: "Qualification",
    duration: "Duration",
    appWage: "Apprentice pay",
    wage: (g: string) => `Pay in this field (occupational group “${g}”)`,
    median: (v: string, a: string, b: string) => `${v} per month (median, gross, full-time; middle 50%: ${a} to ${b})`,
    approx: "about ",
    wageNote: "Apprentice pay: recommendation of the professional associations (berufsberatung.ch); actual pay depends on region and company. Pay in this field: figures for the whole occupational group, Swiss Federal Statistical Office, Wage Structure Survey 2024.",
    bm: "Vocational baccalaureate (BM) possible",
    yes: "Yes",
    no: "No",
    next: "Next level",
    what: "What do people in this job do?",
    tasks: "Tasks",
    daily: "Everyday work",
    places: "Workplaces",
    tools: "Tools",
    access: "Getting in",
    path: "Education path",
    fit: "Who is it for?",
    reqs: "What you should bring",
    ints: "A good fit if you like …",
    onward: "What comes next?",
    schools: "Where can you learn it?",
    related: "Related careers",
    more: (n: number) => `and ${n} more`,
    cta: "Explore this career in Inspirella →",
    deVersion: "German version",
    lead: (t: string) => `${t}: a career in Switzerland.`,
    descDur: (d: string) => `Duration: ${d}.`,
    descWage: (v: string) => `Apprentice pay from ${v}.`,
    descMedian: (v: string) => `Pay: median ${v}.`,
    titleParts: (apprentice: boolean, wage: boolean, schools: boolean) => [apprentice ? "apprenticeship" : "training", ...(wage ? ["pay"] : []), ...(schools ? ["schools"] : [])],
    source: (link: string, date: string) => `Source and orientation: Inspirella is an orientation tool. For binding information see ${link} and your cantonal career guidance centre (BIZ). Last checked: ${date}. <a href="/methodik/">How we work</a> (German).`,
    sourceSpecific: (u: string) => `the <a href="${u}" rel="noopener">career profile on berufsberatung.ch</a> (German, French, Italian)`,
    sourceGeneral: (u: string) => `<a href="${u}" rel="noopener">berufsberatung.ch</a>`,
    nav: { about: "About Inspirella", app: "Open the app" },
    country: "Switzerland"
  }
};

const PROF_HUB: Record<PLang, { title: string; h1: string; lead: (n: number) => string; groups: Record<string, string> }> = {
  uk: {
    title: "Професії у Швейцарії українською | Inspirella",
    h1: "Професії у Швейцарії",
    lead: n => `${n} професій і освітніх програм українською: що робить людина в професії, скільки триває навчання, яка зарплата і де вчитися.`,
    groups: { apprenticeship_efz: "Професійне навчання EFZ (3–4 роки)", apprenticeship_eba: "Професійне навчання EBA (2 роки)", hf_diploma: "Вища фахова школа (HF)", fh_bachelor: "Університет прикладних наук (FH)", university: "Університет / ETH", fachausweis: "Федеральний сертифікат (Fachausweis)", diplom: "Федеральний диплом", other: "Інші професії" }
  },
  en: {
    title: "Careers in Switzerland in English | Inspirella",
    h1: "Careers in Switzerland",
    lead: n => `${n} careers and programmes in English: what the work involves, how long the training takes, pay, and where to learn it.`,
    groups: { apprenticeship_efz: "Apprenticeships EFZ (3–4 years)", apprenticeship_eba: "Apprenticeships EBA (2 years)", hf_diploma: "Colleges of higher education (HF)", fh_bachelor: "Universities of applied sciences (FH)", university: "University / ETH", fachausweis: "Federal certificate (Fachausweis)", diplom: "Federal diploma", other: "Other careers" }
  }
};

function renderProfessionL(lang: PLang, p: Row, slug: string, schools: Link[], ctx: Ctx, langs: PLang[]): { html: string; indexable: boolean } {
  const L = PL[lang];
  const f = (base: string) => {
    const t = txt(p[`${base}_${lang}`]);
    return t && !PLACEHOLDER.test(t) ? t : undefined;
  };
  const title = f("title")!;
  const url = `${SITE}/${lang}/beruf/${slug}/`;
  const type = String(p.profession_type || "other");
  const details = ctx.detailsByProf.get(String(p.id));
  const facts = ctx.factsByProf.get(String(p.id));
  const wages = (ctx.wagesByProf.get(String(p.id)) ?? []).sort((a, b) => a.year_no - b.year_no);
  const group = p.isco_group && p.isco_confidence !== "low" ? ctx.benchByGroup.get(String(p.isco_group)) : undefined;
  const bench = group?.total;

  const short = f("short_description") || f("summary") || f("description");
  const tasks = [f("role_summary"), f("description"), f("long_description")].find(t => t && !sameText(t, short));
  const daily = f("daily_work_context");
  const detail = ([
    [L.tasks, tasks],
    [L.daily, daily && !sameText(daily, tasks) && !sameText(daily, short) ? daily : undefined],
    [L.places, f("typical_workplace")],
    [L.tools, f("core_tools")],
    [L.access, f("admission_reality")],
    [L.path, f("education_notes")]
  ] as [string, string | undefined][]).filter((s): s is [string, string] => !!s[1]);
  const traitText = (ids: unknown): string[] => (Array.isArray(ids) ? ids.map(i => txt(ctx.traits.get(Number(i))?.[`text_${lang}`])).filter((x): x is string => !!x) : []);
  const reqs = traitText(details?.requirement_ids);
  const ints = traitText(details?.interest_ids);
  if (!reqs.length && !ints.length && f("target_group")) detail.splice(Math.min(4, detail.length), 0, [L.fit, f("target_group")!]);
  const progression = f("progression_notes");

  const typeLabel = L.types[type];
  const fm = (m: number) => (m % 12 === 0 ? L.year(m / 12) : L.months(m));
  const a = details?.duration_min_months, b = details?.duration_max_months;
  const duration = a != null && b != null ? (a === b ? fm(a) : L.range(fm(a), fm(b))) : facts?.duration_years ? L.year(Number(facts.duration_years)) : undefined;
  const wageLines = wages.map(w => `${L.lyear(w.year_no)}: ${w.min_chf === w.max_chf ? chf(w.min_chf) : L.range(chf(w.min_chf), chf(w.max_chf))} ${L.perMonth}`);
  const approx = p.isco_confidence === "medium" ? L.approx : "";
  // occupational group names exist only in German; they stay in German inside quotes
  const groupName = bench ? String(bench.group_name_de).replace(/^\d+\s+/, "") : "";
  const medianText = bench ? L.median(approx + chf(bench.median), chf(bench.p25), chf(bench.p75)) : undefined;
  const bm = txt(facts?.bm_possible);
  const bmText = bm ? (/^(ja|yes|true)/i.test(bm) ? L.yes : /^(nein|no|false)/i.test(bm) ? L.no : undefined) : undefined;
  const follow = [...(Array.isArray(facts?.fh_followups) ? facts!.fh_followups : []), ...(Array.isArray(facts?.weiterbildung) ? facts!.weiterbildung : [])].map(txt).filter((x): x is string => !!x).slice(0, 8);

  const glance: [string, string][] = [];
  if (typeLabel) glance.push([L.degree, typeLabel]);
  if (duration) glance.push([L.duration, duration]);
  if (wageLines.length) glance.push([L.appWage, wageLines.join(" · ")]);
  if (medianText) glance.push([L.wage(groupName), medianText]);
  if (bmText) glance.push([L.bm, bmText]);
  if (follow.length) glance.push([L.next, follow.join(", ")]);

  const guidance = safeUrl(details?.source_url) || safeUrl(facts?.source_url) || safeUrl(p.official_guidance_url) || "https://www.berufsberatung.ch/";
  const specific = guidance !== "https://www.berufsberatung.ch/" && guidance !== "https://www.berufsberatung.ch";
  const checked = isoDate(details?.retrieved_at) || isoDate(p.last_verified_at) || ctx.today;

  // related careers: only those that have a page in this language, else the German page
  const relatedCodes = [...(Array.isArray(details?.similar_codes) ? details!.similar_codes : [])];
  for (const c of ctx.profByCategory.get(String(p.profession_category_id)) ?? []) {
    if (relatedCodes.length >= 10) break;
    if (!relatedCodes.includes(c) && c !== p.code) relatedCodes.push(c);
  }
  const related: Link[] = relatedCodes
    .map(c => ({ info: ctx.profByCode.get(String(c)), row: ctx.profRowByCode.get(String(c)) }))
    .filter(x => x.info && x.row && profLangReady(x.row, lang))
    .slice(0, 10)
    .map(x => ({ title: txt(x.row![`title_${lang}`])!, href: `/${lang}/beruf/${x.info!.slug}/` }));

  const totalText = [short, ...detail.map(d => d[1]), progression, ...glance.map(g => g[1])].filter(Boolean).join(" ");
  const indexable = totalText.length >= MIN_INDEXABLE_CHARS;
  const descBits = [short ? truncate(short, 110) : L.lead(title), duration ? L.descDur(duration) : "", wageLines.length ? L.descWage(chf(wages[0].min_chf)) : bench ? L.descMedian(chf(bench.median)) : ""].filter(Boolean);
  const description = truncate(descBits.join(" "), 158);
  const apprentice = type === "apprenticeship_efz" || type === "apprenticeship_eba";

  const ld: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Occupation",
      name: title,
      description,
      url,
      inLanguage: lang,
      occupationLocation: { "@type": "Country", name: L.country },
      ...(typeLabel ? { educationRequirements: typeLabel } : {}),
      ...(bench ? { estimatedSalary: { "@type": "MonetaryAmountDistribution", currency: "CHF", duration: "P1M", median: Math.round(bench.median), percentile25: Math.round(bench.p25), percentile75: Math.round(bench.p75) } } : {})
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inspirella", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: L.careers, item: `${SITE}/${lang}/beruf/` },
        { "@type": "ListItem", position: 3, name: title, item: url }
      ]
    }
  ];

  const chips = (h: string, list: string[]) => (list.length ? `<section class="card"><h2>${esc(h)}</h2><ul class="chips">${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : "");
  const others = langs.filter(l => l !== lang);
  const langLinks = [`<a href="/beruf/${slug}/" hreflang="de" lang="de">${esc(L.deVersion)}</a>`, ...others.map(l => `<a href="/${l}/beruf/${slug}/" hreflang="${l}" lang="${l}">${l === "uk" ? "Українською" : "In English"}</a>`)].join(" · ");

  const main = `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/${lang}/beruf/">${esc(L.careers)}</a> › ${esc(title)}</div>
  <header class="hero">
    <div class="badges">${typeLabel ? `<span class="badge">${esc(typeLabel)}</span>` : ""}${p.regulated_status === "regulated" ? `<span class="badge warm">${esc(L.regulated)}</span>` : ""}</div>
    <h1>${esc(title)}</h1>
    ${short ? `<p class="lead">${esc(short)}</p>` : ""}
    <div class="cta-row"><a class="btn btn-primary" href="/ressourcen/?beruf=${encodeURIComponent(String(p.code || ""))}&amp;lang=${lang}">${esc(L.cta)}</a></div>
    <p class="more" style="margin-top:10px">${langLinks}</p>
  </header>
  ${glance.length ? `<section class="card"><h2>${esc(L.glance)}</h2><dl class="dl">${glance.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>${wageLines.length || medianText ? `<p class="more">${esc(L.wageNote)}</p>` : ""}</section>` : ""}
  <div class="grid">
    <div>
      ${dlSection(L.what, detail)}
      ${chips(L.reqs, reqs)}
      ${chips(L.ints, ints)}
      ${progression ? `<section class="card"><h2>${esc(L.onward)}</h2><p style="margin:0">${esc(progression)}</p></section>` : ""}
    </div>
    <aside>
      ${linkListSection(L.schools, schools, 100, L.more)}
      ${linkListSection(L.related, related, 10, L.more)}
    </aside>
  </div>
  <div class="source">${L.source(specific ? L.sourceSpecific(esc(guidance)) : L.sourceGeneral(esc(guidance)), esc(checked))}</div>`;

  return {
    html: layout({
      docTitle: fitTitle(title, L.titleParts(apprentice, !!(wageLines.length || bench), !!schools.length)),
      ogTitle: `${title} | Inspirella`,
      description,
      url,
      indexable,
      ld,
      main,
      lang,
      alternates: profAlternates(slug, langs),
      nav: L.nav
    }),
    indexable
  };
}

// --------------------------------------------------------------------------
// Institution page
// --------------------------------------------------------------------------

const CANTON_NAMES: Record<string, string> = {
  AG: "Aargau", AI: "Appenzell Innerrhoden", AR: "Appenzell Ausserrhoden", BE: "Bern", BL: "Basel-Landschaft", BS: "Basel-Stadt", FR: "Freiburg", GE: "Genf", GL: "Glarus", GR: "Graubünden", JU: "Jura", LU: "Luzern", NE: "Neuenburg", NW: "Nidwalden", OW: "Obwalden", SG: "St. Gallen", SH: "Schaffhausen", SO: "Solothurn", SZ: "Schwyz", TG: "Thurgau", TI: "Tessin", UR: "Uri", VD: "Waadt", VS: "Wallis", ZG: "Zug", ZH: "Zürich"
};

const PROGRAM_LEVELS: [string[], string][] = [
  [["bachelor"], "Bachelor"],
  [["master"], "Master"],
  [["cas", "das", "mas", "emba"], "Weiterbildung (CAS, DAS, MAS, EMBA)"],
  [["other", "phd"], "Weitere Angebote"]
];

function programsSection(programs: Row[]): string {
  const active = programs.filter(p => p.is_active !== false && safeUrl(p.official_url));
  if (!active.length) return "";
  const byTitle = (a: Row, b: Row) => String(a.title).localeCompare(String(b.title), "de");
  const item = (p: Row) => {
    const meta = [txt(p.field_de), txt(p.duration_text), p.ects ? `${p.ects} ECTS` : "", txt(p.teaching_languages) ? `Sprache: ${txt(p.teaching_languages)}` : ""].filter(Boolean).join(" · ");
    return `<li><a href="${esc(safeUrl(p.official_url)!)}" rel="noopener">${esc(String(p.title))}</a>${meta ? ` <span>${esc(meta)}</span>` : ""}</li>`;
  };
  let out = "";
  for (const [levels, label] of PROGRAM_LEVELS) {
    const list = active.filter(p => levels.includes(String(p.level))).sort(byTitle);
    if (list.length) out += `<h3>${esc(label)} <small>(${list.length})</small></h3><ul class="cols">${list.map(item).join("")}</ul>`;
  }
  const overview = active.find(p => p.level === "weiterbildung_overview");
  if (overview) out += `<p class="more"><a href="${esc(safeUrl(overview.official_url)!)}" rel="noopener">Alle Weiterbildungsangebote auf der Website der Hochschule</a></p>`;
  if (!out) return "";
  return `<section class="card" id="studienangebot"><h2>Studienangebot</h2>${out}<p class="more">Die Weiterbildungen sind eine Auswahl. Das vollständige und aktuelle Angebot steht auf der Website der Hochschule.</p></section>`;
}

function renderInstitution(i: Row, slug: string, professions: Link[], programs: Row[] = [], langs: PLang[] = []): { html: string; indexable: boolean; lastmod?: string } {
  const title = txt(i.title_de) || txt(i.name) || slug;
  const url = `${SITE}/institution/${slug}/`;
  const abbreviation = txt(i.abbreviation);
  const aliases = (txt(i.search_aliases) ?? "").split(";").map(a => a.trim()).filter(Boolean);
  const hasAbbr = !!abbreviation && !title.split(/[^A-Za-z]+/).includes(abbreviation);
  // the short name people search for goes into the browser title: "Berufsfachschule Oberwallis (BFO)"
  const titleWithAbbr = hasAbbr ? `${title} (${abbreviation})` : title;

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
  if (abbreviation) facts.push(["Kurzname", [abbreviation, ...aliases.filter(a => a.toLowerCase() !== abbreviation.toLowerCase())].join(", ")]);
  if (typeLabel) facts.push(["Art", typeLabel]);
  if (city || canton) facts.push(["Standort", [city, cantonName ?? canton].filter(Boolean).join(", ")]);
  if (address) facts.push(["Adresse", address]);
  if (professions.length) facts.push(["Berufe in Inspirella", String(professions.length)]);

  const ld: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: title,
      ...(abbreviation || aliases.length ? { alternateName: [...(abbreviation ? [abbreviation] : []), ...aliases] } : {}),
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
    ${langs.length ? `<p class="more" style="margin-top:10px">${langs.map(l => `<a href="/${l}/institution/${slug}/" hreflang="${l}" lang="${l}">${l === "uk" ? "Українською" : "In English"}</a>`).join(" · ")}</p>` : ""}
  </header>
  ${factsHtml(facts)}
  <div class="grid">
    <div>
      ${dlSection("Über diese Schule", detail)}
      ${programsSection(programs)}
    </div>
    <aside>
      ${linkListSection("Berufe und Programme", professions, 200, n => `und ${n} weitere`)}
    </aside>
  </div>
  <div class="source">Quelle &amp; Orientierung: Inspirella ist ein Orientierungswerkzeug. Verbindliche Informationen (Zulassung, Fristen, Kosten) findest du auf der ${
    website ? `<a href="${esc(website)}" rel="noopener">offiziellen Website der Schule</a>` : "offiziellen Website der Schule"
  } und beim kantonalen Berufsinformationszentrum (BIZ). Zuletzt geprüft: ${esc(verified || "siehe Methodik")}. <a href="/methodik/">So arbeiten wir</a>.</div>`;

  return {
    html: layout({ docTitle: fitTitle(titleWithAbbr, ["Ausbildungen", "Zulassung"]), ogTitle: `${titleWithAbbr} | Inspirella`, description, url, indexable, ld, main, ...(langs.length ? { alternates: [{ lang: "de", href: url }, ...langs.map(l => ({ lang: l, href: `${SITE}/${l}/institution/${slug}/` })), { lang: "x-default", href: url }] } : {}) }),
    indexable,
    lastmod: isoDate(i.updated_at)
  };
}

// --------------------------------------------------------------------------
// School page in Ukrainian and English (/uk/institution/<slug>/, /en/institution/<slug>/)
// --------------------------------------------------------------------------

function instLangReady(i: Row, lang: PLang): boolean {
  return !!(txt(i[`short_description_${lang}`]) || txt(i[`summary_${lang}`]) || txt(i[`overview_${lang}`]) || txt(i[`description_${lang}`]));
}

const IL = {
  uk: {
    schools: "Школи",
    types: { federal_institute_of_technology: "Федеральна технічна вища школа", teacher_education: "Педагогічний університет", university: "Університет", university_of_applied_sciences: "Університет прикладних наук", fachmittelschule: "Фахова середня школа (FMS)", gymnasium: "Гімназія", international_school: "Міжнародна школа", private_school: "Приватна школа", continuing_education_center: "Центр подальшого навчання", vocational_school: "Професійна школа" } as Record<string, string>,
    school: "Школа",
    canton: (c: string) => `кантон ${c}`,
    overview: "Огляд",
    profile: "Кому підходить ця школа?",
    admission: "Вступ",
    application: "Подання заяви",
    language: "Мова навчання",
    life: "Навчання і життя",
    intl: "Іноземним студентам",
    housing: "Житло",
    shortName: "Коротка назва",
    kind: "Тип",
    location: "Місце",
    address: "Адреса",
    profCount: "Професій в Inspirella",
    about: "Про школу",
    progs: "Професії та програми",
    more: (n: number) => `і ще ${n}`,
    map: "Подивитися на мапі →",
    site: "Офіційний сайт",
    studies: (n: number) => `Програми навчання (${n}) є на німецькій сторінці школи.`,
    deVersion: "Сторінка німецькою",
    descCount: (n: number) => `${n} професій і програм в Inspirella.`,
    titleParts: ["навчання", "вступ"],
    source: (site: string, date: string) => `Джерело та орієнтир: Inspirella допомагає зорієнтуватися. Офіційну інформацію (вступ, терміни, вартість) шукайте на ${site} та в кантональному центрі профорієнтації (BIZ). Перевірено: ${date}. <a href="/methodik/">Як ми працюємо</a> (нім.).`,
    siteLink: (u: string) => `<a href="${u}" rel="noopener">офіційному сайті школи</a>`,
    siteNone: "офіційному сайті школи",
    seeMethod: "див. методику"
  },
  en: {
    schools: "Schools",
    types: { federal_institute_of_technology: "Federal institute of technology", teacher_education: "University of teacher education", university: "University", university_of_applied_sciences: "University of applied sciences", fachmittelschule: "Upper-secondary specialised school (FMS)", gymnasium: "Gymnasium", international_school: "International school", private_school: "Private school", continuing_education_center: "Continuing education centre", vocational_school: "Vocational school" } as Record<string, string>,
    school: "School",
    canton: (c: string) => `canton of ${c}`,
    overview: "Overview",
    profile: "Who is this school for?",
    admission: "Admission",
    application: "Applying",
    language: "Language of instruction",
    life: "Student life",
    intl: "International students",
    housing: "Housing",
    shortName: "Short name",
    kind: "Type",
    location: "Location",
    address: "Address",
    profCount: "Careers in Inspirella",
    about: "About this school",
    progs: "Careers and programmes",
    more: (n: number) => `and ${n} more`,
    map: "Explore on the map →",
    site: "Official website",
    studies: (n: number) => `The ${n} study programmes are listed on the German page of this school.`,
    deVersion: "German version",
    descCount: (n: number) => `${n} careers and programmes in Inspirella.`,
    titleParts: ["programmes", "admission"],
    source: (site: string, date: string) => `Source and orientation: Inspirella is an orientation tool. For binding information (admission, deadlines, fees) see the ${site} and your cantonal career guidance centre (BIZ). Last checked: ${date}. <a href="/methodik/">How we work</a> (German).`,
    siteLink: (u: string) => `<a href="${u}" rel="noopener">school's official website</a>`,
    siteNone: "school's official website",
    seeMethod: "see methodology"
  }
};

function renderInstitutionL(lang: PLang, i: Row, slug: string, professions: Link[], programCount: number, langs: PLang[]): { html: string; indexable: boolean } {
  const L = IL[lang];
  const f = (base: string) => txt(i[`${base}_${lang}`]);
  const title = txt(i.title_de) || txt(i.name) || slug; // school names stay in their original language
  const url = `${SITE}/${lang}/institution/${slug}/`;
  const abbreviation = txt(i.abbreviation);
  const aliases = (txt(i.search_aliases) ?? "").split(";").map(a => a.trim()).filter(Boolean);
  const hasAbbr = !!abbreviation && !title.split(/[^A-Za-z]+/).includes(abbreviation);
  const titleWithAbbr = hasAbbr ? `${title} (${abbreviation})` : title;

  const short = f("short_description") || f("summary") || f("overview") || f("description");
  const overview = f("overview") || f("description");
  const detail = ([
    [L.overview, overview && overview !== short ? overview : undefined],
    [L.profile, f("institution_profile")],
    [L.admission, f("admissions_summary")],
    [L.application, f("application_notes")],
    [L.language, f("language_environment")],
    [L.life, f("student_life")],
    [L.intl, f("international_support")],
    [L.housing, f("housing_notes")]
  ] as [string, string | undefined][]).filter((s): s is [string, string] => !!s[1]);
  const indexable = [short, ...detail.map(d => d[1])].filter(Boolean).join(" ").length >= MIN_INDEXABLE_CHARS;

  const typeLabel = L.types[i.institution_subgroup as string];
  const city = txt(i.city);
  const canton = txt(i.canton)?.toUpperCase();
  const cantonName = canton ? CANTON_NAMES[canton] : undefined;
  const address = txt(i.formatted_address)?.replace(/,\s*Switzerland$/i, "");
  const website = safeUrl(i.official_homepage_url) || safeUrl(i.website_url);
  const verified = isoDate(i.last_verified_at);

  const where = [city, cantonName ? L.canton(cantonName) : canton].filter(Boolean).join(", ");
  const lead = `${typeLabel || L.school}${where ? `, ${where}` : ""}.`;
  const description = truncate([lead, professions.length ? L.descCount(professions.length) : "", short ? truncate(short, 100) : ""].filter(Boolean).join(" "), 158);

  const facts: [string, string][] = [];
  if (abbreviation) facts.push([L.shortName, [abbreviation, ...aliases.filter(a => a.toLowerCase() !== abbreviation.toLowerCase())].join(", ")]);
  if (typeLabel) facts.push([L.kind, typeLabel]);
  if (city || canton) facts.push([L.location, [city, cantonName ?? canton].filter(Boolean).join(", ")]);
  if (address) facts.push([L.address, address]);
  if (professions.length) facts.push([L.profCount, String(professions.length)]);

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: title,
      ...(abbreviation || aliases.length ? { alternateName: [...(abbreviation ? [abbreviation] : []), ...aliases] } : {}),
      description,
      url: website || url,
      ...(website ? { sameAs: [website] } : {}),
      address: { "@type": "PostalAddress", ...(city ? { addressLocality: city } : {}), ...(canton ? { addressRegion: canton } : {}), addressCountry: "CH" }
    }
  ];
  const others = langs.filter(l => l !== lang);
  const langLinks = [`<a href="/institution/${slug}/" hreflang="de" lang="de">${esc(L.deVersion)}</a>`, ...others.map(l => `<a href="/${l}/institution/${slug}/" hreflang="${l}" lang="${l}">${l === "uk" ? "Українською" : "In English"}</a>`)].join(" · ");

  const main = `  <div class="crumbs"><a href="/">Inspirella</a> › <a href="/schulen/">${esc(L.schools)}</a> › ${esc(title)}</div>
  <header class="hero">
    <div class="badges">${typeLabel ? `<span class="badge">${esc(typeLabel)}</span>` : ""}${cantonName ? `<span class="badge warm">${esc(L.canton(cantonName))}</span>` : ""}</div>
    <h1>${esc(title)}</h1>
    ${short ? `<p class="lead">${esc(short)}</p>` : ""}
    <div class="cta-row"><a class="btn btn-primary" href="/karte/?lang=${lang}">${esc(L.map)}</a>${website ? `<a class="btn btn-sec" href="${esc(website)}" rel="noopener">${esc(L.site)}</a>` : ""}</div>
    <p class="more" style="margin-top:10px">${langLinks}</p>
  </header>
  ${factsHtml(facts)}
  <div class="grid">
    <div>
      ${dlSection(L.about, detail)}
      ${programCount ? `<p class="more"><a href="/institution/${slug}/#studienangebot" lang="de">${esc(L.studies(programCount))}</a></p>` : ""}
    </div>
    <aside>
      ${linkListSection(L.progs, professions, 200, L.more)}
    </aside>
  </div>
  <div class="source">${L.source(website ? L.siteLink(esc(website)) : L.siteNone, esc(verified || L.seeMethod))}</div>`;

  const alternates = [{ lang: "de", href: `${SITE}/institution/${slug}/` }, ...langs.map(l => ({ lang: l, href: `${SITE}/${l}/institution/${slug}/` })), { lang: "x-default", href: `${SITE}/institution/${slug}/` }];
  return {
    html: layout({ docTitle: fitTitle(titleWithAbbr, L.titleParts), ogTitle: `${titleWithAbbr} | Inspirella`, description, url, indexable, ld, main, lang, alternates, nav: PL[lang].nav }),
    indexable
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

function renderHub(opts: { path: string; title: string; h1: string; lead: string; crumbs: [string, string?][]; body: string; description: string; ld?: object; lang?: string; alternates?: { lang: string; href: string }[]; nav?: { about: string; app: string } }): string {
  const url = SITE + opts.path;
  return layout({
    docTitle: truncate(opts.title, 60),
    ogTitle: opts.h1,
    description: truncate(opts.description, 158),
    url,
    indexable: true,
    ld: opts.ld ?? { "@context": "https://schema.org", "@type": "CollectionPage", name: opts.h1, url },
    lang: opts.lang,
    alternates: opts.alternates,
    nav: opts.nav,
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
    ["Löhne richtig lesen", "Der Lehrlingslohn ist eine Empfehlung der Berufsverbände; Region und Lehrbetrieb bestimmen den tatsächlichen Lohn. Der Lohn im Beruf ist der Median (mittlerer Wert) einer ganzen Berufsgruppe, nicht eines einzelnen Berufs, brutto und auf Vollzeit umgerechnet. Die Zuordnung eines Berufs zu einer Berufsgruppe ist mit «ungefähr» gekennzeichnet, wenn sie nicht eindeutig ist. Zusätzlich zeigen wir den Median je Grossregion (Zürich, Nordwestschweiz, Espace Mittelland, Genferseeregion, Zentralschweiz, Ostschweiz, Tessin); auch das sind Zahlen der Berufsgruppe, nicht des einzelnen Berufs. Für einzelne Kantone gibt das BFS keine Löhne an."],
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
      logo: `${SITE}/swift-mark-512.png`,
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
    ctaNote: "В інтерактивній Swiss Path Map ви обираєте свій кантон і бачите шляхи та умови саме для нього.",
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
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Правила різняться залежно від кантону й школи. Обов’язкову інформацію шукайте на berufsberatung.ch, у SBFI, EDK, swissuniversities і в кантональному центрі профорієнтації (BIZ). Тексти взято з офіційних німецькомовних джерел і перекладено.",
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
    hubLead: "Ви приїхали до Швейцарії зі статусом захисту S (Україна) або допомагаєте комусь? Тут написано, з чого почати, і для кожного кантону, куди звертатися: школа, курси німецької, професійне навчання та контакти. Кожен пункт веде на офіційну сторінку.",
    hubDescription: "Статус захисту S у Швейцарії: запис до школи, курси німецької, професійне навчання (Lehre) і дипломи. Контакти та шляхи в кожному кантоні, з офіційними джерелами.",
    crumb: "Статус S",
    nationalTitle: "Найважливіше для всієї Швейцарії",
    cantonsTitle: "Оберіть свій кантон",
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
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Правила, строки й контакти змінюються: завжди перевіряйте офіційну сторінку. Тексти взято з офіційних німецькомовних джерел і перекладено.",
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
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Строки подання, вимоги й пропозиції змінюються: завжди перевіряйте офіційну сторінку. Обов’язкову інформацію дає кантональний центр профорієнтації (BIZ). Тексти взято з офіційних німецькомовних джерел і перекладено.",
    crumb: "Перехідні програми",
    bridgeHubTitles: ["Перехідні програми у Швейцарії за кантонами", "Перехідні програми за кантонами"],
    bridgeHubH1: "Перехідні програми у Швейцарії: огляд за кантонами",
    bridgeHubDescription: "Перехідні програми після обов’язкової школи: Vorlehre, підготовчий рік, Integrationsvorlehre і мотиваційний семестр у кожному кантоні, з умовами вступу та джерелами.",
    bridgeCantonsTitle: "Оберіть свій кантон",
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
    disclaimer: "Inspirella — інструмент для орієнтації, а не офіційна установа. Строки, оцінки й умови змінюються щороку: завжди перевіряйте офіційну сторінку. Обов’язкову інформацію дає школа або кантональний центр профорієнтації (BIZ). Тексти взято з офіційних німецькомовних джерел і перекладено.",
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
  <h2 style="margin-top:34px">${esc(lang === "de" ? "Wähle deinen Kanton" : "Оберіть свій кантон")}</h2>
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

// --------------------------------------------------------------------------
// Ukrainian start page (/uk/): the page to share with Ukrainian-speaking newcomers. Only links and short pointers to
// pages that already hold verified information; it states no rules of its own.
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Ukrainian language page (/uk/mova/): levels, what each level opens, certificates, courses in every canton.
// Built only from verified rows: the "language" stage, the newcomer facts of that stage and the Status S
// language-course facts per canton.
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// "Чи допомогло?" block under the Ukrainian planners: anonymous, stored in page_feedback (insert-only for the public).
// --------------------------------------------------------------------------

let FEEDBACK_REST = "";
let FEEDBACK_KEY = "";

function feedbackBlock(page: string): string {
  if (!FEEDBACK_REST || !FEEDBACK_KEY) return "";
  return `<section class="card prose fb" id="fb" style="margin-top:28px" data-page="${esc(page)}" data-endpoint="${esc(FEEDBACK_REST)}" data-key="${esc(FEEDBACK_KEY)}">
    <h2>Чи допомогла вам ця сторінка?</h2>
    <div class="cta-row" style="margin:6px 0 10px"><button type="button" class="btn btn-sec" data-v="yes">👍 Так</button><button type="button" class="btn btn-sec" data-v="no">👎 Не дуже</button></div>
    <label for="fb-text" style="display:block;font-weight:600;margin-top:4px">Чого вам бракує? Що було незрозуміло?</label>
    <textarea id="fb-text" maxlength="600" rows="3" style="width:100%;margin-top:6px;padding:10px;border-radius:12px;border:1px solid var(--card-b);background:var(--card);color:var(--fg);font:15px Inter,sans-serif" placeholder="Наприклад: не знайшла курси для дитини 16 років"></textarea>
    <div class="cta-row" style="margin-top:10px"><button type="button" class="btn btn-primary" data-send>Надіслати</button></div>
    <p class="more" data-msg>Анонімно: ми не збираємо імен чи контактів, тому не пишіть сюди особисті дані.</p>
  </section>
  <script>${FEEDBACK_SCRIPT}</script>`;
}

const FEEDBACK_SCRIPT = `(function(){
var b=document.getElementById("fb");if(!b)return;var v=null,sent=false;
function send(){if(sent)return;var t=(document.getElementById("fb-text").value||"").trim().slice(0,600);if(v===null&&!t)return;sent=true;
fetch(b.dataset.endpoint,{method:"POST",headers:{"Content-Type":"application/json",apikey:b.dataset.key,Authorization:"Bearer "+b.dataset.key,Prefer:"return=minimal"},body:JSON.stringify({page:b.dataset.page,lang:"uk",helpful:v,missing:t||null,context:(location.hash||"").slice(0,200)||null})})
.then(function(r){b.querySelector("[data-msg]").textContent=r.ok?"Дякуємо! Ваша відповідь допоможе зробити Inspirella кориснішою.":"Не вдалося надіслати. Спробуйте пізніше або напишіть на iinspirella@gmail.com.";if(!r.ok)sent=false;})
.catch(function(){sent=false;b.querySelector("[data-msg]").textContent="Не вдалося надіслати. Спробуйте пізніше.";});}
b.querySelectorAll("[data-v]").forEach(function(x){x.addEventListener("click",function(){v=x.dataset.v==="yes";b.querySelectorAll("[data-v]").forEach(function(y){y.style.borderColor=y===x?"var(--accent)":"";});b.querySelector("[data-msg]").textContent=v?"Дякуємо! Якщо хочете, напишіть, чого ще бракує, і натисніть «Надіслати».":"Напишіть, будь ласка, чого бракує, і натисніть «Надіслати».";});});
b.querySelector("[data-send]").addEventListener("click",send);
})();`;

// --------------------------------------------------------------------------
// Ukrainian page "Статус S, дозвіл B і C" (/uk/zalyshytysia/): what status S allows, its latest changes, and the
// steps to stay (S -> B -> C -> citizenship). Only verified Status S facts with the status topics; canton news below.
// --------------------------------------------------------------------------

const STAY_TOPICS: { topic: string; title: string }[] = [
  { topic: "status_news", title: "Останні рішення та зміни" },
  { topic: "status_rights", title: "Що дає статус S" },
  { topic: "status_duration", title: "Скільки діє статус S" },
  { topic: "status_to_b", title: "Дозвіл на проживання B" },
  { topic: "status_to_c", title: "Дозвіл на постійне проживання C" },
  { topic: "naturalisation", title: "Громадянство" },
  { topic: "status_return", title: "Повернення в Україну" }
];

function renderUkStay(national: Row[], cantonal: Row[], today: string): string {
  const url = SITE + "/uk/zalyshytysia/";
  const names = CANTON_NAMES_I18N.uk;
  const card = (r: Row) => {
    const href = safeUrl(r.official_url) ?? safeUrl(r.evidence_url);
    return `<section class="card prose"><h3>${esc(txt(r.headline_uk)!)}</h3><p>${esc(txt(r.text_uk)!)}</p>${href ? `<p class="more"><a href="${esc(href)}" rel="noopener">Офіційне джерело →</a></p>` : ""}</section>`;
  };
  const ok = (r: Row) => !!txt(r.headline_uk) && !!txt(r.text_uk);
  const sections = STAY_TOPICS.map(t => {
    const rows = national.filter(r => r.topic === t.topic && ok(r));
    return rows.length ? `<h2 id="${t.topic}" style="margin-top:34px">${esc(t.title)}</h2>\n  ${rows.map(card).join("\n  ")}` : "";
  }).filter(Boolean);
  const toc = STAY_TOPICS.filter(t => national.some(r => r.topic === t.topic && ok(r))).map(t => `<a href="#${t.topic}">${esc(t.title)}</a>`).join(" · ");

  const byCanton = new Map<string, Row[]>();
  for (const r of cantonal.filter(ok)) {
    const c = String(r.canton_code).toUpperCase();
    if (!names[c]) continue;
    byCanton.set(c, [...(byCanton.get(c) ?? []), r]);
  }
  const cantonHtml = [...byCanton.entries()]
    .sort((a, b) => names[a[0]].localeCompare(names[b[0]], "uk"))
    .map(([c, rows]) => `<details class="qa" id="kanton-${esc(c.toLowerCase())}"><summary>Кантон ${esc(names[c])}</summary>${rows.map(r => {
      const href = safeUrl(r.official_url) ?? safeUrl(r.evidence_url);
      return `<p><strong>${esc(txt(r.headline_uk)!)}</strong></p><p>${esc(txt(r.text_uk)!)}</p>${href ? `<p class="more"><a href="${esc(href)}" rel="noopener">Офіційна сторінка кантону →</a></p>` : ""}`;
    }).join("")}<p class="more"><a href="/uk/status-s/${esc(c.toLowerCase())}/">Школа, мова й контакти в кантоні ${esc(names[c])} →</a></p></details>`)
    .join("");

  const ladder = [
    ["S", "Статус захисту S", "тимчасовий захист"],
    ["B", "Дозвіл B", "проживання"],
    ["C", "Дозвіл C", "постійне проживання"],
    ["CH", "Громадянство", "натуралізація"]
  ];
  const ladderHtml = `<div class="ladder">${ladder.map(([k, t, d], i) => `<a class="rung" href="#${["status_rights", "status_to_b", "status_to_c", "naturalisation"][i]}"><b>${esc(k)}</b><span>${esc(t)}</span><small>${esc(d)}</small></a>`).join('<span class="arrow">→</span>')}</div>`;

  const description = "Статус S у Швейцарії: що він дає, скільки діє, останні рішення, як отримати дозвіл B, потім C і громадянство. Українською, з офіційними джерелами SEM і кантонів, з датами.";
  const css = `.ladder{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 4px}.rung{display:flex;flex-direction:column;min-width:120px;padding:12px 14px;border-radius:14px;border:1px solid var(--card-b);background:var(--card);text-decoration:none}.rung b{font:700 22px "Space Grotesk",sans-serif;color:var(--accent)}.rung small{color:var(--muted)}.arrow{color:var(--muted);font-size:20px}h3{margin-top:0}`;

  const main = `  <style>${css}</style>
  <div class="crumbs"><a href="/uk/">Inspirella</a> › <a href="/uk/status-s/">Статус S</a> › Як залишитися</div>
  <header class="hero">
    <div class="badges"><span class="badge">Статус S</span><span class="badge warm">Станом на ${esc(statusDate("uk", today))}</span></div>
    <h1>Статус S, дозвіл B і C: як залишитися у Швейцарії</h1>
    <p class="lead">Що дає статус захисту S, що змінилося останнім часом і які кроки ведуть до дозволу B, дозволу C та громадянства. Коротко, з датами й посиланнями на офіційні джерела.</p>
    ${ladderHtml}
  </header>
  ${toc ? `<p class="more">${toc}${byCanton.size ? ` · <a href="#kantony">Новини кантонів</a>` : ""}</p>` : ""}
  ${sections.join("\n  ")}
  ${byCanton.size ? `<h2 id="kantony" style="margin-top:34px">Що роблять кантони</h2><section class="card prose">${cantonHtml}</section>` : ""}
  <div class="note">Правила щодо статусу S змінюються. Остаточне рішення про ваш дозвіл ухвалює міграційний орган вашого кантону; перевіряйте актуальні дані за посиланнями й зверніться туди з особистими питаннями.</div>
  ${feedbackBlock("uk-stay")}
  <section class="card prose" style="margin-top:22px"><p>Далі: <a href="/uk/mova/">мовний план</a> (для дозволів потрібен рівень мови) · <a href="/uk/diplom-dlia-doroslykh/">професія для дорослих</a> · <a href="/uk/dity/">шкільний план для дитини</a> · <a href="/uk/status-s/">статус S за кантонами</a></p></section>
  <div class="source">Inspirella — незалежний інструмент для орієнтації, а не офіційна установа і не юридична консультація. Тексти взято з офіційних джерел (SEM, Федеральна рада, fedlex, кантони) і перекладено, з датою кожного рішення. Помітили помилку? Напишіть на <a href="mailto:iinspirella@gmail.com">iinspirella@gmail.com</a>.</div>
  <script>(function(){function o(){var d=location.hash&&document.getElementById(location.hash.slice(1));if(d&&d.tagName==="DETAILS"){d.open=true;d.scrollIntoView();}}window.addEventListener("hashchange",o);o();})();</script>`;

  return layout({
    docTitle: "Статус S, дозвіл B і C: як залишитися у Швейцарії | Inspirella",
    ogTitle: "Статус S, дозвіл B і C: як залишитися у Швейцарії",
    description,
    url,
    indexable: true,
    lang: "uk",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" },
    ld: { "@context": "https://schema.org", "@type": "WebPage", name: "Статус S, дозвіл B і C: як залишитися у Швейцарії", url, inLanguage: "uk", description, dateModified: today, isPartOf: { "@type": "WebSite", name: "Inspirella", url: SITE + "/" } },
    main
  });
}

function renderUkLanguage(node: Row | undefined, facts: Row[], cantonFacts: Row[], today: string): string {
  const url = SITE + "/uk/mova/";
  const names = CANTON_NAMES_I18N.uk;
  const fact = (topic: string) => facts.find(r => r.topic === topic && txt(r.headline_uk) && txt(r.text_uk));
  const src = (r?: Row) => (r ? safeUrl(r.official_url) ?? safeUrl(r.evidence_url) : undefined);

  // the canton cards of the planner (verified Status S language-course facts)
  const cantons = [...cantonFacts]
    .filter(r => txt(r.headline_uk) && txt(r.text_uk) && names[String(r.canton_code).toUpperCase()])
    .map(r => ({ code: String(r.canton_code).toUpperCase(), name: names[String(r.canton_code).toUpperCase()], head: txt(r.headline_uk)!, text: txt(r.text_uk)!, url: src(r) ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));

  // levels: the same wording as the verified levels fact (CEFR global scale, fide)
  const levels = [
    { id: 0, code: "0", label: "Я ще майже не знаю мови" },
    { id: 1, code: "A1", label: "Можу представитися простими реченнями й сказати, що мені потрібно, якщо говорять повільно" },
    { id: 2, code: "A2", label: "Порозуміюся в простих ситуаціях: магазин, лікар, установа" },
    { id: 3, code: "B1", label: "Впораюся з більшістю повсякденних ситуацій і розумію листи від школи, роботодавця чи органів влади" },
    { id: 4, code: "B2", label: "Розумію основний зміст складних текстів і фахові розмови у своїй галузі" },
    { id: 5, code: "C1", label: "Розумію складні довгі тексти, навіть те, що сказано не прямо" }
  ];

  const reqLehre = fact("language_requirements") && facts.filter(r => r.topic === "language_requirements")[1];
  const reqPermit = facts.filter(r => r.topic === "language_requirements")[0];
  const certs = fact("language_certificates");
  const courses = fact("language_courses_free");
  const online = fact("language_online");
  const levelFact = fact("language_levels");

  // goals: required level only where a verified fact states it
  const goals = [
    { id: "lehre", label: "Професійне навчання (Lehre)", need: 3, needText: "щонайменше B1, для деяких професій B2", node: "efz", step: "Запишіться на консультацію в центр профорієнтації вашого кантону (BIZ): там допоможуть обрати професію й підготуватися до пошуку місця для навчання.", stepUrl: "https://www.berufsberatung.ch/de/eine-berufslehre-in-der-schweiz-absolvieren", source: src(reqLehre) },
    { id: "adult", label: "Диплом з професії для дорослих (без звичайного Lehre)", need: 4, needText: "щонайменше B2 для прямого допуску до випускного іспиту", node: "adult", step: "Перевірте, чи підходить вам прямий допуск до іспиту або валідація досвіду: усі шляхи для дорослих зібрані на окремій сторінці.", stepUrl: "/uk/diplom-dlia-doroslykh/", source: src(reqLehre) },
    { id: "uni", label: "Навчання в університеті чи FH", need: 4, needText: "від B2 до C1 залежно від вишу (наприклад, Університет Цюриха — C1)", node: "uni", step: "Напишіть у приймальну службу обраного вишу: вона скаже, який сертифікат потрібен і чи визнають ваш атестат чи диплом.", stepUrl: "https://www.swissuniversities.ch/themen/zulassung", source: src(reqLehre) },
    { id: "permit", label: "Дозвіл на постійне проживання (C)", need: 2, needText: "A2 усно й A1 письмово", node: "", step: "Сертифікат для дозволу перевіряє міграційний орган кантону або громади: уточніть у них, який документ подати.", stepUrl: src(reqPermit) ?? "", source: src(reqPermit) },
    { id: "citizen", label: "Громадянство", need: 3, needText: "B1 усно й A2 письмово", node: "", step: "Вимоги до натуралізації перевіряє громада й кантон; почніть із їхньої сторінки про громадянство.", stepUrl: src(reqPermit) ?? "", source: src(reqPermit) },
    { id: "work", label: "Робота", need: -1, needText: "єдиної вимоги немає: рівень залежить від посади й роботодавця", node: "work", step: "Зареєструйтеся в регіональному центрі працевлаштування (RAV) і покажіть роботодавцям визнаний мовний сертифікат.", stepUrl: "https://www.sem.admin.ch/sem/de/home/integration-einbuergerung/mein-beitrag/zugewandert/sprache.html", source: "https://www.sem.admin.ch/sem/de/home/integration-einbuergerung/mein-beitrag/zugewandert/sprache.html" }
  ];

  const data = {
    cantons,
    goals,
    levels: levels.map(l => ({ id: l.id, code: l.code })),
    fideUrl: "https://fide-service.ch/de/sprachnachweise/fide-test",
    certUrl: src(certs) ?? ""
  };

  const levelOptions = levels
    .map(l => `<label class="opt"><input type="radio" name="lvl" value="${l.id}"><span><b>${esc(l.code === "0" ? "—" : l.code)}</b> ${esc(l.label)}</span></label>`)
    .join("");
  const goalOptions = goals.map(g => `<label class="opt"><input type="radio" name="goal" value="${esc(g.id)}"><span>${esc(g.label)}</span></label>`).join("");
  const cantonOptions = cantons.map(c => `<option value="${esc(c.code)}">${esc(c.name)}</option>`).join("");

  const needRows = goals
    .map(g => `<tr><td>${esc(g.label)}</td><td>${esc(g.needText)}</td></tr>`)
    .join("");

  const description = "Мовний план за 2 хвилини: ваш рівень, що він вам відкриває, скільки ще потрібно для Lehre, вишу, дозволу C чи громадянства, і курси у вашому кантоні. Для українців і всіх новоприбулих у Швейцарії.";

  const css = `
  .planner{display:grid;gap:16px}
  .step{padding:20px 22px}
  .step h2{margin-bottom:6px}
  .step .hint{color:var(--muted);font-size:14px;margin:0 0 12px}
  .opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--card-b);border-radius:12px;margin-top:8px;cursor:pointer;background:rgba(139,92,246,.05)}
  .opt:has(input:checked){border-color:var(--accent);background:rgba(139,92,246,.16)}
  .opt input{margin-top:4px;accent-color:#8b5cf6}
  .opt b{display:inline-block;min-width:28px;color:var(--accent)}
  select.pick{width:100%;padding:12px;border-radius:12px;border:1px solid var(--card-b);background:var(--card);color:var(--fg);font:500 16px Inter,sans-serif}
  .result{padding:22px;border:1px solid var(--accent)}
  .bar{display:flex;gap:4px;margin:12px 0 6px}
  .bar span{flex:1;text-align:center;font:600 12px Inter,sans-serif;padding:6px 0;border-radius:8px;background:rgba(139,92,246,.08);color:var(--muted)}
  .bar span.have{background:rgba(139,92,246,.45);color:#fff}
  .bar span.need{outline:2px solid #fb923c;outline-offset:-2px;color:var(--fg)}
  ol.plan{padding-left:20px;margin:12px 0 0}ol.plan li{margin-bottom:10px}
  ol.plan a{color:var(--accent)}
  table.need{width:100%;border-collapse:collapse;font-size:15px}table.need td{border-bottom:1px solid var(--card-b);padding:9px 8px;vertical-align:top}table.need td:first-child{font-weight:600;width:48%}
  .founder{display:flex;gap:14px;align-items:flex-start;padding:18px 20px;font-size:15px}
  .founder img{width:40px;height:40px;flex:none}
  .founder p{margin:0 0 8px;color:var(--muted)}.founder p:last-child{margin:0}
  `;

  const main = `  <style>${css}</style>
  <div class="crumbs"><a href="/uk/">Inspirella</a> › Мова</div>
  <header class="hero">
    <div class="badges"><span class="badge">Мовний план</span><span class="badge warm">2 хвилини · без реєстрації</span></div>
    <h1>Ваш мовний план у Швейцарії</h1>
    <p class="lead">Оберіть кантон, свій рівень і мету: ви побачите, скільки ще потрібно, що робити далі й де шукати курси саме у вашому кантоні.</p>
  </header>
  <div class="planner" id="planner">
    <section class="card step"><h2>1. Ваш кантон</h2><p class="hint">Покажемо, як працюють курси саме там.</p>
      <select class="pick" id="canton"><option value="">Оберіть кантон</option>${cantonOptions}</select></section>
    <section class="card step"><h2>2. Що з цього про вас?</h2><p class="hint">Оберіть найвищий пункт, з яким ви погоджуєтеся. Це орієнтир за шкалою рівнів (GER/CEFR), а не тест.</p>${levelOptions}</section>
    <section class="card step"><h2>3. Ваша мета</h2><p class="hint">Для чого вам мова насамперед?</p>${goalOptions}</section>
    <section class="card result" id="result" hidden aria-live="polite"></section>
  </div>
  <noscript><p class="note">Для мовного плану потрібен JavaScript. Нижче — вся інформація у звичайному вигляді.</p></noscript>

  <h2 style="margin-top:40px">Який рівень потрібен для чого</h2>
  <section class="card"><table class="need">${needRows}</table>
    <p class="more">Джерела: ${[src(reqPermit), src(reqLehre)].filter(Boolean).map((h, i) => `<a href="${esc(h!)}" rel="noopener">${i === 0 ? "SEM (дозволи, громадянство)" : "berufsberatung.ch (Lehre, виш)"}</a>`).join(" · ")}</p></section>

  ${levelFact ? `<h2 style="margin-top:34px">Рівні A1–C2 простими словами</h2><section class="card prose"><p>${esc(txt(levelFact.text_uk)!)}</p>${src(levelFact) ? `<p class="more"><a href="${esc(src(levelFact)!)}" rel="noopener">Шкала рівнів fide →</a></p>` : ""}</section>` : ""}
  ${certs ? `<h2 style="margin-top:34px">Сертифікати</h2><section class="card prose"><p>${esc(txt(certs.text_uk)!)}</p>${src(certs) ? `<p class="more"><a href="${esc(src(certs)!)}" rel="noopener">Список визнаних сертифікатів (SEM) →</a></p>` : ""}</section>` : ""}
  ${courses ? `<h2 style="margin-top:34px">Курси</h2><section class="card prose"><p>${esc(txt(courses.text_uk)!)}</p>${src(courses) ? `<p class="more"><a href="${esc(src(courses)!)}" rel="noopener">Офіційне джерело →</a></p>` : ""}</section>` : ""}
  ${online ? `<h2 style="margin-top:34px">Де тренуватися</h2><section class="card prose"><p>${esc(txt(online.text_uk)!)}</p>${src(online) ? `<p class="more"><a href="${esc(src(online)!)}" rel="noopener">Модельні тести fide →</a></p>` : ""}</section>` : ""}

  ${feedbackBlock("uk-mova")}
  <section class="card founder" style="margin-top:34px"><img src="/swift-mark-64.png" alt="" width="40" height="40"><div><p>Inspirella створена Софією, яка сама колись потребувала такої підтримки.</p><p>У 2022 році вона приїхала з Києва до Швейцарії. Спочатку навчалася в класі для українських дітей, а згодом перейшла до швейцарської школи, де не розуміла ні діалекту, ні системи, ні завдань. Сьогодні вона вільно орієнтується в швейцарському середовищі, володіє німецькою на рівні B2 і навчається в гімназії.</p><p>Inspirella — це частково той план, якого їй самій колись бракувало. Вона створює платформу, яка може допомогти іншим українцям, підліткам у Швейцарії краще зрозуміти освітню систему, побачити свої можливості та знайти власний шлях до майбутнього.</p></div></section>

  <section class="card prose" style="margin-top:22px"><p>Далі: <a href="/uk/">з чого почати у Швейцарії</a> · <a href="/uk/status-s/">статус S за кантонами</a> · <a href="/uk/diplom-dlia-doroslykh/">диплом з професії для дорослих</a> · <a href="/uk/systema-osvity-shveitsarii/">система освіти</a></p></section>
  <div class="source">Inspirella — незалежний інструмент для орієнтації, а не офіційна установа. Вимоги й курси взято з офіційних джерел (SEM, fide, berufsberatung.ch, swissuniversities, кантони) і перекладено; вони можуть змінюватися, тому перевіряйте їх за посиланнями. Оцінка рівня — лише орієнтир. Дані станом на ${esc(today)}. Помітили помилку? Напишіть на <a href="mailto:iinspirella@gmail.com">iinspirella@gmail.com</a>.</div>
  <script type="application/json" id="plan-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
  <script>${PLANNER_SCRIPT}</script>`;

  return layout({
    docTitle: "Мовний план у Швейцарії: ваш рівень, мета й курси | Inspirella",
    ogTitle: "Ваш мовний план у Швейцарії за 2 хвилини",
    description,
    url,
    indexable: true,
    lang: "uk",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" },
    ld: { "@context": "https://schema.org", "@type": "WebPage", name: "Ваш мовний план у Швейцарії", url, inLanguage: "uk", description, dateModified: today, isPartOf: { "@type": "WebSite", name: "Inspirella", url: SITE + "/" } },
    main
  });
}

/** The planner's logic: plain script, no framework; renders the result from the embedded data. */
const PLANNER_SCRIPT = `(function(){
var d=JSON.parse(document.getElementById("plan-data").textContent);
var codes=["—","A1","A2","B1","B2","C1"];
var box=document.getElementById("result");
function val(n){var e=document.querySelector('input[name="'+n+'"]:checked');return e?e.value:null;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}
function link(u,t){return u?'<a href="'+esc(u)+'"'+(u.charAt(0)==="/"?"":' rel="noopener" target="_blank"')+'>'+esc(t)+'</a>':esc(t);}
function render(){
  var lvl=val("lvl"),gid=val("goal"),cc=document.getElementById("canton").value;
  if(lvl===null||gid===null){box.hidden=true;return;}
  lvl=+lvl;var g=d.goals.filter(function(x){return x.id===gid;})[0];
  var c=d.cantons.filter(function(x){return x.code===cc;})[0];
  var h='<h2>Ваш план</h2>';
  if(g.need>=0){
    var bar='<div class="bar">';for(var i=1;i<codes.length;i++){bar+='<span class="'+(i<=lvl?"have ":"")+(i===g.need?"need":"")+'">'+codes[i]+'</span>';}bar+='</div>';
    h+=bar;
    h+= lvl>=g.need ? '<p><b>Ваш рівень уже відповідає вимозі</b> ('+esc(g.needText)+'). Наступний крок — офіційний сертифікат.</p>'
      : '<p>Потрібно: <b>'+esc(g.needText)+'</b>. Ви зараз приблизно на рівні <b>'+(lvl===0?"початківця":codes[lvl])+'</b>: до мети '+(g.need-lvl)+' '+((g.need-lvl)===1?"рівень":"рівні")+'.</p>';
  } else {
    h+='<p>'+esc(g.needText)+'.</p>';
  }
  var steps=[];
  if(lvl<5){steps.push(c?'<b>Курс у кантоні '+esc(c.name)+'.</b> '+esc(c.head)+'.<details class="qa"><summary>Докладніше про курси в кантоні</summary><p>'+esc(c.text)+'</p></details>'+link(c.url,"Офіційна сторінка кантону →"):'<b>Курс у вашому кантоні.</b> Оберіть кантон угорі, і тут з’явиться, як записатися.');}
  steps.push(lvl<=3?'<b>Тренуйтеся до тесту.</b> На сайті fide є безкоштовні модельні тести для читання, письма, говоріння й аудіювання. '+link(d.fideUrl,"fide-service.ch →"):'<b>Підтвердіть рівень сертифікатом.</b> Зараховують лише сертифікати зі списку SEM (наприклад Goethe, telc, ÖSD, fide). '+link(d.certUrl,"Список SEM →"));
  if(g.need<0||lvl>=g.need){steps.push('<b>Сертифікат.</b> Довідки про курс недостатньо: потрібен визнаний сертифікат. '+link(d.certUrl,"Список SEM →"));}
  steps.push('<b>'+esc(g.label)+'.</b> '+esc(g.step)+' '+link(g.stepUrl,"Детальніше →"));
  h+='<ol class="plan"><li>'+steps.join('</li><li>')+'</li></ol>';
  var mapUrl='/pathmap/?lang=uk&from=language'+(g.node?'&to='+g.node:'');
  h+='<div class="cta-row" style="margin-top:14px"><a class="btn btn-primary" href="'+mapUrl+'">Зберегти й побачити шлях на мапі →</a></div>';
  h+='<p class="more">Мапа відкривається після короткого старту без реєстрації. '+(g.source?link(g.source,"Джерело вимоги"):"")+'</p>';
  box.innerHTML=h;box.hidden=false;
}
document.getElementById("planner").addEventListener("change",function(e){render();if(e.target.name==="goal"){box.scrollIntoView({behavior:"smooth",block:"start"});}});
})();`;

// --------------------------------------------------------------------------
// Ukrainian school planner for parents (/uk/dity/): canton, age and interest -> where the child is in the system,
// school registration and language support in the canton, and the admission rules of the next school.
// Only verified rows: Status S facts per canton, admission_conditions (uk), the Langzeitgymnasium cantons.
// --------------------------------------------------------------------------

function renderUkKids(schoolFacts: Row[], admissions: Row[], langgymCantons: string[], today: string): string {
  const url = SITE + "/uk/dity/";
  const names = CANTON_NAMES_I18N.uk;
  const src = (r?: Row) => (r ? safeUrl(r.official_url) ?? safeUrl(r.evidence_url) : undefined);
  const routeNames = ADMISSION.uk.routes;

  const cantonCodes = [...new Set(schoolFacts.map(r => String(r.canton_code).toUpperCase()))].filter(c => names[c]).sort((a, b) => names[a].localeCompare(names[b], "uk"));
  const facts: Record<string, Record<string, { head: string; text: string; url: string }>> = {};
  for (const r of schoolFacts) {
    const c = String(r.canton_code).toUpperCase();
    if (!txt(r.headline_uk) || !txt(r.text_uk)) continue;
    (facts[c] ??= {})[String(r.topic)] = { head: txt(r.headline_uk)!, text: txt(r.text_uk)!, url: src(r) ?? "" };
  }
  const adm: Record<string, Record<string, { name: string; head: string; req: string; deadline: string; timing: string; url: string }>> = {};
  for (const r of admissions) {
    const c = String(r.canton_code).toUpperCase();
    const head = txt(r.headline_uk);
    if (!head || !routeNames[String(r.route)]) continue;
    (adm[c] ??= {})[String(r.route)] = {
      name: routeNames[String(r.route)],
      head,
      req: txt(r.requirements_uk) ?? "",
      deadline: txt(r.deadline_text_uk) ?? "",
      timing: txt(r.typical_timing_uk) ?? "",
      url: src(r) ?? ""
    };
  }
  const data = { names, facts, adm, langgym: langgymCantons };

  const ages = Array.from({ length: 17 }, (_, i) => i + 4)
    .map(a => `<option value="${a}">${a} ${a < 5 ? "роки" : "років"}</option>`)
    .join("");
  const interests: [string, string][] = [
    ["unknown", "Ще не знаємо"],
    ["gym", "Гімназія, а потім університет"],
    ["lehre", "Професія: навчання з практикою (Lehre)"],
    ["fms", "FMS: здоров’я, соціальна сфера, педагогіка"]
  ];
  const description = "Шкільний план для дитини у Швейцарії: у якому класі за віком, як записати до школи у вашому кантоні, підтримка мови, гімназія, FMS чи Lehre і коли подаватися. Для батьків з України та всіх новоприбулих.";

  const css = `
  .planner{display:grid;gap:16px}
  .step{padding:20px 22px}.step h2{margin-bottom:6px}.step .hint{color:var(--muted);font-size:14px;margin:0 0 12px}
  .opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--card-b);border-radius:12px;margin-top:8px;cursor:pointer;background:rgba(139,92,246,.05)}
  .opt:has(input:checked){border-color:var(--accent);background:rgba(139,92,246,.16)}
  .opt input{margin-top:4px;accent-color:#8b5cf6}
  select.pick{width:100%;padding:12px;border-radius:12px;border:1px solid var(--card-b);background:var(--card);color:var(--fg);font:500 16px Inter,sans-serif}
  .row2{display:grid;gap:12px;grid-template-columns:1fr 1fr}@media(max-width:560px){.row2{grid-template-columns:1fr}}
  .result{padding:22px;border:1px solid var(--accent)}
  .stage{display:inline-block;padding:6px 12px;border-radius:99px;background:rgba(139,92,246,.18);font-weight:700;margin:4px 0 10px}
  ol.plan{padding-left:20px;margin:12px 0 0}ol.plan li{margin-bottom:12px}ol.plan a{color:var(--accent)}
  .admit{border:1px solid var(--card-b);border-radius:12px;background:rgba(139,92,246,.06);padding:10px 12px;margin:8px 0}
  .admit small{display:block;color:var(--muted)}
  table.need{width:100%;border-collapse:collapse;font-size:15px}table.need td{border-bottom:1px solid var(--card-b);padding:9px 8px;vertical-align:top}table.need td:first-child{font-weight:600;width:38%}
  .founder{display:flex;gap:14px;align-items:flex-start;padding:18px 20px;font-size:15px}.founder img{width:40px;height:40px;flex:none}
  .founder p{margin:0 0 8px;color:var(--muted)}.founder p:last-child{margin:0}
  `;

  const main = `  <style>${css}</style>
  <div class="crumbs"><a href="/uk/">Inspirella</a> › Дитина і школа</div>
  <header class="hero">
    <div class="badges"><span class="badge">Для батьків</span><span class="badge warm">2 хвилини · без реєстрації</span></div>
    <h1>Шкільний план для вашої дитини</h1>
    <p class="lead">Оберіть кантон, вік дитини й те, що їй цікаво: ви побачите, де вона зараз у швейцарській системі, як записати її до школи, яку підтримку з мовою вона отримає і як вступати далі саме у вашому кантоні.</p>
  </header>
  <div class="planner" id="planner">
    <section class="card step"><h2>1. Кантон і вік</h2><p class="hint">Вік на початок навчального року (у більшості кантонів контрольна дата — 31 липня).</p>
      <div class="row2"><select class="pick" id="canton"><option value="">Оберіть кантон</option>${cantonCodes.map(c => `<option value="${esc(c)}">${esc(names[c])}</option>`).join("")}</select>
      <select class="pick" id="age"><option value="">Вік дитини</option>${ages}</select></div></section>
    <section class="card step"><h2>2. Що цікаво дитині?</h2><p class="hint">Можна змінити будь-коли: у Швейцарії майже з будь-якого шляху можна перейти на інший.</p>${interests.map(([v, l]) => `<label class="opt"><input type="radio" name="int" value="${v}"><span>${esc(l)}</span></label>`).join("")}</section>
    <section class="card result" id="result" hidden aria-live="polite"></section>
  </div>
  <noscript><p class="note">Для плану потрібен JavaScript. Нижче — основне у звичайному вигляді.</p></noscript>

  <h2 style="margin-top:40px">Школа у Швейцарії за віком</h2>
  <section class="card"><table class="need">
    <tr><td>близько 4–6 років</td><td>Дитячий садок (Kindergarten). Обов’язкова школа триває 11 років і починається приблизно з 4 років; у кількох кантонах садок не обов’язковий або обов’язковий лише рік.</td></tr>
    <tr><td>близько 6–12 років</td><td>Початкова школа (Primarschule).</td></tr>
    <tr><td>з 12-го року життя</td><td>Нижча середня школа (Sekundarstufe I), зазвичай 3 роки (у Тічино інакше). У деяких кантонах після 6-го класу можна вступити до довгої гімназії.</td></tr>
    <tr><td>близько 15–16 років</td><td>Після обов’язкової школи: гімназія, середня фахова школа (FMS), професійне навчання з практикою (Lehre) або перехідна програма.</td></tr>
  </table><p class="more"><a href="/uk/systema-osvity-shveitsarii/">Уся система освіти на одній сторінці →</a></p></section>

  ${feedbackBlock("uk-dity")}
  <section class="card prose" style="margin-top:22px"><p>Далі: <a href="/uk/pryjom/">вступ за кантонами</a> · <a href="/uk/perekhidni-prohramy/">перехідні програми для молоді</a> · <a href="/uk/status-s/">статус S за кантонами</a> · <a href="/uk/mova/">мовний план для дорослих</a></p></section>

  <section class="card founder" style="margin-top:22px"><img src="/swift-mark-64.png" alt="" width="40" height="40"><div><p>Inspirella створена Софією, яка сама колись потребувала такої підтримки.</p><p>У 2022 році вона приїхала з Києва до Швейцарії. Спочатку навчалася в класі для українських дітей, а згодом перейшла до швейцарської школи, де не розуміла ні діалекту, ні системи, ні завдань. Сьогодні вона вільно орієнтується в швейцарському середовищі, володіє німецькою на рівні B2 і навчається в гімназії.</p></div></section>
  <div class="source">Inspirella — незалежний інструмент для орієнтації, а не офіційна установа. Дані взято з офіційних сторінок кантонів, EDK і berufsberatung.ch і перекладено; правила й терміни можуть змінюватися, тому перевіряйте їх за посиланнями. Вік указано приблизно: клас визначає школа. Дані станом на ${esc(today)}. Помітили помилку? Напишіть на <a href="mailto:iinspirella@gmail.com">iinspirella@gmail.com</a>.</div>
  <script type="application/json" id="kids-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
  <script>${KIDS_SCRIPT}</script>`;

  return layout({
    docTitle: "Шкільний план для дитини у Швейцарії: клас, школа, вступ | Inspirella",
    ogTitle: "Шкільний план для вашої дитини у Швейцарії",
    description,
    url,
    indexable: true,
    lang: "uk",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" },
    ld: { "@context": "https://schema.org", "@type": "WebPage", name: "Шкільний план для вашої дитини", url, inLanguage: "uk", description, dateModified: today, isPartOf: { "@type": "WebSite", name: "Inspirella", url: SITE + "/" } },
    main
  });
}

const KIDS_SCRIPT = `(function(){
var d=JSON.parse(document.getElementById("kids-data").textContent);
var box=document.getElementById("result");
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}
function link(u,t){return u?' <a href="'+esc(u)+'"'+(u.charAt(0)==="/"?"":' rel="noopener" target="_blank"')+'>'+esc(t)+'</a>':"";}
function fact(f,more){if(!f)return "";return '<b>'+esc(f.head)+'.</b>'+(more?'<details class="qa"><summary>Докладніше</summary><p>'+esc(f.text)+'</p></details>':'')+link(f.url,"Офіційна сторінка →");}
function admit(a){if(!a)return "";return '<div class="admit"><b>'+esc(a.name)+'</b><br>'+esc(a.head)+(a.timing?'<small>Коли: '+esc(a.timing)+'</small>':'')+(a.deadline?'<small>Термін: '+esc(a.deadline)+'</small>':'')+(a.req?'<details class="qa"><summary>Умови вступу</summary><p>'+esc(a.req)+'</p></details>':'')+link(a.url,"Офіційна сторінка →")+'</div>';}
function render(){
  var c=document.getElementById("canton").value, age=+document.getElementById("age").value;
  var e=document.querySelector('input[name="int"]:checked'), it=e?e.value:null;
  if(!c||!age||!it){box.hidden=true;return;}
  var name=d.names[c], f=d.facts[c]||{}, a=d.adm[c]||{}, lg=d.langgym.indexOf(c)>=0;
  var stage, from;
  if(age<=5){stage="Дитячий садок (Kindergarten)";from="primar";}
  else if(age<=11){stage="Початкова школа (Primarschule)";from="primar";}
  else if(age<=14){stage="Нижча середня школа (Sekundarstufe I)";from="sek1";}
  else if(age===15){stage="Останній рік обов’язкової школи або перший крок після неї";from="sek1";}
  else {stage="Після обов’язкової школи";from="arrival";}
  var h='<h2>План для дитини '+age+' років у кантоні '+esc(name)+'</h2><span class="stage">'+esc(stage)+'</span><p class="more">Орієнтир за віком: клас визначає школа.</p>';
  var steps=[];
  if(age<=15){steps.push(f.school_registration?'<b>Запис до школи.</b> '+fact(f.school_registration,true):'<b>Запис до школи.</b> Зверніться до громади за місцем проживання.');}
  if(f.school_language_support&&age<=16){steps.push('<b>Підтримка мови в школі.</b> '+fact(f.school_language_support,true));}
  if(age>=14&&f.youth_transition){steps.push('<b>Після обов’язкової школи.</b> '+fact(f.youth_transition,true));}
  var next=[];
  if(it==="gym"||it==="unknown"){ if(lg&&age<=12){next.push(admit(a.gymnasium_lang)||'');} next.push(admit(a.gymnasium_kurz)); }
  if(it==="fms"||it==="unknown"){ next.push(admit(a.fms)); }
  if(it==="lehre"||it==="unknown"){ next.push(admit(a.bms_bm1)); }
  next=next.filter(Boolean);
  var lehreStep=(it==="lehre"||it==="unknown")?'<b>Професія (Lehre).</b> З вибором професії, пробними днями (Schnupperlehre) і пошуком місця для навчання допомагає кантональний центр профорієнтації (BIZ).'+link("https://www.berufsberatung.ch/de/eine-berufslehre-in-der-schweiz-absolvieren","berufsberatung.ch →"):'';
  if(next.length){steps.push('<b>Вступ далі у кантоні '+esc(name)+'.</b>'+next.join(""));}
  if(lehreStep){steps.push(lehreStep);}
  if(it==="gym"&&lg&&age<=12){steps.push('<b>Довга гімназія.</b> У кантоні '+esc(name)+' після 6-го класу можна вступити до довгої гімназії; її перші роки замінюють нижчу середню школу.');}
  if(it==="gym"&&!lg&&age<=12){steps.push('<b>Гімназія.</b> У кантоні '+esc(name)+' до гімназії зазвичай вступають після нижчої середньої школи.');}
  h+='<ol class="plan"><li>'+steps.join('</li><li>')+'</li></ol>';
  var to=it==="gym"?"gymnasium":it==="fms"?"fms":it==="lehre"?"efz":"";
  h+='<div class="cta-row" style="margin-top:14px"><a class="btn btn-primary" href="/pathmap/?lang=uk&from='+from+(to?'&to='+to:'')+'">Побачити шлях на мапі →</a><a class="btn btn-sec" href="/uk/pryjom/'+c.toLowerCase()+'/">Усі умови вступу в кантоні</a></div><p class="more">Мапа відкривається після короткого старту без реєстрації.</p>';
  box.innerHTML=h;box.hidden=false;
}
document.getElementById("planner").addEventListener("change",function(e){render();if(e.target.name==="int"&&!box.hidden){box.scrollIntoView({behavior:"smooth",block:"start"});}});
})();`;

/** The three audiences of the Ukrainian start page and their first steps (links to pages that hold the verified facts). */
const WHO: { id: string; label: string; map: string; steps: [string, string, string][] }[] = [
  {
    id: "adult",
    label: "Я дорослий / доросла",
    map: "/pathmap/?lang=uk&from=arrival_adult",
    steps: [
      ["Мовний план за 2 хвилини", "Ваш рівень, скільки ще потрібно для вашої мети й курси у вашому кантоні.", "/uk/mova/"],
      ["Статус S, дозвіл B і C", "Що дає статус S, останні рішення і як залишитися у Швейцарії надовго.", "/uk/zalyshytysia/"],
      ["Професія або диплом у Швейцарії", "Як дорослим здобути швейцарський диплом з професії, зокрема з досвідом роботи.", "/uk/diplom-dlia-doroslykh/"]
    ]
  },
  {
    id: "parent",
    label: "Я батько / мати",
    map: "/pathmap/?lang=uk&from=arrival",
    steps: [
      ["Шкільний план для дитини", "У якому класі за віком, запис до школи, підтримка мови й вступ далі у вашому кантоні.", "/uk/dity/"],
      ["Вступ до гімназії, FMS чи на Lehre", "Умови й терміни вступу за кантонами.", "/uk/pryjom/"],
      ["Як улаштована система освіти", "Усі етапи на одній сторінці: від садка до університету.", "/uk/systema-osvity-shveitsarii/"]
    ]
  },
  {
    id: "youth",
    label: "Мені 16–25 років",
    map: "/pathmap/?lang=uk&from=arrival",
    steps: [
      ["Перехідні програми", "Підготовка до професійного навчання або школи: мова, орієнтація, практика.", "/uk/perekhidni-prohramy/"],
      ["Мовний план", "Який рівень потрібен для Lehre чи навчання і де вчити мову.", "/uk/mova/"],
      ["Вступ за кантонами", "Гімназія, FMS, професійна матура: умови й терміни.", "/uk/pryjom/"]
    ]
  }
];

function renderUkStart(counts: Counts, programCount: number): string {
  const url = SITE + "/uk/";
  const cards: [string, string, string][] = [
    ["Статус S, дозвіл B і C: як залишитися у Швейцарії", "Що дає статус S, що змінилося останнім часом і кроки до дозволу B, C та громадянства, з датами й джерелами.", "/uk/zalyshytysia/"],
    ["Я щойно приїхав(-ла) зі статусом захисту S", "Школа для дітей, курси німецької, контакти та перші кроки у вашому кантоні. Обираєте кантон і бачите, що там працює.", "/uk/status-s/"],
    ["Хочу здобути професію у Швейцарії", "Як дорослі отримують швейцарський диплом з професії: шляхи для тих, хто вже має досвід або вже працює.", "/uk/diplom-dlia-doroslykh/"],
    ["Шкільний план для дитини", "У якому класі за віком, як записати до школи у вашому кантоні, підтримка мови, гімназія, FMS чи Lehre і коли подаватися.", "/uk/dity/"],
    ["Мовний план за 2 хвилини", "Ваш рівень, ваша мета (Lehre, виш, робота, дозвіл C, громадянство) і що робити далі, з курсами саме у вашому кантоні.", "/uk/mova/"],
    ["Молодь 15–25 років: перехідні програми", "Програми, які допомагають підготуватися до професійного навчання або школи: мова, орієнтація, практика.", "/uk/perekhidni-prohramy/"],
    ["Як улаштована система освіти", "Усі етапи від початкової школи до університету на одній сторінці та переходи між ними, у тому числі обхідні шляхи.", "/uk/systema-osvity-shveitsarii/"],
    ["Професії у Швейцарії українською", "Понад 1700 професій: що робить людина в професії, скільки триває навчання, зарплата учня і де вчитися. Без реєстрації.", "/uk/beruf/"],
    ["Каталог шкіл і ресурсів у застосунку", "Професії, школи, вищі навчальні заклади та корисні сайти українською. Відкривається після короткого старту «Знайдіть свій шлях» (без реєстрації) або входу.", "/ressourcen/?lang=uk"],
    ["Мапа шляхів освіти (Swiss Path Map)", "Усі етапи освіти та переходи між ними для вашого кантону. Також після короткого старту.", "/pathmap/?lang=uk"]
  ];
  const cardsHtml = cards
    .map(([t, d, h]) => `<li><a class="school" href="${esc(h)}"><div><b>${esc(t)}</b><br><span>${esc(d)}</span></div></a></li>`)
    .join("");
  const description = "Освіта та навчання у Швейцарії для українців: статус захисту S, школа для дітей, курси німецької, професійне навчання, вступ до університету. Українською, з офіційними джерелами.";
  const main = `  <header class="hero">
    <div class="badges"><span class="badge">Для українців у Швейцарії</span><span class="badge warm">Безкоштовно</span></div>
    <h1>Освіта та навчання у Швейцарії: з чого почати</h1>
    <p class="lead">Школа, професійне навчання, мовні курси та вступ до університету. Прості пояснення українською, з посиланнями на офіційні джерела та контакти у вашому кантоні.</p>
    <div class="cta-row"><a class="btn btn-primary" href="#who">З чого почати мені →</a><a class="btn btn-sec" href="/uk/status-s/">Обрати свій кантон</a></div>
  </header>
  ${factsHtml([
    ["Професій у каталозі", String(counts.professions)],
    ["Шкіл і вишів", String(counts.institutions)],
    ["Програм навчання у вишах", String(programCount)],
    ["Кантонів", "26"]
  ])}
  <section class="card who" id="who">
    <h2>Хто ви?</h2>
    <p class="more" style="margin:0 0 12px">Оберіть, і ми покажемо три перші кроки саме для вас.</p>
    <div class="cta-row">${WHO.map(w => `<button type="button" class="btn btn-sec" data-who="${w.id}">${esc(w.label)}</button>`).join("")}</div>
    ${WHO.map(w => `<div class="who-panel" data-panel="${w.id}" hidden><ol class="plan">${w.steps.map(([t, d, h]) => `<li><a href="${esc(h)}"><b>${esc(t)}</b></a><br><span>${esc(d)}</span></li>`).join("")}</ol><div class="cta-row" style="margin-top:12px"><a class="btn btn-primary" href="${esc(w.map)}">Мій шлях на мапі →</a></div></div>`).join("")}
  </section>
  <section class="card" style="margin-top:22px">
    <h2>Усі розділи</h2>
    <ul class="schools">${cardsHtml}</ul>
  </section>
  <style>.who-panel{margin-top:16px}.who-panel ol.plan{padding-left:20px;margin:0}.who-panel li{margin-bottom:12px}.who-panel li a{color:var(--accent);text-decoration:none}.who-panel li span{color:var(--muted);font-size:15px}.who .btn[aria-pressed="true"]{border-color:var(--accent);background:rgba(139,92,246,.18)}</style>
  <script>(function(){var w=document.getElementById("who");w.querySelectorAll("[data-who]").forEach(function(b){b.addEventListener("click",function(){w.querySelectorAll("[data-who]").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});w.querySelectorAll("[data-panel]").forEach(function(p){p.hidden=p.dataset.panel!==b.dataset.who;});try{localStorage.setItem("inspirella-who",b.dataset.who);}catch(e){}});});try{var s=localStorage.getItem("inspirella-who");var b=s&&w.querySelector('[data-who="'+s+'"]');if(b)b.click();}catch(e){}})();</script>
  ${feedbackBlock("uk-start")}
  <section class="card prose" style="margin-top:22px">
    <h2>Як користуватися</h2>
    <ul>
      <li>Почніть зі сторінки свого кантону: там контакти, запис до школи та курси німецької.</li>
      <li>У застосунку оберіть мову інтерфейсу українську: мова збережеться, і сторінки відкриватимуться українською.</li>
      <li>Усі правила можуть відрізнятися за кантонами та школами. Остаточну інформацію завжди перевіряйте на офіційному сайті та в центрі профорієнтації вашого кантону (BIZ).</li>
    </ul>
  </section>
  <div class="source">Inspirella — незалежний інструмент для орієнтації, а не офіційна установа. Відомості беруться з офіційних джерел (SEM, SBFI, EDK, berufsberatung.ch, swissuniversities, кантонів) і містять посилання на джерело. Якщо помітите помилку або застарілу інформацію, напишіть на <a href="mailto:iinspirella@gmail.com">iinspirella@gmail.com</a>. <a href="/methodik/">Як ми працюємо</a> (німецькою).</div>`;

  return layout({
    docTitle: "Освіта у Швейцарії для українців: з чого почати | Inspirella",
    ogTitle: "Освіта та навчання у Швейцарії для українців",
    description,
    url,
    indexable: true,
    lang: "uk",
    nav: { about: "Про Inspirella", app: "Відкрити застосунок" },
    ld: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Освіта та навчання у Швейцарії: з чого почати",
      url,
      inLanguage: "uk",
      description,
      isPartOf: { "@type": "WebSite", name: "Inspirella", url: SITE + "/" }
    },
    main
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

  // links from each stage of the system to the lists of professions and the guides (pages are in German)
  const EXPLORE: Record<SysLang, { title: string; links: [string, string][] }> = {
    de: { title: "Weiter erkunden", links: [["Alle Berufe von A bis Z", "/berufe/"], ["Lehrberufe EFZ", "/berufe/efz/"], ["Lehrberufe EBA", "/berufe/eba/"], ["Höhere Fachschule (HF)", "/berufe/hf/"], ["Fachhochschule (FH)", "/berufe/fh/"], ["Universität und ETH", "/berufe/uni/"], ["Zulassung nach Kanton", "/zulassung/"], ["Brückenangebote", "/brueckenangebote/"], ["Passerelle", "/passerelle/"], ["Schulen nach Kanton", "/schulen/"]] },
    en: { title: "Explore further (pages in German)", links: [["All careers in English", "/en/beruf/"], ["All professions A to Z (German)", "/berufe/"], ["Apprenticeships EFZ", "/berufe/efz/"], ["Apprenticeships EBA", "/berufe/eba/"], ["Higher vocational colleges (HF)", "/berufe/hf/"], ["Universities of applied sciences (FH)", "/berufe/fh/"], ["Universities and ETH", "/berufe/uni/"], ["Admission by canton", "/zulassung/"], ["Bridge programmes", "/brueckenangebote/"], ["Passerelle", "/passerelle/"], ["Schools by canton", "/schulen/"]] },
    uk: { title: "Дивитися далі (сторінки німецькою)", links: [["Усі професії українською", "/uk/beruf/"], ["Професії EFZ", "/berufe/efz/"], ["Професії EBA", "/berufe/eba/"], ["Вищі професійні школи (HF)", "/berufe/hf/"], ["Університети прикладних наук (FH)", "/berufe/fh/"], ["Університети та ETH", "/berufe/uni/"], ["Вступ за кантонами", "/uk/pryjom/"], ["Перехідні програми", "/uk/perekhidni-prohramy/"], ["Пасерель", "/passerelle/"], ["Школи за кантонами", "/schulen/"]] }
  };
  const exploreHtml = `<h2 style="margin-top:40px">${esc(EXPLORE[lang].title)}</h2>\n  <section class="card"><ul class="cols">${EXPLORE[lang].links.map(([t, h]) => `<li><a href="${h}"${h.startsWith("/uk/") ? "" : ' lang="de"'}>${esc(t)}</a></li>`).join("")}</ul></section>`;

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
  ${exploreHtml}
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
    items.map(i => `<li><a href="${esc(i.href)}" style="color:#4a2377">${esc(i.title)}</a></li>`).join("");
  return `<div style="max-width:1200px;margin:0 auto;padding:28px 24px 56px;font-family:'Manrope Variable',Manrope,system-ui,sans-serif;color:#1e1730;line-height:1.65">
<p style="font:700 20px 'Manrope Variable',Manrope,system-ui,sans-serif;margin:0 0 56px;color:#1e1730">inspirella</p>
<h1 lang="de" style="font:800 clamp(40px,6.4vw,88px)/0.98 'Wix Madefor Display Variable','Wix Madefor Display',system-ui,sans-serif;letter-spacing:-.035em;margin:0 0 22px;color:#1e1730">Keine Sackgassen.<span style="display:block;color:#4a2377">Nur nächste Schritte<span style="color:#e46f4c">.</span></span></h1>
<p lang="de" style="font-size:19px;margin:0 0 12px;max-width:60ch">Inspirella hilft dir, dich im Schweizer Bildungssystem zurechtzufinden: Berufe, die zu dir passen, Schulen, wo du sie lernst, und der nächste kleine Schritt. Kostenlos, auf Deutsch, Französisch, Italienisch, Englisch und Ukrainisch.</p>
<p lang="de" style="margin:0 0 24px;max-width:70ch">${counts.professions} Berufe und Programme, ${counts.institutions} Schulen und Institutionen, ${counts.resources} offizielle Ressourcen. Stand der Daten: ${esc(dataDate())}. Inspirella ist ein Orientierungswerkzeug und keine offizielle Stelle: Verbindliche Informationen findest du auf <a href="https://www.berufsberatung.ch/" style="color:#4a2377">berufsberatung.ch</a> und beim kantonalen Berufsinformationszentrum (BIZ).</p>
<p lang="en" style="color:#5c5470;margin:0 0 24px">Inspirella turns Switzerland's education system into one clear, personal path: careers that fit you, where to learn them, and the next small step to take. Free, in German, French, Italian, English and Ukrainian.</p>
<p style="margin:0 0 28px"><a href="/berufe/" lang="de" style="color:#4a2377">Alle Berufe</a> · <a href="/schulen/" lang="de" style="color:#4a2377">Alle Schulen</a> · <a href="/lehrlingsloehne/" lang="de" style="color:#4a2377">Lehrlingslöhne</a> · <a href="/passerelle/" lang="de" style="color:#4a2377">Passerelle</a> · <a href="/status-s/" lang="de" style="color:#4a2377">Schutzstatus S</a> · <a href="/zulassung/" lang="de" style="color:#4a2377">Zulassung nach Kanton</a> · <a href="/brueckenangebote/" lang="de" style="color:#4a2377">Brückenangebote</a> · <a href="/berufsabschluss-fuer-erwachsene/" lang="de" style="color:#4a2377">Berufsabschluss für Erwachsene</a> · <a href="/methodik/" lang="de" style="color:#4a2377">Methodik</a> · <a href="/ueber-inspirella/" style="color:#4a2377">About Inspirella</a> · <a href="/en/swiss-education-system/" style="color:#4a2377">Swiss education system</a> · <a href="/bildungssystem/" lang="de" style="color:#4a2377">Bildungssystem</a> · <a href="/uk/systema-osvity-shveitsarii/" lang="uk" style="color:#4a2377">Система освіти Швейцарії</a> ·<a href="/sitemap.xml" style="color:#4a2377">Sitemap</a> · <a href="/llms.txt" style="color:#4a2377">For AI assistants (llms.txt)</a> · <a href="/impressum/" style="color:#4a2377">Impressum</a> · <a href="/datenschutz/" style="color:#4a2377">Datenschutz</a></p>
<h2 lang="de" style="font:600 20px 'Wix Madefor Display',system-ui,sans-serif;margin:0 0 8px">Berufe</h2>
<ul style="margin:0 0 24px;padding-left:20px">${list(featured.professions)}</ul>
<h2 lang="de" style="font:600 20px 'Wix Madefor Display',system-ui,sans-serif;margin:0 0 8px">Schulen und Institutionen</h2>
<ul style="margin:0;padding-left:20px">${list(featured.institutions)}</ul>
<noscript><p style="margin-top:28px;color:#a8401a">The interactive app (map, personal path, tracker) needs JavaScript.</p></noscript>
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
  FEEDBACK_REST = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "") + "/rest/v1/page_feedback";
  FEEDBACK_KEY = key;
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
  const programRows = await fetchAll((from, to) =>
    supabase.from("institution_programs").select("*").eq("is_active", true).order("id", { ascending: true }).range(from, to)
  ).catch(() => [] as Row[]);
  const programsByInstitution = new Map<string, Row[]>();
  for (const p of programRows) (programsByInstitution.get(String(p.institution_id)) ?? programsByInstitution.set(String(p.institution_id), []).get(String(p.institution_id))!).push(p);
  const { count: resourceCount } = await supabase.from("resources").select("*", { count: "exact", head: true }).eq("is_active", true);

  // data for the richer profession pages (all public-read tables)
  const grab = (table: string, cols = "*", more?: (q: any) => any) =>
    fetchAll((from, to) => { let q: any = supabase.from(table).select(cols); if (more) q = more(q); return q.range(from, to); }).catch(() => [] as Row[]);
  const detailRows = await grab("profession_details");
  const traitRows = await grab("profession_traits");
  const wageRows = await grab("apprentice_wage_recommendations");
  const benchRows = await grab("salary_benchmarks", "*", q => q.eq("region", "Schweiz"));
  const regionBenchRows = await grab("salary_benchmarks", "*", q => q.neq("region", "Schweiz").eq("age_group", "total"));
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
  const regionByGroup = new Map<string, Row[]>();
  for (const b of regionBenchRows) (regionByGroup.get(String(b.isco_group)) ?? regionByGroup.set(String(b.isco_group), []).get(String(b.isco_group))!).push(b);
  const wagesByProf = new Map<string, Row[]>();
  for (const w of wageRows) (wagesByProf.get(String(w.profession_id)) ?? wagesByProf.set(String(w.profession_id), []).get(String(w.profession_id))!).push(w);
  const ctx: Ctx = {
    profByCode,
    profByCategory,
    detailsByProf: new Map(detailRows.map(d => [String(d.profession_id), d])),
    traits: new Map(traitRows.map(t => [Number(t.id), t])),
    wagesByProf,
    benchByGroup,
    regionByGroup,
    factsByProf: new Map(factRows.map(f => [String(f.profession_id), f])),
    profRowByCode: new Map(professions.filter(r => r.code).map(r => [String(r.code), r])),
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
  const profIdsByInstitution = new Map<string, string[]>();
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
    (profIdsByInstitution.get(iid) ?? profIdsByInstitution.set(iid, []).get(iid)!).push(pid);
    (professionsByInstitution.get(iid) ?? professionsByInstitution.set(iid, []).get(iid)!).push({
      title: prof.title,
      href: `/beruf/${prof.slug}/`
    });
  }
  const byTitle = (a: Link, b: Link) => a.title.localeCompare(b.title, "de");

  const urls: { loc: string; lastmod?: string }[] = [{ loc: `${SITE}/`, lastmod: today }, { loc: `${SITE}/ueber-inspirella/`, lastmod: today }, { loc: `${SITE}/impressum/`, lastmod: today }, { loc: `${SITE}/datenschutz/`, lastmod: today }, { loc: `${SITE}/methodik/`, lastmod: today }, { loc: `${SITE}/berufe/`, lastmod: today }, { loc: `${SITE}/schulen/`, lastmod: today }];
  const stats = { translatedInst: 0, translated: 0, professions: 0, professionsNoindex: 0, institutions: 0, institutionsNoindex: 0, skipped: 0 };
  const lastmodOf = (row: Row) => (typeof row.updated_at === "string" ? row.updated_at.slice(0, 10) : undefined);

  const profLPage = new Map<string, Link>();
  const translatedProfs: Record<PLang, (Link & { type: string })[]> = { uk: [], en: [] };
  const indexableProfs: Link[] = [];
  const indexableByType = new Map<string, Link[]>();
  const indexableByCategory = new Map<string, Link[]>();
  const indexableSchools: (Link & { cantonCode?: string })[] = [];
  for (const p of professions) {
    const slug = profSlug.get(String(p.id));
    if (!slug) {
      stats.skipped++;
      continue;
    }
    const profSchools = (schoolsByProfession.get(String(p.id)) ?? []).sort(byTitle);
    const { html, indexable, lastmod } = renderProfession(p, slug, profSchools, ctx);
    // Ukrainian and English pages where the row is translated; the German page links to them only when it is indexable too
    const langs = indexable ? PROF_LANGS.filter(l => profLangReady(p, l)) : [];
    const shownLangs = langs.filter(l => renderProfessionL(l, p, slug, profSchools, ctx, langs).indexable);
    for (const l of shownLangs) {
      await writePage([l, "beruf", slug], renderProfessionL(l, p, slug, profSchools, ctx, shownLangs).html);
      urls.push({ loc: `${SITE}/${l}/beruf/${slug}/`, lastmod: lastmod || today });
      stats.translated++;
      profLPage.set(`${String(p.id)}|${l}`, { title: txt(p[`title_${l}`])!, href: `/${l}/beruf/${slug}/` });
      translatedProfs[l].push({ title: txt(p[`title_${l}`])!, href: `/${l}/beruf/${slug}/`, type: String(p.profession_type || "other") });
    }
    await writePage(["beruf", slug], shownLangs.length ? renderProfession(p, slug, profSchools, ctx, shownLangs).html : html);
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
    const cid = String(p.profession_category_id || "");
    if (cid) (indexableByCategory.get(cid) ?? indexableByCategory.set(cid, []).get(cid)!).push(link);
  }

  const instTaken = new Set<string>();
  for (const i of institutions) {
    const slug = pageSlug(i.slug);
    if (!SLUG_RE.test(slug) || instTaken.has(slug)) {
      stats.skipped++;
      continue;
    }
    instTaken.add(slug);
    const instProgs = programsByInstitution.get(String(i.id)) ?? [];
    const { html, indexable, lastmod } = renderInstitution(i, slug, (professionsByInstitution.get(String(i.id)) ?? []).sort(byTitle), instProgs);
    // Ukrainian and English versions; their career lists link to the translated career pages only
    const iLangs = indexable ? PROF_LANGS.filter(l => instLangReady(i, l)) : [];
    const progCount = instProgs.filter(p => p.is_active !== false && safeUrl(p.official_url) && p.level !== "weiterbildung_overview").length;
    const profsIn = (l: PLang) => (profIdsByInstitution.get(String(i.id)) ?? []).map(pid => profLPage.get(`${pid}|${l}`)).filter((x): x is Link => !!x).sort((a, b) => a.title.localeCompare(b.title, l));
    const iShown = iLangs.filter(l => renderInstitutionL(l, i, slug, profsIn(l), progCount, iLangs).indexable);
    for (const l of iShown) {
      await writePage([l, "institution", slug], renderInstitutionL(l, i, slug, profsIn(l), progCount, iShown).html);
      urls.push({ loc: `${SITE}/${l}/institution/${slug}/`, lastmod: lastmod || today });
      stats.translatedInst++;
    }
    await writePage(["institution", slug], iShown.length ? renderInstitution(i, slug, (professionsByInstitution.get(String(i.id)) ?? []).sort(byTitle), instProgs, iShown).html : html);
    stats.institutions++;
    if (!indexable) {
      stats.institutionsNoindex++;
      continue;
    }
    urls.push({ loc: `${SITE}/institution/${slug}/`, lastmod: lastmod || today });
    indexableSchools.push({ title: txt(i.title_de) || txt(i.name) || slug, href: `/institution/${slug}/`, city: [txt(i.city), txt(i.canton)].filter(Boolean).join(", "), cantonCode: txt(i.canton)?.toUpperCase() });
  }

  for (const l of PROF_LANGS) {
    const list = translatedProfs[l];
    if (!list.length) continue;
    const H = PROF_HUB[l];
    const order = ["apprenticeship_efz", "apprenticeship_eba", "hf_diploma", "fh_bachelor", "university", "fachausweis", "diplom", "other"];
    const body = order
      .map(t => {
        const items = list.filter(x => (order.includes(x.type) ? x.type : "other") === t).sort((a, b) => a.title.localeCompare(b.title, l));
        return items.length ? `<section class="card"><h2>${esc(H.groups[t])} <small>(${items.length})</small></h2><ul class="cols">${items.map(it => `<li><a href="${esc(it.href!)}">${esc(it.title)}</a></li>`).join("")}</ul></section>` : "";
      })
      .join("\n  ");
    await writePage([l, "beruf"], renderHub({ path: `/${l}/beruf/`, title: H.title, h1: H.h1, lead: H.lead(list.length), crumbs: [["Inspirella", "/"], [H.h1]], body, description: H.lead(list.length), lang: l, nav: PL[l].nav, alternates: [{ lang: "de", href: `${SITE}/berufe/` }, ...PROF_LANGS.filter(x => translatedProfs[x].length).map(x => ({ lang: x, href: `${SITE}/${x}/beruf/` })), { lang: "x-default", href: `${SITE}/berufe/` }] }));
    urls.push({ loc: `${SITE}/${l}/beruf/`, lastmod: today });
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
  let fieldHubs: { slug: string; name: string; description?: string; list: Link[] }[] = [];
  try {
    const cats = await fetchAll((from, to) => supabase.from("profession_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).range(from, to));
    fieldHubs = cats
      .map(c => ({ slug: String(c.code || "").replace(/_/g, "-"), name: txt(c.name_de) || "", description: txt(c.description_de), list: indexableByCategory.get(String(c.id)) ?? [] }))
      .filter(c => c.slug && c.name && c.list.length > 0);
  } catch (err: any) {
    console.warn("[pages] Profession field hubs skipped:", err?.message || err);
  }
  const fieldSection = fieldHubs.length
    ? `<section class="card"><h2>Nach Berufsfeld</h2><ul class="cols">${fieldHubs.map(h => `<li><a href="/berufe/bereich/${h.slug}/">${esc(h.name)} (${h.list.length})</a></li>`).join("")}</ul></section>
  `
    : "";
  await writePage(["berufe"], renderHub({
    path: "/berufe/",
    title: "Alle Berufe in der Schweiz von A bis Z",
    h1: "Alle Berufe in der Schweiz von A bis Z",
    lead: `${indexableProfs.length} Berufe und Ausbildungen mit Dauer, Lohn und Schulen: Lehre (EFZ, EBA), Höhere Berufsbildung, Fachhochschule und Universität.`,
    description: "Alle Berufe und Ausbildungen der Schweiz von A bis Z: Lehre EFZ und EBA, Höhere Fachschule, Fachhochschule, Universität, Berufsprüfung und höhere Fachprüfung.",
    crumbs: [["Inspirella", "/"], ["Berufe"]],
    body: `${fieldSection}<section class="card"><h2>Nach Abschluss</h2><ul class="cols">${hubTypes.map(([t, h]) => `<li><a href="/berufe/${h.slug}/">${esc(h.label)} (${(indexableByType.get(t) ?? []).length})</a></li>`).join("")}</ul></section>\n  ${azList(indexableProfs)}`
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
  for (const h of fieldHubs) {
    await writePage(["berufe", "bereich", h.slug], renderHub({
      path: `/berufe/bereich/${h.slug}/`,
      title: `Berufe im Bereich ${h.name}`,
      h1: `Berufe im Bereich ${h.name}`,
      lead: h.description ? `${h.description} ${h.list.length} Berufe und Ausbildungen von A bis Z.` : `${h.list.length} Berufe und Ausbildungen von A bis Z.`,
      description: truncate(`Berufe im Bereich ${h.name}: ${h.list.length} Berufe und Ausbildungen mit Beschreibung, Dauer, Lohn und Schulen in der Schweiz.`, 158),
      crumbs: [["Inspirella", "/"], ["Berufe", "/berufe/"], [h.name]],
      body: azList(h.list)
    }));
    urls.push({ loc: `${SITE}/berufe/bereich/${h.slug}/`, lastmod: today });
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
  // duplicate professions merged in the database (2026-10-23): the removed addresses forward to the kept page
  Object.assign(redirects, {
    "/beruf/techniker-in-hf-bauplanung/": "/beruf/technikerin-hf-bauplanung/",
    "/beruf/techniker-in-hf-grossanlagenbetrieb/": "/beruf/technikerin-hf-grossanlagenbetrieb/",
    "/beruf/physician-university/": "/beruf/arzt-aerztin/",
    // schools that were listed twice (2026-10-24): the removed address forwards to the kept school
    "/institution/fms-kantonale-fachmittelschule-lerbermatt/": "/institution/gymnasium-lerbermatt/",
    "/institution/fms-fms-der-kantonsschule-sursee/": "/institution/kantonsschule-sursee/",
    "/institution/fms-ecg-de-bienne-et-du-jura-bernois/": "/institution/gymnase-de-bienne-et-du-jura-bernois/",
    "/institution/wirtschaftsmittelschule-basel-wms/": "/institution/wirtschaftsgymnasium-basel-wg/",
    "/institution/informatikmittelschule-basel-ims/": "/institution/wirtschaftsgymnasium-basel-wg/",
    "/institution/sam-bellinzona/": "/institution/centro-professionale-tecnico-bellinzona/"
  });
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
  // Ukrainian start page
  try {
    const { count: programCount } = await supabase.from("institution_programs").select("*", { count: "exact", head: true }).eq("is_active", true);
    await writePage(["uk"], renderUkStart(counts, programCount ?? 0));
    urls.push({ loc: SITE + "/uk/", lastmod: today });
    const langNode = (await supabase.from("education_nodes").select("*").eq("code", "language").eq("is_active", true).maybeSingle()).data as Row | null;
    const langFacts = await fetchAll((from, to) => supabase.from("audience_facts").select("*").eq("is_active", true).eq("verification_status", "verified").eq("audience", "newcomer").eq("node_code", "language").order("sort_order", { ascending: true }).range(from, to));
    const courseFacts = await fetchAll((from, to) => supabase.from("audience_facts").select("*").eq("is_active", true).eq("verification_status", "verified").eq("audience", "ukraine_s").eq("topic", "language_courses").not("canton_code", "is", null).order("canton_code", { ascending: true }).range(from, to));
    if (langFacts.length) {
      await writePage(["uk", "mova"], renderUkLanguage(langNode ?? undefined, langFacts, courseFacts, today));
      urls.push({ loc: SITE + "/uk/mova/", lastmod: today });
    }
    // school planner for parents
    const schoolFacts = await fetchAll((from, to) => supabase.from("audience_facts").select("*").eq("is_active", true).eq("verification_status", "verified").eq("audience", "ukraine_s").in("topic", ["school_registration", "school_language_support", "youth_transition"]).not("canton_code", "is", null).order("canton_code", { ascending: true }).range(from, to));
    const admissionRows = await fetchAll((from, to) => supabase.from("admission_conditions").select("*").eq("is_active", true).eq("verification_status", "verified").order("code", { ascending: true }).range(from, to));
    const langgymRow = (await supabase.from("education_transitions").select("cantons").eq("code", "primar__gymnasium__langgym").eq("is_active", true).maybeSingle()).data as Row | null;
    const langgymCantons = Array.isArray(langgymRow?.cantons) ? (langgymRow!.cantons as unknown[]).map(c => String(c).toUpperCase()) : [];
    // status S and staying (S -> B -> C -> citizenship)
    const stayTopics = STAY_TOPICS.map(t => t.topic);
    const stayFacts = await fetchAll((from, to) => supabase.from("audience_facts").select("*").eq("is_active", true).eq("verification_status", "verified").eq("audience", "ukraine_s").in("topic", stayTopics).order("sort_order", { ascending: true }).range(from, to));
    const stayNational = stayFacts.filter(r => !r.canton_code);
    if (stayNational.length) {
      await writePage(["uk", "zalyshytysia"], renderUkStay(stayNational, stayFacts.filter(r => r.canton_code), today));
      urls.push({ loc: SITE + "/uk/zalyshytysia/", lastmod: today });
    }
    if (schoolFacts.length) {
      await writePage(["uk", "dity"], renderUkKids(schoolFacts, admissionRows.filter(r => !r.institution_id), langgymCantons, today));
      urls.push({ loc: SITE + "/uk/dity/", lastmod: today });
    }
  } catch (err: any) {
    console.warn("[pages] Ukrainian start page skipped:", err?.message || err);
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

  await fs.writeFile(path.join(DIST, "og-index.json"), JSON.stringify(OG_INDEX), "utf8");
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod || today}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  await fs.writeFile(path.join(DIST, "sitemap.xml"), sitemap, "utf8");

  console.log(
    `[pages] ${stats.professions} profession pages (${stats.professionsNoindex} noindex, ${stats.translated} uk/en versions), ${stats.institutions} institution pages (${stats.institutionsNoindex} noindex, ${stats.translatedInst} uk/en versions), about page, ${stats.skipped} skipped for bad slug; sitemap has ${urls.length} URLs.`
  );
}

main().catch(err => {
  // Never fail the deploy over SEO pages.
  console.error("[pages] Generation failed, continuing without pre-rendered pages:", err?.message || err);
});
