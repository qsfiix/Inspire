// Compares the professions on berufsberatung.ch (public sitemap) with the Inspirella catalog.
// Usage: node compare_sitemap.js   (needs Node 18+, no secrets: uses the public Supabase publishable key)
// Output: missing_slugs.txt (slugs likely not yet in the catalog) + a summary. Review the list before loading.
const fs = require('fs');
const SUPA = 'https://wfsffzkoaxilirvylswu.supabase.co/rest/v1/professions?select=code,slug,title_de,profession_type&order=code';
const KEY = 'sb_publishable_IqGPxiQGwhUQWdL9PYmcIQ_Jnv_HwVz';
const norm = s => s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/é|è|ê/g,'e').replace(/[^a-z0-9]+/g,' ').trim();
const dbKeys = t => t.split(' / ').map(m => norm(m.replace(/\(.*?\)/g,' ').replace(/\b(mit eidg\.? (fachausweis|diplom)|efz|eba|hf|fh|nds|dipl|bachelorstudium)\b\.?/gi,' ')).replace(/\s+/g,''));
const slugKey = s => s.replace(/-(efz|eba|bp|hfp|hf)$/,'').split('-').filter(t=>!['in','r','innen','login','frau','e','n','euse','iere'].includes(t)).join('');
const typeMap = { efz:'apprenticeship_efz', eba:'apprenticeship_eba', bp:'fachausweis', hfp:'diplom', hf:'hf_diploma' };
const sim = (a,b) => { let l=0; const n=Math.min(a.length,b.length); while(l<n&&a[l]===b[l]) l++; return l/Math.min(a.length,b.length); };
(async () => {
  const sm = await (await fetch('https://www.berufsberatung.ch/sitemap.xml')).text();
  const slugs = [...sm.matchAll(/<loc>[^<]*\/de\/berufe\/([^<\/]+)<\/loc>/g)].map(m => m[1]);
  let db = []; for (let o = 0;; o += 1000) { const j = await (await fetch(SUPA, { headers: { apikey: KEY, Range: `${o}-${o+999}`, 'Range-Unit': 'items' } })).json(); db = db.concat(j); if (j.length < 1000) break; }
  const bySlug = new Set(db.map(d => d.slug));
  const rows = db.map(d => ({ ks: dbKeys(d.title_de), t: d.profession_type }));
  const missing = [];
  for (const s of slugs) {
    if (bySlug.has(s)) continue;
    const suf = (s.match(/-(efz|eba|bp|hfp|hf)$/) || [])[1]; const k = slugKey(s);
    const ok = rows.some(r => (!suf || r.t === typeMap[suf]) && r.ks.some(dk => Math.min(dk.length,k.length) >= 5 && sim(k,dk) >= 0.9 && Math.min(dk.length,k.length)/Math.max(dk.length,k.length) >= 0.6));
    if (!ok) missing.push(s);
  }
  fs.writeFileSync('missing_slugs.txt', missing.join('\n'));
  console.log(`sitemap professions: ${slugs.length}, catalog: ${db.length}, likely missing: ${missing.length} (see missing_slugs.txt)`);
})();
