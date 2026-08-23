Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: зафиксировать модель зрелой Inspirella: персонализированная система поддержки образовательного и карьерного выбора, начинающая со Швейцарии и масштабируемая глобально.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../../00_Brain/Vision.md
- MVP Scope.md

# Target Product Model

## Что строится в долгую

Inspirella должна соединять два пространства:

- мир возможностей: institutions, programs, professions, resources и verified sources;
- мир человека: интересы, цели, stage, предпочтения, progress и постепенно более глубокое понимание потенциала.

Продуктовый результат — не каталог, а поддерживающая траектория: «что мне может подойти», «почему», «какие есть альтернативы» и «что сделать дальше».

## Модель продукта

```text
Person
  → Profile context
  → Interests / goals / constraints
  → Candidate opportunities
  → Explainable recommendation
  → Choice / saved path
  → Next action
  → Progress and feedback
  → Better future personalization
```

## Зрелость персонализации

Персонализация — многолетнее направление развития, а не одна AI-фича. Она должна развиваться слоями: от простого onboarding и controlled preferences к поведению, feedback, качественным сигналам и более глубокому пониманию пользователя. Каждый новый слой требует согласия, объяснимости, privacy и доказательства пользы.

## Масштабирование

Стартовая глубина — Швейцария, включая её многоязычную и dual-track специфику. Архитектура должна позволять добавлять страны через country-specific data/configuration layer, не ломая общий пользовательский путь и не стирая локальные различия.

## Продуктовый принцип

Большая миссия может быть глобальной, но каждое раннее решение должно быть локально проверяемым. Сначала качественная, полезная и честная версия для ограниченного контекста; затем расширение покрытия и глубины.

## Целевое ощущение

Пользователь должен чувствовать не «алгоритм вынес мне вердикт», а «система помогла мне увидеть реальные возможности, понять различия и сделать следующий шаг».
