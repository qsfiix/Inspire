Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать архитектуру продукта как связку пользовательского опыта, качественных данных, персонализации и низко-хаотичной информационной архитектуры.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../../04_Development/Folder Structure.md
- ../../04_Development/Environment Variables.md
- ../../04_Development/Testing.md
- Target Product Model.md

# Product Architecture

## Архитектурное ядро

Inspirella строится вокруг трёх опор:

1. **Персонализация** — система понимает контекст человека и помогает выбрать путь.
2. **Высокое качество данных** — рекомендации и discovery опираются на проверяемые источники.
3. **Низко-хаотичная информационная архитектура** — сложный мир образования превращается в ясные сущности, связи и следующие шаги.

## Слои

```text
Experience layer
  Home / Onboarding / Dashboard / Map / Resources / Tracker
Product orchestration
  Profile flow / Discovery / Recommendation / Progress
Decision layer
  EducationEngine / trust / ranking / explanation
Data access layer
  Repository / adapters / normalization / cache
Data foundation
  institutions / programs / professions / resources / sources / profiles
Infrastructure
  Express / Supabase / Mapbox / Gemini / environment
```

## Current vs target

Текущий snapshot частично объединяет orchestration и shell в `App.tsx`, а часть data loading вызывается прямо из features. Целевая архитектура постепенно переносит эти обязанности в typed services и domain modules, не требуя преждевременного enterprise-разбиения.

## Поток решения

1. Пользователь задаёт контекст.
2. Profile service нормализует его.
3. Repository получает записи, разрешённые quality/publication policy.
4. Engine рассчитывает candidates и причины.
5. UI показывает limited shortlist, evidence и next step.
6. Пользователь сохраняет интерес/цель и продолжает путь.

## Архитектурные запреты

- UI не содержит секретов и прямых SQL-запросов.
- AI не является заменой canonical data.
- `schools` не создаётся как вторая равноправная canonical сущность.
- Product screen не должен напрямую знать структуру raw import record.
- Новая фича не должна silently менять data model.
