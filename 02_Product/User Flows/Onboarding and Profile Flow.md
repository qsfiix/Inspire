Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать создание, изменение и использование profile context для персонализации.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../API/Profile API Contract.md
- ../UX/Onboarding UX.md
- ../Requirements/Auth Requirements.md

# Onboarding and Profile Flow

## Flow

1. Start as guest or authenticated user.
2. Collect language, stage, interests and goals.
3. Offer optional region/language context.
4. Show review of selected values.
5. Save local draft or cloud profile according to session.
6. Mark onboarding complete only after valid minimum.
7. Use profile for recommendations.
8. Let user edit preferences and recalculate path.

## Ownership

Guest profile is temporary; authenticated profile belongs to current user. Conversion must be explicit and conflict-safe.

## Safety

No hidden psychotype, no irreversible label, no silent data sharing, no fabricated completion state.
