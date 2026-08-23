Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: спроектировать короткий onboarding, который собирает достаточно контекста для персонализации и не перегружает пользователя.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Auth Requirements.md
- ../Backend/Profile Processing Logic.md
- ../Screens/Auth and Onboarding Screens.md

# Onboarding UX

## Onboarding promise

Explain why each question matters: «Это помогает сузить варианты, но не ограничивает ваш путь».

## Steps

1. Language and preferred experience.
2. Current educational/professional stage.
3. Interest areas.
4. Goals.
5. Optional canton/language region.
6. Review and consent to personalization.

## UX rules

- one decision per step;
- progress visible;
- back/edit available;
- accessible multi-select;
- no forced psychological label;
- save draft safely;
- show what happens after completion.

## Failure/edge states

A user can skip optional context, recover after refresh, continue as guest where allowed and understand that sparse input creates broader/less confident results.
