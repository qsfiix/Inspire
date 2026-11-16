import BrandMark from "../../components/BrandMark";

/**
 * The hero landscape: Bernese-Alps-like massif at dawn, one SVG per depth layer so scroll parallax
 * moves composited layers instead of repainting one big SVG (AlpenHome drives the transforms).
 * Load sequence (alpen.css, ~3 s): sky warms, sun rises, alpenglow descends the lit faces, the
 * white-red-white Wanderweg draws to the summit, the swift flies in and becomes the coral summit dot.
 */
const TRAIL = "M930 424L986 398L952 372L1004 348L976 322L1020 298L998 272L1036 248L1022 224L1050 198L1062 170";
const MASSIF = "M0 432L120 412L220 420L330 394L430 402L520 362L585 332L640 302L672 264L700 236L716 252L748 270L772 262L800 238L830 214L858 200L884 210L912 236L936 248L962 236L996 204L1030 182L1062 166L1090 178L1118 196L1146 206L1166 200L1192 222L1236 252L1290 268L1340 262L1400 286L1440 296V560H0Z";
const LIT = [
  "M700 236L716 252L748 270L738 318L714 296Z",
  "M858 200L884 210L912 236L936 248L922 300L884 266Z",
  "M1062 166L1090 178L1118 196L1146 206L1166 200L1192 222L1236 252L1206 304L1134 282L1090 236Z"
];

export default function Landscape() {
  return (
    <>
      <div className="alp-land" aria-hidden="true">
        <div className="alp-lyr" data-depth=".34">
          <svg viewBox="0 0 1440 560" preserveAspectRatio="xMaxYMax slice">
            <defs>
              <radialGradient id="alpSunGlow"><stop offset="0" stopColor="#ffd0b4" stopOpacity=".95" /><stop offset="1" stopColor="#ffd0b4" stopOpacity="0" /></radialGradient>
            </defs>
            <g transform="translate(220 0)">
              <circle className="alp-sun" cx="960" cy="236" r="200" fill="url(#alpSunGlow)" />
              <circle className="alp-sun" cx="960" cy="214" r="50" fill="#f8ae8b" />
            </g>
          </svg>
        </div>
        <div className="alp-lyr" data-depth=".27">
          <svg viewBox="0 0 1440 560" preserveAspectRatio="xMaxYMax slice">
            <defs><linearGradient id="alpFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dccff0" /><stop offset="1" stopColor="#efe5f6" /></linearGradient></defs>
            <path d="M0 330L64 312L112 320L170 296L214 304L262 278L300 288L352 262L398 282L446 268L494 290L540 274L598 296L652 270L708 246L746 258L790 232L846 252L900 228L948 246L1004 222L1050 236L1110 210L1160 228L1210 214L1262 240L1318 226L1372 250L1440 236V560H0Z" fill="url(#alpFar)" />
          </svg>
        </div>
        <div className="alp-lyr" data-depth=".18">
          <svg viewBox="0 0 1440 560" preserveAspectRatio="xMaxYMax slice">
            <defs>
              <linearGradient id="alpMass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a48fd2" /><stop offset=".55" stopColor="#b6a3dc" /><stop offset="1" stopColor="#cdbfe8" /></linearGradient>
              <linearGradient id="alpLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7d3ef" /><stop offset="1" stopColor="#cdbbe6" /></linearGradient>
              <linearGradient id="alpSweepG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".46" stopColor="#fff" /><stop offset=".6" stopColor="#000" /><stop offset="1" stopColor="#000" /></linearGradient>
              <mask id="alpGlowMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="560"><rect className="alp-sweep" x="0" y="-560" width="1440" height="1120" fill="url(#alpSweepG)" /></mask>
              <mask id="alpTrailMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="560"><path className="alp-trailreveal" pathLength={1} d={TRAIL} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></mask>
            </defs>
            <path d="M0 452L120 440L240 444V560H0Z" fill="#cdbfe8" />
            <g transform="translate(220 0)">
              <path d={MASSIF} fill="url(#alpMass)" />
              <path d="M700 236L672 264L640 302L652 338L690 302Z M858 200L830 214L800 238L812 280L846 240Z M1062 166L1030 182L996 204L1006 250L1044 206Z" fill="#9580c4" opacity=".55" />
              <g fill="url(#alpLit)">{LIT.map(d => <path key={d} d={d} />)}</g>
              <g fill="#fbf7ff">
                <path d="M700 236L716 252L709 254L713 266L702 256L695 266L692 250Z" />
                <path d="M858 200L884 210L897 224L885 222L890 238L874 224L866 240L858 222L844 230L848 213Z" />
                <path d="M1062 166L1090 178L1118 196L1109 203L1097 198L1103 216L1086 206L1082 226L1070 205L1056 220L1052 200L1037 208L1045 186Z" />
                <path d="M1166 200L1192 222L1181 221L1184 234L1169 222L1160 228L1160 212Z" />
              </g>
              <g mask="url(#alpGlowMask)" fill="#f2a7a6" opacity=".5">
                {LIT.map(d => <path key={d} d={d} />)}
                <path d="M1062 166L1045 186L1037 208L1052 200L1056 220L1070 205L1082 226L1086 206L1103 216L1097 198Z" opacity=".7" />
              </g>
              <g mask="url(#alpTrailMask)" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={TRAIL} stroke="#fff" strokeWidth="3" strokeDasharray="9 7" />
                <path d={TRAIL} stroke="#d9442f" strokeWidth="3" strokeDasharray="3 13" strokeDashoffset="-3" />
              </g>
              <circle className="alp-ping" cx="1062" cy="157" r="9" fill="#e46f4c" />
              <circle className="alp-summit" id="alp-summit" cx="1062" cy="157" r="9" fill="#e46f4c" />
            </g>
          </svg>
        </div>
        <div className="alp-lyr" data-depth=".1">
          <svg viewBox="0 0 1440 560" preserveAspectRatio="xMaxYMax slice">
            <defs><linearGradient id="alpHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a5fb2" /><stop offset="1" stopColor="#9a84c8" /></linearGradient></defs>
            <path d="M0 468L90 450L170 460L260 432L350 446L420 424L500 442L590 414L660 438L740 424L820 446L880 434L930 448L980 436L1060 424L1150 444L1240 418L1330 440L1440 426V560H0Z" fill="url(#alpHill)" />
          </svg>
        </div>
        <div className="alp-lyr" data-depth=".05">
          <svg viewBox="0 0 1440 560" preserveAspectRatio="xMaxYMax slice">
            <defs><linearGradient id="alpNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#55298a" /><stop offset="1" stopColor="#3f1d6a" /></linearGradient></defs>
            <path d="M0 502L120 480L240 496L380 466L520 494L640 476L780 502L900 486L1020 508L1140 474L1280 496L1440 480V560H0Z" fill="url(#alpNear)" />
            <path d="M0 534C220 514 380 540 600 526S960 504 1140 530S1360 516 1440 522V560H0Z" fill="#2b1546" />
          </svg>
        </div>
        <div className="alp-mist m1" />
        <div className="alp-mist m2" />
      </div>
      <div className="alp-flyer" id="alp-flyer" aria-hidden="true"><BrandMark /></div>
      <div className="alp-grain" aria-hidden="true" />
    </>
  );
}
