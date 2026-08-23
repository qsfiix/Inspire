Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: создать карту ключевых пользовательских потоков и связать их с экранами, требованиями и product value.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Architecture/MVP Scope.md
- ../Screens/Screen Index.md
- ../../01_Strategy/Roadmap.md

# User Flows Overview

## Core flows

1. Marketing → product entry.
2. First-time user → onboarding → first value.
3. Onboarding/profile → personalized context.
4. Recommendation → explanation → next step.
5. Discovery → institution/resource verification.
6. Tracker → action → progress → return.
7. Guest → account conversion.

## Flow quality checklist

- clear entry and exit;
- one primary user goal;
- data and auth assumptions explicit;
- loading/empty/error/offline paths;
- user can go back/edit/leave;
- first value identifiable;
- trust and limitations visible;
- no step depends on an unimplemented future feature.

## Source of truth

This overview connects product intent. Detailed behavior belongs in the individual flow files and current implementation truth belongs in `Architecture/Current Product State.md`.
