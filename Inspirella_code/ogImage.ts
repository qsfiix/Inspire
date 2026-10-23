// Share-preview images (1200x630) for the pre-rendered pages, drawn on request and cached.
// The page generator writes dist/og-index.json (address -> title, subtitle, kind); the server turns an entry into a PNG
// the first time a crawler or a chat app asks for it. No images are stored in the build.
import fs from "node:fs";
import path from "node:path";

interface OgEntry {
  t: string;
  s?: string;
  k?: string;
}

let index: Record<string, OgEntry> | null = null;
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null = null;
let logoUri = "";
const cache = new Map<string, Buffer>();
const MAX_CACHE = 400;

function loadAssets(dist: string): void {
  if (!index) {
    try {
      index = JSON.parse(fs.readFileSync(path.join(dist, "og-index.json"), "utf8"));
    } catch {
      index = {};
    }
  }
  if (!fonts) {
    const dir = path.join(process.cwd(), "node_modules", "@fontsource", "inter", "files");
    const load = (file: string, weight: 400 | 700, name = "Inter") => ({ name, data: fs.readFileSync(path.join(dir, file)), weight, style: "normal" as const });
    fonts = [
      load("inter-latin-400-normal.woff", 400),
      load("inter-latin-700-normal.woff", 700),
      load("inter-latin-ext-400-normal.woff", 400, "InterExt"),
      load("inter-latin-ext-700-normal.woff", 700, "InterExt"),
      load("inter-cyrillic-400-normal.woff", 400, "InterCyr"),
      load("inter-cyrillic-700-normal.woff", 700, "InterCyr")
    ];
  }
  if (!logoUri) {
    try {
      logoUri = "data:image/png;base64," + fs.readFileSync(path.join(dist, "logo-mark-128.png")).toString("base64");
    } catch {
      logoUri = "";
    }
  }
}

/** Characters none of the bundled Inter subsets can draw are replaced so no empty boxes appear. */
function drawable(text: string): string {
  return text.normalize("NFC").replace(/[^ -ɏЀ-ӿ–—‘-„•…€]/g, "·");
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style: { display: "flex", ...style }, children } });

export async function renderOgImage(key: string, dist: string): Promise<Buffer | null> {
  loadAssets(dist);
  const entry = index?.[key];
  if (!entry) return null;
  const hit = cache.get(key);
  if (hit) return hit;

  const [{ default: satori }, { Resvg }] = await Promise.all([import("satori"), import("@resvg/resvg-js")]);
  const title = drawable(entry.t);
  const size = title.length > 90 ? 50 : title.length > 60 ? 58 : title.length > 36 ? 68 : 80;
  const tree = el(
    "div",
    { width: 1200, height: 630, flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #0d0618 0%, #1e1145 60%, #2e1a6b 100%)", color: "#f5f3ff", fontFamily: "Inter, InterExt, InterCyr" },
    [
      el("div", { alignItems: "center", gap: 18 }, [
        logoUri ? { type: "img", props: { src: logoUri, width: 56, height: 53 } } : el("div", {}, ""),
        el("div", { fontSize: 34, fontWeight: 700, letterSpacing: 1 }, "Inspirella")
      ]),
      el("div", { flexDirection: "column", gap: 22, width: 1072 }, [
        entry.k ? el("div", { fontSize: 28, fontWeight: 700, color: "#fb923c", textTransform: "uppercase", letterSpacing: 3 }, drawable(entry.k)) : el("div", {}, ""),
        el("div", { fontSize: size, fontWeight: 700, lineHeight: 1.12 }, title),
        entry.s ? el("div", { fontSize: 30, color: "#c4b5fd", lineHeight: 1.3 }, drawable(entry.s)) : el("div", {}, "")
      ]),
      el("div", { fontSize: 26, color: "#a78bfa", justifyContent: "space-between" }, [el("div", {}, "inspirella.ch"), el("div", {}, "Schweizer Bildung, klar erklärt")])
    ]
  );
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: fonts! });
  const png = Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng());
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(key, png);
  return png;
}
