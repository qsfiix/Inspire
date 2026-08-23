Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать экран, на котором пользователь понимает рекомендованный путь, причины, evidence и следующий шаг.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Recommendation Requirements.md
- ../UX/Decision Support UX.md
- ../../04_Development/Definition of Done.md

# Advisor Report Screen

## Purpose

Преобразовать ranking в спокойное объяснение, а не в AI verdict.

## Layout

1. Header: «Your possible path»/localized equivalent and engine state.
2. Profile context chips: stage, interests, goal.
3. Primary path focus.
4. Next best step as the dominant action.
5. Shortlist sections: professions, institutions, resources.
6. Each card: title, why it fits, quality/status, source link, alternative action.
7. Limitations/what to verify.

## States

- loading: explain that structured data is being checked;
- success: show evidence and next step;
- empty: ask one clarifying question or open general discovery;
- error: preserve profile and offer retry/fallback;
- provisional: visible caution label;
- guest: explain what is temporary.

## Current implementation

`AdvisorReport.tsx` already presents rule-based solver, score and match reasons. The next improvement is to make quality/evidence more prominent and reduce technical jargon such as `RULE-BASED SOLVER` when it does not help the user.
