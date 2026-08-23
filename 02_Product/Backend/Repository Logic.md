Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: зафиксировать единый data access layer между UI, local fallback, Supabase и canonical model.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../../04_Development/Folder Structure.md
- ../Frontend/Frontend Architecture.md

# Repository Logic

## Ответственность Repository

Repository — единственная точка, через которую feature/engine получают product-shaped data. Он должен скрывать, откуда пришли данные, и возвращать typed normalized records.

## Текущий слой

`src/data/Repository.ts` уже:

- читает profile через local storage и Supabase;
- сохраняет profile local-first и пытается sync authenticated data;
- получает resources, institutions и professions;
- подписывается на Supabase Realtime для resources/institutions/professions;
- преобразует snake_case/camelCase и JSON-like fields;
- использует static fallback.

## Правила целевой реализации

1. Один canonical name: `institutions`.
2. Парсинг raw database rows — внутри adapter, не в UI.
3. Каждый fallback должен иметь источник и статус.
4. Не использовать `Math.random()` как стабильный ID.
5. Возвращать `Result`/typed error state вместо скрытого swallow.
6. Не смешивать user-owned data и public catalog data.
7. Кэш и Realtime должны обновлять одну согласованную модель.
8. Не делать повторный `fetchSupabaseConfig()` без необходимости для каждого вызова.

## Миграционный порядок

Сначала типы и contracts, затем repository tests на fixture rows, затем canonical `institutions`, затем auth/profile ownership, затем trackers и только после этого оптимизация запросов.
