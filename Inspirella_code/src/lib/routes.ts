/**
 * The app's pages and their addresses. Real paths (not "#/...") so every section is an address search engines can follow.
 * Pages that already exist as static HTML (about, legal) are not app routes: they are normal links.
 */

export const TAB_PATHS: Record<string, string> = {
  home: "/",
  pathmap: "/pathmap/",
  resources: "/ressourcen/",
  map: "/karte/",
  dashboard: "/dashboard/",
  tracker: "/tracker/",
  profile: "/profil/",
  contact: "/kontakt/",
  login: "/login/",
  onboarding: "/onboarding/"
};

/** Pages served as static HTML: opening them is a full page load, not an app transition. */
export const STATIC_TAB_PATHS: Record<string, string> = {
  about: "/ueber-inspirella/",
  privacy: "/datenschutz/",
  impressum: "/impressum/"
};

export const PUBLIC_TABS = ["home", "pathmap", "resources", "contact", "login"];
export const PROTECTED_TABS = ["dashboard", "map", "tracker", "profile"];

/** Address of a tab, whichever kind it is. */
export function pathForTab(tab: string): string {
  return TAB_PATHS[tab] ?? STATIC_TAB_PATHS[tab] ?? "/";
}

const normalise = (p: string) => (p.endsWith("/") ? p : p + "/");

/** The tab for an address (path first, then the old "#/tab" form), or null when it is not an app address. */
export function tabFromLocation(loc: Pick<Location, "pathname" | "hash"> = window.location): string | null {
  const path = normalise(loc.pathname);
  const byPath = Object.entries(TAB_PATHS).find(([, p]) => p === path);
  if (byPath) return byPath[0];
  const legacy = loc.hash.match(/^#\/([a-z]+)/);
  if (legacy && (legacy[1] in TAB_PATHS)) return legacy[1];
  return null;
}
