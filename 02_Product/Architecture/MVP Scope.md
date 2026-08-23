Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: зафиксировать первую полезную версию Inspirella: узкий, проверяемый пользовательский путь от понимания себя к следующему образовательному действию.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../01_Strategy/Prioritization.md
- ../../01_Strategy/Roadmap.md
- ../Requirements/Product Requirements Overview.md

# MVP Scope

## Формула MVP

MVP Inspirella — это не максимальное количество экранов. Это короткий цикл:

```text
Понять базовый контекст пользователя
  → показать проверенные релевантные возможности
  → объяснить связь
  → дать один реалистичный следующий шаг
```

## Входит в MVP now

1. Public home с ясным объяснением ценности.
2. Guest exploration без риска записать чувствительные данные.
3. Минимальный account/profile flow.
4. Onboarding: язык, stage, interests, goals и при необходимости canton/language region.
5. Dashboard с path focus, next step и короткими recommendation cards.
6. Каталог/map institutions Швейцарии с фильтрами и quality state.
7. Resources с официальными ссылками и source context.
8. Rule-based recommendation engine с match reasons.
9. Простой tracker для превращения next step в действие.
10. Loading/error/empty/offline states и базовая multilingual support.

## Не входит в MVP now

- глобальная база всех стран;
- полноценный psychometric assessment;
- автоматические заявления в учреждения;
- социальная сеть и marketplace;
- сложная геймификация;
- автоматический web scraping без review;
- обещания результата или «идеальной профессии»;
- бесконтрольный AI-оркестратор, меняющий продукт без ревью.

## Критерий первой ценности

Пользователь после onboarding должен увидеть: (а) понятное направление, (б) несколько конкретных вариантов, (в) почему они релевантны, (г) следующий шаг, который можно выполнить без дополнительного исследования хаоса.

## MVP quality bar

- Каждая публичная institution/resource record имеет понятный quality state.
- Рекомендации объяснимы и не основаны только на title matching.
- Пользователь понимает, где факт, где inference, а где suggestion.
- При пустой или недоступной базе интерфейс остаётся честным.
- MVP запускается локально с безопасным `.env` и проходит lint/build.
