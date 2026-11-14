/**
 * Site themes. "alpen" (Alpenglühen: dawn light, plum ink, coral accent) is the default since 2026-11;
 * "nacht" is the same world at night (moon, stars, moonlit range).
 *
 * Colours come from tokens (text-ink, bg-card, border-line ... see DESIGN.md). About 200 older
 * `isDark` pairs remain; alpen.css section 3 re-skins their light branch until they move to tokens.
 */
export type ThemeName = "alpen" | "nacht";

export const THEME_STORAGE_KEY = "inspirella_theme";

/** Older visits stored "dark" / "light"; both map onto the new names. */
export function readStoredTheme(): ThemeName {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "nacht" || saved === "dark") return "nacht";
  } catch {
    /* blocked storage: default */
  }
  return "alpen";
}

export function storeTheme(theme: ThemeName) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Applied to <html> and <body> so CSS and the first paint (see index.html) agree. */
export function applyThemeToDocument(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("dark-mode", theme === "nacht");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "nacht" ? "#0b0817" : "#d6c4f1");
}
