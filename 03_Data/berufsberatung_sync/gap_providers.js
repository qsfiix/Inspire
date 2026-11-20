// Gap analysis against berufsberatung.ch's "Aus- und Weiterbildungen" section (public sitemap).
// Usage: node gap_providers.js   (Node 18+, public Supabase publishable key, no secrets)
// Writes: gap_qualifications.json (offer slugs that look like federal qualifications, not in the catalog)
//         gap_providers.json      (education providers whose name does not match any institution)
const fs = require('fs');
const KEY = 'sb_publishable_IqGPxiQGwhUQWdL9PYmcIQ_Jnv_HwVz';
const REST = 'https://wfsffzkoaxilirvylswu.supabase.co/rest/v1/';

async function all(path) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(REST + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Range: `${from}-${from + 999}` } });
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = s => new Set(norm(s).split(' ').filter(t => t.length > 2 && !['und', 'der', 'die', 'das', 'des', 'fur', 'fuer', 'ecole', 'schule', 'the', 'and', 'von', 'de', 'la', 'le', 'du', 'des', 'et'].includes(t)));

(async () => {
  const sm = await (await fetch('https://www.berufsberatung.ch/sitemap.xml')).text();
  const urls = [...sm.matchAll(/<loc>https:\/\/www\.berufsberatung\.ch(\/de\/[^<]+)<\/loc>/g)].map(m => m[1]);
  const berufe = new Set(urls.filter(u => u.startsWith('/de/berufe/')).map(u => u.split('/')[3]));
  const offers = urls.filter(u => u.startsWith('/de/aus-weiterbildungen/')).map(u => u.split('/')).filter(p => p[4]);

  const profs = await all('professions?select=slug,page_slug,title_de');
  const insts = await all('institutions?select=slug,title_de,name,city');
  const profKeys = new Set(profs.flatMap(p => [p.slug, p.page_slug, norm(p.title_de).replace(/ /g, '-')]).filter(Boolean));
  const profTok = profs.map(p => tokens(p.title_de));

  // federal qualifications offered by providers, not on /de/berufe and not in the catalog
  const quals = new Map();
  for (const p of offers) {
    const slug = p[4].replace(/-\d+$/, '');
    if (!/-(hf|bp|hfp|efz|eba)$/.test(slug)) continue;
    if (berufe.has(slug) || profKeys.has(slug)) continue;
    const t = tokens(slug.replace(/-/g, ' '));
    const close = profTok.some(pt => t.size && [...t].every(x => pt.has(x)));
    if (close) continue;
    const q = quals.get(slug) || { slug, providers: [], url: `https://www.berufsberatung.ch/de/aus-weiterbildungen/${p[3]}/${p[4]}` };
    q.providers.push(p[3]);
    quals.set(slug, q);
  }
  fs.writeFileSync('gap_qualifications.json', JSON.stringify([...quals.values()].sort((a, b) => b.providers.length - a.providers.length), null, 1));

  // providers not matching an institution (slug or token overlap of the name)
  const instTok = insts.map(i => ({ t: tokens(i.title_de || i.name), slug: i.slug }));
  const instSlugs = new Set(insts.map(i => i.slug));
  const byProv = new Map();
  for (const p of offers) byProv.set(p[3], [...(byProv.get(p[3]) || []), p[4]]);
  const gaps = [];
  for (const [prov, list] of byProv) {
    if (instSlugs.has(prov)) continue;
    const t = tokens(prov.replace(/-/g, ' '));
    const best = Math.max(0, ...instTok.map(i => { let n = 0; for (const x of t) if (i.t.has(x)) n++; return t.size ? n / t.size : 0; }));
    if (best >= 0.75) continue;
    gaps.push({ provider: prov, offers: list.length, sample: `https://www.berufsberatung.ch/de/aus-weiterbildungen/${prov}/${list[0]}`, qualOffers: list.filter(s => /-(hf|bp|hfp|efz|eba)(-\d+)?$/.test(s)).length, match: Math.round(best * 100) });
  }
  gaps.sort((a, b) => b.qualOffers - a.qualOffers || b.offers - a.offers);
  fs.writeFileSync('gap_providers.json', JSON.stringify(gaps, null, 1));
  console.log(`offers ${offers.length}, providers ${byProv.size}; qualification gaps ${quals.size}; provider gaps ${gaps.length} (with federal-qualification offers: ${gaps.filter(g => g.qualOffers).length})`);
})();
