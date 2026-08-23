Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: объяснить, как настраиваются веса, правила и версии EducationEngine, чтобы ranking был управляемым и проверяемым.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- Recommendation Engine.md
- ../../03_Data/SQL/Quality Rules.md
- ../../04_Development/Testing.md

# Engine Config

## Назначение config

`src/engine/engineConfig.ts` хранит веса trust, demand, alignment, apprenticeship, institution, regional и fallback signals, а также path focus и next-step rules. Config должен быть прозрачным: изменение веса меняет пользовательские рекомендации.

## Правила

1. Вес имеет название, смысл и тестируемое влияние.
2. Trust не должен быть перекрыт декоративным совпадением по словам.
3. Высокий score не означает certainty.
4. Новое правило сопровождается примером профиля и ожидаемым ranking.
5. Config version фиксируется в recommendation response.
6. Country-specific правила не смешиваются с global defaults без явного слоя.

## Текущее поведение

Engine проверяет status/verified, demand, interests, semantic title matches, route type, rating, canton/language region и связь с resources. Если данных для professions нет, engine возвращает пустой список — это должно быть явным состоянием, а не скрытым выдуманным fallback.

## Путь к зрелости

- вынести controlled vocabularies из свободных строк;
- добавить table-driven tests;
- отделить scoring features от UI translation;
- перейти от отдельных special cases (`ethz`, `epfl`, `unisg`) к data-driven relations;
- добавить calibration review на реальных сценариях;
- хранить `engineVersion` в сохранённых recommendations.
