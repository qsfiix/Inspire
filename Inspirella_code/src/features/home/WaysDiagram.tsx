import { useEffect, useRef, useState } from "react";
import type { HomeCopy, NodeId } from "./homeCopy";
import { WAYS_CONTOURS } from "./contours";

type Only = "" | "A" | "B";

/** Path each node's travelling dot follows (ids of the hidden route paths below). */
const ROUTE: Record<NodeId, string> = {
  oberstufe: "alp-pA", lehre: "alp-pA", bm: "alp-pA", fh: "alp-pA", masterA: "alp-pA",
  bp: "alp-pH", hf: "alp-pH",
  gym: "alp-pB", matura: "alp-pB", uni: "alp-pB", masterB: "alp-pB"
};

const NODES: { id: NodeId; x: number; y: number; cls: "nA" | "nB" | "nH" | "n0"; label: "above" | "below"; sub?: keyof HomeCopy["ways"]["sub"]; subX?: number }[] = [
  { id: "oberstufe", x: 70, y: 265, cls: "n0", label: "below" },
  { id: "bp", x: 700, y: 66, cls: "nH", label: "above", sub: "fachausweis" },
  { id: "hf", x: 960, y: 66, cls: "nH", label: "above", sub: "diploma" },
  { id: "lehre", x: 300, y: 180, cls: "nA", label: "above", sub: "years" },
  { id: "bm", x: 540, y: 180, cls: "nA", label: "above", sub: "bmWhen", subX: 520 },
  { id: "fh", x: 800, y: 180, cls: "nA", label: "above", sub: "bachelor", subX: 836 },
  { id: "masterA", x: 1060, y: 180, cls: "nA", label: "above" },
  { id: "gym", x: 300, y: 360, cls: "nB", label: "below", sub: "years" },
  { id: "matura", x: 540, y: 360, cls: "nB", label: "below" },
  { id: "uni", x: 800, y: 360, cls: "nB", label: "below", sub: "bachelor", subX: 836 },
  { id: "masterB", x: 1060, y: 360, cls: "nB", label: "below" }
];

const group = (cls: string) => (cls === "nA" ? "gA" : cls === "nB" ? "gB" : cls === "nH" ? "gH" : "");

