Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: собрать единый product requirements overview: кому помогает Inspirella, какую проблему решает, что входит в MVP и как измерять полезность.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../01_Strategy/Features.md
- ../../01_Strategy/Prioritization.md
- ../../01_Strategy/Roadmap.md
- ../Architecture/MVP Scope.md

# Product Requirements Overview

## Product mission

Inspirella помогает подросткам и другим пользователям находить свой образовательный и карьерный путь через персонализацию, качественные данные и ясную информационную архитектуру. Проект стартует со Швейцарии и рассчитан на постепенное масштабирование к другим странам.

## Primary audience

- подростки и молодые люди на образовательной развилке;
- люди, сравнивающие academic и vocational routes;
- пользователи и семьи, которым сложно разобраться в многоязычной системе;
- позже — advisors, institutions и education partners.

## Core problem

Возможностей много, но они разрознены, сложны для сравнения и редко связаны с пониманием конкретного человека. Inspirella должна превращать информацию в поддерживающий путь, а не просто выдавать больше ссылок.

## Core loop

```text
Profile context → structured discovery → explainable shortlist → next step → progress → feedback
```

## Product principles

- personalization is the core;
- data quality is a product feature;
- low-chaos architecture beats maximal inventory;
- support beats judgment;
- trust requires visible provenance and limitations;
- MVP is narrow and real, vision is large.

## Success signals for MVP

- пользователь доходит до первого понятного next step;
- может объяснить, почему вариант ему показан;
- открывает official source или сохраняет path;
- возвращается к прогрессу;
- не сталкивается с fabricated facts или misleading certainty.

## Open decisions

- final auth provider flow;
- exact MVP schema in Supabase;
- age/privacy policy for real users;
- whether Gemini enters MVP or remains explanation experiment;
- exact first Swiss canton/data coverage.
