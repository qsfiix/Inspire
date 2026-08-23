Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: собрать явный список ограничений текущего AI Studio snapshot, чтобы агент не принимал demo-поведение за production-ready решение.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Architecture/Current Product State.md
- ../../04_Development/Definition of Done.md
- ../../04_Development/Testing.md

# Prototype Limitations

## Ограничения текущей версии

1. `App.tsx` держит много global state и orchestration.
2. Navigation использует `activeTab`, а не полноценную URL route model.
3. Login создает local profile и не реализует полноценную Supabase sign-in/sign-up.
4. Guest bypass заполняет demo-profile и должен быть отделён от real user.
5. Trackers сохраняются через localStorage; Supabase persistence отмечена TODO.
6. `getProfessions()` возвращает пустой fallback без реального dataset.
7. `DataRepository` использует `any` и несколько naming aliases.
8. `getInstitutions()` пробует `institutions`, затем `schools`, что полезно для миграции, но не является финальной моделью.
9. `MapboxMap` получает optional token/style props, а `App.tsx` их не передаёт явно.
10. `/api/config` отдаёт набор runtime values целиком и требует строгого whitelist-а.
11. Gemini endpoint существует, но основной `AdvisorReport` сейчас использует local rule-based engine.
12. `package-lock.json` сохраняет старое имя `react-example`.
13. Некоторые файлы и ссылки имеют различный регистр (`Readme.md` vs `README.md`).
14. Есть случайные `Math.random()` IDs для records/tracker display.
15. 02_Product ранее отсутствовал как заполненная спецификация; текущий пакет является первым draft.

## Как трактовать

Ограничение — это не причина переписать всё. Агент должен сначала подтвердить воспроизводимость проблемы, предложить минимальный change block и проверить, не ломает ли он fallback и пользовательский путь.

## Что нельзя делать автоматически

- мигрировать таблицы без schema review и backup;
- удалять local fallback только потому, что Supabase подключён;
- включать Gemini в пользовательский flow без grounding contract;
- исправлять десятки названий и ссылок одним огромным неревьюемым commit;
- считать visual polish доказательством product readiness.
