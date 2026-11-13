import SwiftMark from "./SwiftMark";

/**
 * A small dawn landscape for app pages in the Alpenglühen theme (where the night theme shows the
 * particle phoenix): the range at sunrise, the Wanderweg to the summit and a swift gliding above it.
 */
export default function AlpenVignette({ className = "" }: { className?: string }) {
  return (
    <div className={`alp-vignette ${className}`} aria-hidden="true">
      <svg viewBox="0 0 600 560" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="vigSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3c1f0" /><stop offset=".55" stopColor="#f3dde3" /><stop offset="1" stopColor="#fdebe0" /></linearGradient>
          <radialGradient id="vigSun"><stop offset="0" stopColor="#ffd0b4" stopOpacity=".95" /><stop offset="1" stopColor="#ffd0b4" stopOpacity="0" /></radialGradient>
          <linearGradient id="vigMass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a48fd2" /><stop offset="1" stopColor="#cdbfe8" /></linearGradient>
        </defs>
        <rect width="600" height="560" fill="url(#vigSky)" />
        <circle cx="380" cy="250" r="170" fill="url(#vigSun)" />
        <circle cx="380" cy="236" r="44" fill="#f8ae8b" />
        <path d="M0 330L80 300L150 316L230 270L300 296L380 250L460 280L540 254L600 270V560H0Z" fill="#e2d6f2" />
        <path d="M0 400L90 360L170 380L250 300L290 260L320 238L346 256L390 222L420 206L452 224L500 262L560 290L600 300V560H0Z" fill="url(#vigMass)" />
        <path d="M420 206L452 224L500 262L476 304L440 276Z" fill="#ecd3e6" />
        <path d="M420 206L452 224L446 230L450 244L436 234L428 246L420 230L408 238L410 220Z" fill="#fbf7ff" />
        <path d="M330 420L362 404L344 388L374 372L360 356L388 338L376 320L400 300L392 282L412 260L420 216" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="8 7" strokeLinecap="round" />
        <circle cx="420" cy="196" r="9" fill="#e46f4c" />
        <path d="M0 450L120 420L240 440L360 410L480 444L600 420V560H0Z" fill="#7a5fb2" />
        <path d="M0 500L140 476L300 496L440 470L600 490V560H0Z" fill="#4f2585" />
      </svg>
      <span className="vig-swift"><SwiftMark /></span>
    </div>
  );
}
