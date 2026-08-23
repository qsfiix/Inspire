Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить требования к первому полезному экрану после onboarding: ясный обзор человека, возможностей и следующего действия.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Architecture/MVP Scope.md
- ../Screens/Dashboard Screen.md
- ../UX/Decision Support UX.md

# Dashboard Requirements

## Dashboard job

Dashboard отвечает на вопрос: «Где я сейчас в своём образовательном поиске и что сделать дальше?»

## Must-have

- personalized greeting without overclaiming;
- current path focus;
- next best step with action;
- small shortlist of recommendations;
- visible evidence/quality context;
- progress/active tracker summary;
- quick access to map, resources and profile;
- loading, empty, error and local fallback states.

## Quality bar

Пользователь понимает главное за один взгляд. Карточки не превращаются в каталог. Если recommendation unavailable, dashboard объясняет причину и предлагает discovery/resources.

## Current implementation

`DashboardView` уже показывает education explorer, advisor report, levels and data sections. Следующая работа — сверить hierarchy с MVP и не добавлять новые panels без user problem.
