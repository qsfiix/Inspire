Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить требования к персональным рекомендациям, объяснимости, trust, ranking и ограничению AI.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../API/Recommendation API Contract.md
- ../Backend/Recommendation Engine.md
- ../UX/Personalization UX.md
- ../UX/Decision Support UX.md

# Recommendation Requirements

## Functional requirements

1. Recommendation uses explicit profile context.
2. It returns a limited shortlist rather than an endless feed.
3. Each item has match reasons.
4. Each critical fact has evidence/source context.
5. User can inspect alternatives and continue discovery.
6. Missing data lowers confidence and changes copy.
7. Recommendation can be recalculated after profile changes.
8. A recommendation can lead to an actionable next step.

## Quality requirements

- verified/publication policy applied before ranking;
- deterministic baseline available without Gemini;
- scores are not presented as probability or verdict;
- no recommendation based solely on a single keyword;
- candidate and source IDs are traceable;
- language fallback does not change factual meaning.

## AI boundary

Gemini may produce a human-friendly explanation from selected records. It must not invent candidate records, override trust states or silently change ranking. Any future generative ranking requires a separate review and evaluation plan.
