Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: объединить product-facing требования к качеству, provenance, freshness, privacy и честной коммуникации данных.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../UX/Trust UX.md
- ../API/AI Interaction Contract.md

# Trust and Data Requirements

## Trust requirements

- Every public record has a quality/publication state.
- Critical fields have source provenance.
- Freshness is tracked where the fact can change.
- Conflicting values are not silently merged without a rule.
- User can reach the official source for consequential details.
- Recommendation explains data limitations.
- Invalid records never appear as trusted choices.

## Data requirements

Canonical names: `institutions`, `programs`, `professions`, `resources`, `sources`, `profiles`. Legacy/import layers may exist but must be labeled. Controlled values are preferred for types, statuses, countries and languages.

## Privacy requirements

- Minimize personal data collection.
- Keep secrets outside repository and prompts.
- Enforce user ownership with server/RLS.
- Avoid sensitive psychological inference by default.
- Plan consent, retention and deletion before real minor users.

## UX requirements

Trust is visible but not overwhelming: badges, source links, reviewed/freshness context and uncertainty copy appear near the relevant decision.
