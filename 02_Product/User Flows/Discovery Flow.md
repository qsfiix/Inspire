Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать путь пользователя от интереса к конкретному изученному образовательному варианту.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Map Discovery Requirements.md
- ../Screens/Map Exploration Screen.md
- ../UX/Discovery UX.md

# Discovery Flow

## Flow

1. User enters from home, dashboard or recommendation.
2. System preserves relevant profile/filter context.
3. User sees map/list with a limited initial set.
4. User searches or applies controlled filters.
5. User opens institution/program card.
6. UI shows location, type, language, quality and source.
7. User opens official link, saves or returns to alternatives.
8. User may create a tracker action or refine profile.

## Success

User can name at least one concrete option and the reason it deserves further checking.

## Failure paths

No data → broaden/reset filter. Map unavailable → list fallback. Source unavailable → show limitation. User not logged in → allow permitted exploration or explain login requirement.
