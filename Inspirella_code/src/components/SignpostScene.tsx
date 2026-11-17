import { useEffect, useState } from "react";
import type { LanguageCode } from "../types";
import { MARK_ORANGE } from "./BrandMark";

/**
 * Beside sign-up and sign-in: a Swiss hiking signpost. The post rises, contour lines and two
 * white-red-white trails draw in, the signs swing out one by one, and the brand figure lands on
 * the "You are here" plate. Then every few seconds one sign turns over to another route and is
 * highlighted, so the choice of ways keeps moving. Purely decorative (aria-hidden).
 */
type Route = [name: string, years: string];

const ROUTES: Record<LanguageCode, { here: string; sub: string; routes: Route[] }> = {
  de: { here: "Du bist hier", sub: "Start", routes: [["Lehre EFZ", "3–4 J."], ["Gymnasium", "3–4 J."], ["Fachhochschule", "3 J."], ["Höhere Fachschule", "2–3 J."], ["Lehre EBA", "2 J."], ["Berufsmaturität", "1–2 J."], ["Passerelle", "1 J."], ["Universität", "3 J."]] },
  en: { here: "You are here", sub: "Start", routes: [["Apprenticeship EFZ", "3–4 yrs"], ["Gymnasium", "3–4 yrs"], ["FH bachelor", "3 yrs"], ["Higher prof. school", "2–3 yrs"], ["Apprenticeship EBA", "2 yrs"], ["Vocational bacc.", "1–2 yrs"], ["Passerelle", "1 yr"], ["University", "3 yrs"]] },
  fr: { here: "Tu es ici", sub: "Départ", routes: [["Apprentissage CFC", "3–4 ans"], ["Gymnase", "3–4 ans"], ["HES bachelor", "3 ans"], ["École supérieure", "2–3 ans"], ["Apprentissage AFP", "2 ans"], ["Maturité prof.", "1–2 ans"], ["Passerelle", "1 an"], ["Université", "3 ans"]] },
  it: { here: "Sei qui", sub: "Partenza", routes: [["Tirocinio AFC", "3–4 anni"], ["Liceo", "3–4 anni"], ["SUP bachelor", "3 anni"], ["Scuola spec. sup.", "2–3 anni"], ["Tirocinio CFP", "2 anni"], ["Maturità prof.", "1–2 anni"], ["Passerella", "1 anno"], ["Università", "3 anni"]] },
  uk: { here: "Ти тут", sub: "Старт", routes: [["Навчання EFZ", "3–4 р."], ["Гімназія", "3–4 р."], ["FH бакалавр", "3 р."], ["Вища фахова школа", "2–3 р."], ["Навчання EBA", "2 р."], ["Проф. матура", "1–2 р."], ["Пасерель", "1 р."], ["Університет", "3 р."]] }
};

const POST_X = 320;
const SLOT_Y = [176, 248, 320, 392];
const SLOT_DIR = [1, -1, 1, -1];
const SIGN_W = 262, SIGN_H = 58, TIP = 28;

