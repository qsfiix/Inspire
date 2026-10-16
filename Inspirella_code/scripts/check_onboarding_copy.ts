/**
 * Every option label of the onboarding dropdowns and choices must exist in all
 * four languages, otherwise a dropdown shows empty rows. Run: npx tsx scripts/check_onboarding_copy.ts
 */
import { readFileSync } from "node:fs";
import { getOnboardingCopy } from "../src/features/onboardingCopy";

const src = readFileSync("src/features/auth.tsx", "utf8");
const arrays: Record<string, string[]> = {};
for (const m of src.matchAll(/const ([A-Z_]+)(?::[^=]+)? = \[([\s\S]*?)\];/g)) {
  const items = [...m[2].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  if (items.length) arrays[m[1]] = items;
}
// Which template prefix each array is rendered with, read from the JSX.
const prefixes = new Map<string, string>();
for (const m of src.matchAll(/\{([A-Z_]+)\.map\(\s*(\w+)\s*=>[\s\S]{0,400}?c\[`(\w+?)_\$\{\2\}`\]/g)) prefixes.set(m[1], m[3]);

let missing = 0;
for (const lang of ["en", "de", "fr", "it"]) {
  const c = getOnboardingCopy(lang);
  for (const [name, prefix] of prefixes) {
    for (const item of arrays[name] ?? []) {
      const key = `${prefix}_${item}`;
      if (!c[key] || !c[key].trim()) {
        console.log(`MISSING ${lang} ${key} (from ${name})`);
        missing++;
      }
    }
  }
}
console.log(`checked ${[...prefixes].map(([n, p]) => `${n}->${p}_*`).join(", ")}; missing: ${missing}`);
process.exit(missing ? 1 : 0);
