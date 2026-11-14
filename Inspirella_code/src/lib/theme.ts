/**
 * Site themes. "alpen" (Alpenglühen: dawn light, plum ink, coral accent) is the default since 2026-11;
 * "nacht" is the earlier dark violet look with the particle phoenix, kept as an option.
 *
 * Most components still branch on `isDark`: under "alpen" they render their light branch, which
 * alpen.css re-skins to the new palette until each file is migrated to tokens.
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
