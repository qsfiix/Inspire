/**
 * The Inspirella mark: a figure with arms raised like wings, the orange head is the dot of the i.
 * Traced from Sofiia's logo (2026-11-16). Drawn in parts so the arms can beat
 * (alpen.css: .brand-mark). The same shape lives in favicon.svg, logo-mark-*.png and the static pages.
 */
export const MARK_PATH = "M0 6.2C17.3 5.3 33.6 12.8 46.75 23.6C59.9 12.8 76.2 5.3 93.5 6.2C78.8 12.8 65.8 22.9 54.8 34.6L60.8 61L46.75 47.6L32.7 61L38.7 34.6C27.7 22.9 14.7 12.8 0 6.2Z";
export const MARK_ORANGE = "#f26732";

export default function BrandMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="-1 -1 95.5 63" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g className="bird">
        <path className="wl" d="M0 6.2C17.3 5.3 33.6 12.8 46.75 23.6L47.6 30L38.7 34.6C27.7 22.9 14.7 12.8 0 6.2Z" fill="currentColor" />
        <path className="wr" d="M93.5 6.2C76.2 5.3 59.9 12.8 46.75 23.6L45.9 30L54.8 34.6C65.8 22.9 78.8 12.8 93.5 6.2Z" fill="currentColor" />
        <path d="M46.75 23.6L54.8 34.6L60.8 61L46.75 47.6L32.7 61L38.7 34.6Z" fill="currentColor" />
        <circle className="head" cx="46.75" cy="8.2" r="8.15" fill={MARK_ORANGE} />
      </g>
    </svg>
  );
}
