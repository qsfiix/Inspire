Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить, как показывать provenance, verified state, freshness, limitations и privacy в момент принятия решения.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Trust and Data Requirements.md
- ../Design System/Interaction States.md
- ../API/AI Interaction Contract.md

# Trust UX

## Trust layers

1. Source identity — откуда запись.
2. Verification/publication state — насколько её можно использовать.
3. Freshness — когда проверялась.
4. Relevance — почему она показана этому пользователю.
5. Limitation — что нужно проверить самостоятельно.

## Placement

Trust information appears near the institution/resource/recommendation, not only on a separate legal page. Details can use progressive disclosure.

## Copy examples

- «Проверено по официальному источнику».
- «Данные требуют дополнительной проверки».
- «Требования могут измениться — откройте официальный сайт».
- «Эта подборка основана на выбранных вами интересах и цели».

## Privacy

Tell users what profile inputs influence recommendations. Do not hide personalization behind vague «AI magic».
