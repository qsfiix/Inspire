Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать детерминированное ядро персонализированной выдачи Inspirella и границы между ranking, trust и AI-объяснением.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Quality Rules.md
- Engine Config.md
- ../API/Recommendation API Contract.md

# Recommendation Engine

## Ценность engine

Engine помогает превратить качественные структурированные данные в ограниченную и объяснимую подборку. Он должен уменьшать хаос, а не создавать магическую непрозрачность.

## MVP pipeline

1. Получить normalized `UserProfile`.
2. Загрузить `professions`, `institutions`, `resources` через Repository.
3. Отфильтровать invalid/unpublished records.
4. Рассчитать score по trust + alignment + route + regional signals.
5. Сформировать match reasons.
6. Выбрать ограниченный shortlist.
7. Связать institution/resource с path context.
8. Выдать nextBestStep.

## Текущая реализация

`EducationEngine.ts` уже содержит отдельные scoring functions для professions, institutions и resources и использует `EngineConfig`. Это хорошая основа для тестируемого доменного слоя, но текущие special cases и свободные строки должны постепенно заменяться canonical relations и controlled values.

## Trust first

Record со статусом `verified`/`official`/`published` получает trust boost; `draft` и `needs_review` должны снижать score или исключаться из public recommendations. При этом verified status должен иметь source trail — один boolean не заменяет provenance.

## Explainability

Каждая рекомендация должна отвечать:

- какие данные профиля совпали;
- какой route/region/language context учтён;
- насколько сильны источники;
- что пользователь должен проверить самостоятельно;
- какой следующий шаг реалистичен.

## Не делать

Не ранжировать пользователя. Не выдавать score как процент успеха. Не создавать recommendation из одного совпадения по слову. Не прятать отсутствие данных за уверенным текстом.