export default function WaysDiagram({ copy, onPlanner }: { copy: HomeCopy["ways"]; onPlanner: () => void }) {
  const [only, setOnly] = useState<Only>("");
  const [sign, setSign] = useState<{ id: NodeId; left: number; top: number; right: boolean } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const runnerRef = useRef<SVGCircleElement>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const show = (n: (typeof NODES)[number]) => {
    const svg = svgRef.current, panel = panelRef.current, runner = runnerRef.current;
    if (!svg || !panel || !runner) return;
    const m = svg.getScreenCTM();
    const pr = panel.getBoundingClientRect();
    if (!m) return;
    const sx = m.a * n.x + m.e - pr.left, sy = m.d * n.y + m.f - pr.top;
    const right = sx > pr.width * 0.6;
    setSign({ id: n.id, left: right ? sx - 280 : sx + 20, top: sy, right });
    // the coral dot runs from the start of the route to this node
    cancelAnimationFrame(raf.current);
    const path = svg.querySelector<SVGPathElement>(`#${ROUTE[n.id]}`);
    if (!path || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const L = path.getTotalLength();
    let end = 0, best = Infinity;
    for (let i = 0; i <= 300; i++) {
      const p = path.getPointAtLength((L * i) / 300), d = (p.x - n.x) ** 2 + (p.y - n.y) ** 2;
      if (d < best) { best = d; end = (L * i) / 300; }
    }
    if (end < 2) { runner.classList.remove("on"); return; }
    runner.classList.add("on");
    const dur = Math.min(1100, 350 + end * 0.9);
    let t0 = 0;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const pt = path.getPointAtLength(end * e);
      runner.setAttribute("cx", String(pt.x));
      runner.setAttribute("cy", String(pt.y));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const hide = () => {
    setSign(null);
    runnerRef.current?.classList.remove("on");
    cancelAnimationFrame(raf.current);
  };

  const onlyClass = only ? `only-${only}` : "";
  const pills: [Only, string][] = [["", copy.both], ["A", copy.viaLehre], ["B", copy.viaGym]];

  return (
    <>
      <div className="alp-ctl" role="group" aria-label={copy.showMe}>
        <span className="lbl">{copy.showMe}</span>
        {pills.map(([v, label]) => (
          <button key={v || "both"} type="button" className="alp-pill" aria-pressed={only === v} onClick={() => setOnly(v)}>{label}</button>
        ))}
      </div>
      <div className="alp-panel" ref={panelRef}>
        <svg className="alp-topo" viewBox="0 0 1160 470" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {WAYS_CONTOURS.map(c => <path key={`${c.d.slice(0, 18)}${c.i}`} className={c.ix ? "ix" : undefined} style={{ ["--i" as string]: c.i }} pathLength={1} d={c.d} />)}
        </svg>

        {/* Desktop: horizontal */}
        <svg ref={svgRef} className={`alp-ways h ${onlyClass}`} viewBox="0 0 1160 470" role="img"
          aria-label={`${copy.titleA} ${copy.titleB} ${copy.legend.join(", ")}`}>
          <g fill="none" strokeLinecap="round" className="base">
            <path strokeWidth="10" d="M70 265C160 265 180 180 300 180H1080" /><path strokeWidth="10" d="M70 265C160 265 180 360 300 360H1080" />
            <path strokeWidth="7" d="M300 180C420 180 440 66 560 66H1000" />
            <path strokeWidth="5" d="M540 180C640 180 680 360 800 360" /><path strokeWidth="5" d="M540 360C640 360 680 180 800 180" />
          </g>
          <g className="gH"><path className="draw tH" data-seg="H" pathLength={1} d="M300 180C420 180 440 66 560 66H1000" fill="none" strokeWidth="7" strokeLinecap="round" /></g>
          <g className="gA"><path className="draw tA" data-seg="A" pathLength={1} d="M70 265C160 265 180 180 300 180H1080" fill="none" strokeWidth="10" strokeLinecap="round" /></g>
          <g className="gB"><path className="draw tB" data-seg="B" pathLength={1} d="M70 265C160 265 180 360 300 360H1080" fill="none" strokeWidth="10" strokeLinecap="round" /></g>
          <path id="alp-pA" d="M70 265C160 265 180 180 300 180H1080" fill="none" stroke="none" />
          <path id="alp-pB" d="M70 265C160 265 180 360 300 360H1080" fill="none" stroke="none" />
          <path id="alp-pH" d="M70 265C160 265 180 180 300 180C420 180 440 66 560 66H1000" fill="none" stroke="none" />
          <g className="gX">
            <path className="draw br" data-seg="X" pathLength={1} d="M540 180C640 180 680 360 800 360" fill="none" strokeWidth="5" strokeLinecap="round" />
            <path className="draw br" data-seg="X" pathLength={1} d="M540 360C640 360 680 180 800 180" fill="none" strokeWidth="5" strokeLinecap="round" />
            <text className="bt" x="604" y="236">{copy.passerelle}</text>
            <text className="bt" x="604" y="320">{copy.praxisjahr}</text>
          </g>
          {NODES.map(n => {
            const node = copy.nodes[n.id];
            const ty = n.id === "oberstufe" ? n.y + 40 : n.label === "above" ? n.y - (n.cls === "nH" ? 26 : 30) : n.y + 40;
            const subY = n.cls === "nB" ? n.y - 28 : n.y + 36;
            return (
              <g key={n.id} className={group(n.cls)}>
                <circle className={`nd ${n.cls}`} cx={n.x} cy={n.y} r={n.cls === "nH" ? 10 : 11} tabIndex={0} role="button"
                  aria-label={`${node.t}: ${node.i}`}
                  onMouseEnter={() => show(n)} onFocus={() => show(n)} onClick={() => show(n)}
                  onMouseLeave={hide} onBlur={hide} />
                <text x={n.id === "oberstufe" ? 38 : n.x} y={ty} textAnchor={n.id === "oberstufe" ? "start" : "middle"}>{node.t}</text>
                {n.sub && <text className="lb" x={n.subX ?? n.x} y={subY} textAnchor="middle">{copy.sub[n.sub]}</text>}
              </g>
            );
          })}
          <circle ref={runnerRef} className="runner" r="7" />
        </svg>

        {/* Phones: vertical, time runs downward */}
        <svg className={`alp-ways v ${onlyClass}`} viewBox="0 0 360 780" role="img" aria-label={`${copy.titleA} ${copy.titleB}`}>
          <g fill="none" strokeLinecap="round" className="base">
            <path strokeWidth="9" d="M180 40C180 100 100 90 100 150V720" /><path strokeWidth="9" d="M180 40C180 100 270 90 270 150V720" />
            <path strokeWidth="5" d="M100 330C100 420 270 420 270 510" /><path strokeWidth="5" d="M270 330C270 420 100 420 100 510" />
            <path strokeWidth="6" d="M100 170C100 220 30 220 30 290V640" />
          </g>
          <g className="gH">
            <path className="draw tH" data-seg="H" pathLength={1} d="M100 170C100 220 30 220 30 290V640" fill="none" strokeWidth="6" strokeLinecap="round" />
            <text className="lb vlab" x="16" y="470" transform="rotate(-90 16 470)" textAnchor="middle">{copy.hbbVertical}</text>
          </g>
          <g className="gA"><path className="draw tA" data-seg="A" pathLength={1} d="M180 40C180 100 100 90 100 150V720" fill="none" strokeWidth="9" strokeLinecap="round" /></g>
          <g className="gB"><path className="draw tB" data-seg="B" pathLength={1} d="M180 40C180 100 270 90 270 150V720" fill="none" strokeWidth="9" strokeLinecap="round" /></g>
          <g className="gX">
            <path className="draw br" data-seg="X" pathLength={1} d="M100 330C100 420 270 420 270 510" fill="none" strokeWidth="5" strokeLinecap="round" />
            <path className="draw br" data-seg="X" pathLength={1} d="M270 330C270 420 100 420 100 510" fill="none" strokeWidth="5" strokeLinecap="round" />
            <text className="bt" x="150" y="400">{copy.passerelle}</text>
            <text className="bt" x="150" y="456">{copy.praxisjahr}</text>
          </g>
          <circle className="nd n0" cx="180" cy="40" r="11" /><text x="180" y="18" textAnchor="middle" className="vt">{copy.nodes.oberstufe.t}</text>
          <g className="gA">
            {([["lehre", 150], ["bm", 330], ["fh", 510], ["masterA", 690]] as [NodeId, number][]).map(([id, y]) => (
              <g key={id}><circle className="nd nA" cx="100" cy={y} r="10" /><text className="vt" x="114" y={y - 14}>{copy.nodes[id].short ?? copy.nodes[id].t}</text></g>
            ))}
          </g>
          <g className="gB">
            {([["gym", 150], ["matura", 330], ["uni", 510], ["masterB", 690]] as [NodeId, number][]).map(([id, y]) => (
              <g key={id}><circle className="nd nB" cx="270" cy={y} r="10" /><text className="vt" x="258" y={y + 30} textAnchor="end">{copy.nodes[id].short ?? copy.nodes[id].t}</text></g>
            ))}
          </g>
        </svg>

        {sign && (
          <div className={`alp-sign on ${sign.right ? "r" : "l"}`} style={{ left: sign.left, top: sign.top }} aria-hidden="true">
            <b>{copy.nodes[sign.id].t}</b><span>{copy.nodes[sign.id].i}</span>
          </div>
        )}
      </div>
      <div className="alp-legend">
        {copy.legend.map((l, i) => <span key={l}><i className={`k${i}`} />{l}</span>)}
      </div>
      <div className="alp-wfacts">
        {copy.facts.map(([b, s]) => <div className="wf" key={b}><b>{b}</b><span>{s}</span></div>)}
      </div>
      <p className="alp-src">{copy.sources} <a href="/pathmap/" onClick={e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onPlanner(); } }}>{copy.toPlanner}</a></p>
    </>
  );
}
