# berufsberatung.ch sync

Sofiia's reference: berufsberatung.ch (~1550 professions in the public sitemap) is the most trusted source for Swiss school pupils. We periodically compare our catalog against it.

1. `node compare_sitemap.js` -> `missing_slugs.txt` (candidates; fuzzy matching, so review).
2. For each candidate download `https://www.berufsberatung.ch/de/berufe/<slug>`, have agents paraphrase in their own words (never copy), QA for overlap, then load with category + 6-step path (see Changelog 2026-10 entries for the pattern).
Descriptions must be paraphrased (plagiarism).
