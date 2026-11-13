/**
 * The Inspirella mark: a swift (Mauersegler) seen from below, coral head = the dot of the "i".
 * Drawn in parts so the wings can beat (alpen.css: .swift-mark, .swift-flyer).
 */
export default function SwiftMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg className={`swift-mark ${className}`} viewBox="0 0 48 48" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g className="bird">
        <path className="wl" d="M24 24C19 19.5 11 15.5 2 15.5C9 18.5 15.5 23.5 20.6 28.6L24 28.4Z" fill="currentColor" />
        <path className="wr" d="M24 24C29 19.5 37 15.5 46 15.5C39 18.5 32.5 23.5 27.4 28.6L24 28.4Z" fill="currentColor" />
        <path d="M20.6 28.6L18.2 40.5L24 34.6L29.8 40.5L27.4 28.6L24 23.6Z" fill="currentColor" />
        <circle className="head" cx="24" cy="17.2" r="3.6" fill="#e46f4c" />
      </g>
    </svg>
  );
}
