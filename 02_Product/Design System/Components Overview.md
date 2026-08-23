Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать набор переиспользуемых UI-компонентов и их границы, чтобы дизайн и код развивались согласованно.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- Brand UI Foundations.md
- ../../04_Development/Folder Structure.md
- ../Frontend/Frontend Architecture.md

# Components Overview

## Component groups

| Group | Examples | Responsibility |
|---|---|---|
| Shell | `Navbar`, footer, page container | global navigation and layout |
| Identity | `PhoenixLogo`, avatar, language switcher | brand and user context |
| Discovery | map, institution card, filters, search | explore opportunities |
| Decision support | path focus, match reasons, evidence, next step | explain recommendations |
| Progress | tracker, checklist, progress indicator | turn next step into action |
| Trust | verified badge, source link, freshness label | show data quality |
| Feedback | loading, empty, error, success states | make system state legible |

## Component contract

Каждый reusable component должен иметь typed props, не читать localStorage напрямую и не вызывать Supabase/Gemini напрямую. Сетевой вызов принадлежит service/repository, а component получает state и callbacks.

## Current components

Текущие `Navbar`, `MapboxMap`, `TrackerSystem`, `AdvisorReport` — полезные building blocks. `features/dashboard.tsx` и `features/marketing.tsx` содержат крупные смешанные sections; их можно постепенно дробить по пользовательским блокам, не создавая сотни микрокомпонентов.
