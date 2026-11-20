// For every provider in gap_providers.json, read one offer page on berufsberatung.ch and keep
// the provider's display name, place(s) with canton and website. Then match the name again
// against the institutions table. Output: providers_detail.json
// Usage: node fetch_providers.js   (public pages + public Supabase key, no secrets)
const fs = require('fs');
const KEY = 'sb_publishable_IqGPxiQGwhUQWdL9PYmcIQ_Jnv_HwVz';
const REST = 'https://wfsffzkoaxilirvylswu.supabase.co/rest/v1/';
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set(['und', 'der', 'die', 'das', 'des', 'fur', 'fuer', 'ecole', 'schule', 'the', 'and', 'von', 'de', 'la', 'le', 'du', 'et', 'ag', 'gmbh', 'sa', 'schweiz', 'suisse', 'ch']);
const tokens = s => new Set(norm(s).split(' ').filter(t => t.length > 1 && !STOP.has(t)));

async function all(path) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(REST + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Range: `${from}-${from + 999}` } });
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}
const unesc = s => s.replace(/\\u0026/g, '&').replace(/\\"/g, '"');

async function one(g) {
  try {
    const html = await (await fetch(g.sample, { headers: { 'User-Agent': 'Mozilla/5.0 (Inspirella data check)' } })).text();
    const raw = html.replace(/\\\\"/g, '\\"');
    const sub = raw.match(/\\"subtitle\\":\\"([^\\]+)\\"/);
    const locs = [...raw.matchAll(/\\"label\\":\\"([^\\]+?\([A-Z]{2}\))\\"/g)].map(m => m[1]);
    const urls = [...raw.matchAll(/\\"url\\":\\"(https?:[^\\]+)\\"/g)].map(m => m[1]).filter(u => !/berufsberatung|sdbb|admin\.ch|facebook|instagram|linkedin|youtube/.test(u));
    let site = '';
    try { site = urls.length ? new URL(urls[0]).origin : ''; } catch {}
    return { ...g, name: sub ? unesc(sub[1]) : '', places: [...new Set(locs)].slice(0, 6), site };
  } catch (e) {
    return { ...g, error: String(e) };
  }
}

(async () => {
  const gaps = JSON.parse(fs.readFileSync('gap_providers.json', 'utf8'));
  const insts = await all('institutions?select=slug,title_de,name,city,official_homepage_url,website_url');
  const instTok = insts.map(i => ({ t: tokens(i.title_de || i.name), title: i.title_de || i.name, host: [i.official_homepage_url, i.website_url].filter(Boolean).map(u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }) }));
  const out = [];
  for (let i = 0; i < gaps.length; i += 6) {
    out.push(...(await Promise.all(gaps.slice(i, i + 6).map(one))));
    if (i % 120 === 0) process.stdout.write(`${i} `);
  }
  for (const r of out) {
    const t = tokens(r.name || r.provider.replace(/-/g, ' '));
    let best = 0, bestTitle = '';
    for (const i of instTok) {
      let n = 0;
      for (const x of t) if (i.t.has(x)) n++;
      const s = t.size ? n / Math.max(t.size, i.t.size) : 0;
      if (s > best) { best = s; bestTitle = i.title; }
    }
    const host = r.site ? new URL(r.site).hostname.replace(/^www\./, '') : '';
    r.sameHost = host ? (instTok.find(i => i.host.includes(host)) || {}).title || '' : '';
    r.match = Math.round(best * 100);
    r.bestTitle = bestTitle;
  }
  fs.writeFileSync('providers_detail.json', JSON.stringify(out, null, 1));
  const fresh = out.filter(r => !r.sameHost && r.match < 70);
  console.log(`\nfetched ${out.length}; not in DB (no same website, name match < 70%): ${fresh.length}; of these with federal-qualification offers: ${fresh.filter(r => r.qualOffers).length}`);
})();
