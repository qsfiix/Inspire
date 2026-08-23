Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать последовательность входа и первичного профилирования без лишнего сбора данных.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Auth Requirements.md
- ../UX/Onboarding UX.md
- ../User Flows/First-Time User Flow.md

# Auth and Onboarding Screens

## Auth screen

- clear value proposition;
- name/email or provider auth according to final implementation;
- guest option with visible limits;
- privacy/help link;
- inline validation and recovery.

## Onboarding screens

Step 1: language and basic stage.

Step 2: areas of interest.

Step 3: goals and optional regional/language preference.

Step 4: review, explain how answers shape recommendations, and complete.

## Rules

- progress indicator shows total steps;
- user can go back without losing answers;
- no manipulative forced certainty;
- options use plain language and localized labels;
- optional fields are clearly optional;
- completion state leads directly to dashboard.

## Current implementation

`LoginView` and `OnboardingView` exist in `src/features/auth.tsx`; actual auth persistence remains prototype/local-first and must be aligned with `API/Profile API Contract.md`.