/** Irregular rings around the foot of the post, like swisstopo contour lines. */
const CONTOURS = Array.from({ length: 6 }, (_, i) => {
  const rx = 92 + i * 46, ry = 20 + i * 12, pts: string[] = [];
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const w = 1 + 0.06 * Math.sin(a * 3 + i * 1.7) + 0.04 * Math.sin(a * 5 - i);
    pts.push(`${(POST_X + 14 * Math.sin(i * .9) + Math.cos(a) * rx * w).toFixed(1)} ${(574 + Math.sin(a) * ry * w).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
});
const TRAILS = ["M318 566C270 586 210 596 150 612S40 636 -10 640", "M324 566C380 590 450 598 520 606S610 618 660 626"];

function signPath(dir: number): string {
  const x0 = dir > 0 ? POST_X + 12 : POST_X - 12;
  const x1 = x0 + dir * SIGN_W;
  return `M${x0} 0H${x1 - dir * TIP}L${x1} ${SIGN_H / 2}L${x1 - dir * TIP} ${SIGN_H}H${x0}Z`;
}

export default function SignpostScene({ language, className = "" }: { language: LanguageCode; className?: string }) {
  const copy = ROUTES[language] ?? ROUTES.en;
  const [shown, setShown] = useState([0, 1, 2, 3]);
  const [flip, setFlip] = useState(-1);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let slot = -1, next = 4, t1 = 0, t2 = 0;
    const turn = () => {
      slot = (slot + 1) % SLOT_Y.length;
      const s = slot, r = next % copy.routes.length;
      next++;
      setFlip(s);
      t1 = window.setTimeout(() => setShown(prev => prev.map((v, k) => (k === s ? r : v))), 260);
      t2 = window.setTimeout(() => { setFlip(-1); setActive(s); }, 540);
    };
    let iv = 0;
    const start = window.setTimeout(() => { turn(); iv = window.setInterval(turn, 3400); }, 3200);
    return () => { window.clearTimeout(start); window.clearInterval(iv); window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [copy.routes.length]);

  return (
    <div className={`alp-post ${className}`} aria-hidden="true">
      <svg viewBox="0 0 640 640" preserveAspectRatio="xMidYMid meet">
        <defs>
          <mask id="signTrailMask" maskUnits="userSpaceOnUse" x="-20" y="540" width="700" height="110">
            {TRAILS.map((d, i) => <path key={d} className="sg-reveal" style={{ ["--i" as string]: i }} pathLength={1} d={d} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" />)}
          </mask>
        </defs>
        <g className="sg-contours">
          {CONTOURS.map((d, i) => <path key={i} className={i === 3 ? "ix" : undefined} style={{ ["--i" as string]: i }} pathLength={1} d={d} />)}
        </g>
        <g mask="url(#signTrailMask)" fill="none" strokeLinecap="round">
          {TRAILS.map(d => <g key={d}><path d={d} stroke="#fff" strokeWidth="4" strokeDasharray="10 8" /><path d={d} stroke="#d9442f" strokeWidth="4" strokeDasharray="4 14" strokeDashoffset="-3" /></g>)}
        </g>
        <ellipse className="sg-shadow" cx={POST_X} cy="568" rx="46" ry="8" />
        <rect className="sg-post" x={POST_X - 10} y="104" width="20" height="466" rx="5" />

        {SLOT_Y.map((y, k) => {
          const dir = SLOT_DIR[k];
          const [name, years] = copy.routes[shown[k]] ?? copy.routes[0];
          const tx = dir > 0 ? POST_X + 32 : POST_X - 32;
          return (
            <g key={k} transform={`translate(0 ${y})`}>
              <g className={`sg-arm${dir > 0 ? " r" : " l"}${active === k ? " on" : ""}`} style={{ ["--i" as string]: k }}>
                <g className={flip === k ? "sg-face flip" : "sg-face"}>
                  <path className="sg-board" d={signPath(dir)} />
                  <text className="sg-name" x={tx} y="25" textAnchor={dir > 0 ? "start" : "end"}>{name}</text>
                  <text className="sg-years" x={tx} y="46" textAnchor={dir > 0 ? "start" : "end"}>{years}</text>
                </g>
              </g>
            </g>
          );
        })}

        <g className="sg-plate">
          <rect x={POST_X - 92} y="104" width="184" height="54" rx="10" />
          <text className="sg-here" x={POST_X} y="129" textAnchor="middle">{copy.here}</text>
          <text className="sg-sub" x={POST_X} y="148" textAnchor="middle">{copy.sub}</text>
        </g>

        <g className="sg-bird">
          <g transform={`translate(${POST_X - 36} 52) scale(.77)`}>
            <g className="sg-wings">
              <path className="wl" d="M0 6.2C17.3 5.3 33.6 12.8 46.75 23.6L47.6 30L38.7 34.6C27.7 22.9 14.7 12.8 0 6.2Z" />
              <path className="wr" d="M93.5 6.2C76.2 5.3 59.9 12.8 46.75 23.6L45.9 30L54.8 34.6C65.8 22.9 78.8 12.8 93.5 6.2Z" />
              <path d="M46.75 23.6L54.8 34.6L60.8 61L46.75 47.6L32.7 61L38.7 34.6Z" />
            </g>
            <circle cx="46.75" cy="8.2" r="8.15" fill={MARK_ORANGE} />
          </g>
        </g>
      </svg>
    </div>
  );
}
