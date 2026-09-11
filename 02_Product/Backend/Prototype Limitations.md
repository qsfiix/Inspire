Status: Working
Owner: Sofiia
Last Updated: 2026-09-11
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
3. ~~Login создает local profile и не реализует полноценную Supabase sign-in/sign-up.~~ **Закрыто 2026-09-11** — см. раздел «Закрытые ограничения».
4. ~~Guest bypass заполняет demo-profile и должен быть отделён от real user.~~ **Закрыто 2026-09-11** — реальные пользователи теперь идут через Supabase Auth, guest остаётся явным local-only bypass.
5. Trackers сохраняются через localStorage; Supabase persistence отмечена TODO.
6. ~~`getProfessions()` возвращает пустой fallback без реального dataset.~~ **Закрыто 2026-09-11** — причиной был не отсутствующий dataset, а рассинхрон column mapping с реальной Supabase-схемой; см. раздел «Закрытые ограничения».
7. `DataRepository` использует `any` и несколько naming aliases.
8. `getInstitutions()` пробует `institutions`, затем `schools`, что полезно для миграции, но не является финальной моделью.
9. ~~`MapboxMap` получает optional token/style props, а `App.tsx` их не передаёт явно.~~ **Закрыто 2026-09-11.**
10. `/api/config` отдаёт набор runtime values целиком и требует строгого whitelist-а.
11. Gemini endpoint существует, но основной `AdvisorReport` сейчас использует local rule-based engine.
12. ~~`package-lock.json` сохраняет старое имя `react-example`.~~ Уже не так — `package.json`/`package-lock.json` называются `inspirella`.
13. Некоторые файлы и ссылки имеют различный регистр (`Readme.md` vs `README.md`).
14. Есть случайные `Math.random()` IDs для records/tracker display.
15. 02_Product ранее отсутствовал как заполненная спецификация; текущий пакет является первым draft.

## Закрытые ограничения

### Login/Guest (пункты 3, 4) — 2026-09-11

`LoginView` теперь предлагает настоящую регистрацию/вход через Supabase Auth (email + пароль, с переключателем Create Account / Sign In), а не создаёт local-only профиль под видом аккаунта. `data/Repository.ts` получил `signUp`/`signIn`/`signOut`. Обрабатывается кейс email-confirmation (Supabase возвращает user без session) честным экраном "Check your inbox", а не молчаливым провалом. Guest bypass не изменился — остаётся явным local-only режимом без иллюзии сохранности данных.

Важная оговорка: таблица `profiles` в Supabase пока не создана (проверено live REST-запросом). Аккаунт (identity) теперь настоящий и переживёт очистку браузера, но содержимое профиля (interests/goals/onboarding) пока не синхронизируется между устройствами, пока таблица не создана — `saveProfile` в этом случае просто продолжает работать local-first, ничего не ломается.

### getProfessions() / column mapping (пункт 6) — 2026-09-11

Причина пустого результата была не в отсутствии static fallback, а в том, что `Repository.ts` искал колонки `title`/`name`/`description`/`url`, а реальная Supabase-схема хранит мультиязычный текст в суффиксных колонках (`title_de/fr/it/en` и т.д.), и у `resources` URL лежит в `official_url`, а не `url`. Добавлены `pickLocalizedText`/`pickPlainText` в `Repository.ts`. Проверено на живой базе: 108/114 институций на карте, реальные немецкоязычные professions в рекомендациях.

### MapboxMap token/style (пункт 9) — 2026-09-11

`App.tsx` теперь читает `mapboxAccessToken`/`mapboxStyleUrl` из `/api/config` (через `supabaseClient.ts`) и передаёт их в `<MapboxMap>`. Заодно найден и убран баг: код исключал стиль, если URL содержал `"qsfiix"` — это оказался собственный username пользователя в Mapbox, так что реальный стиль никогда не подключался.

### Rate limiting / input validation для `/api/gemini/advisor` — 2026-09-11

Backend Overview.md называет `rate limits, validation, audit metadata` частью quality bar — этого не было. Добавлен in-memory rate limiter (5 запросов / 10 минут на IP), ограничение размера payload (`express.json({ limit: "50kb" })`), санитизация полей запроса, и структурированный JSON error handler вместо дефолтной Express HTML-страницы с stack trace/путём к файлу.

## Как трактовать

Ограничение — это не причина переписать всё. Агент должен сначала подтвердить воспроизводимость проблемы, предложить минимальный change block и проверить, не ломает ли он fallback и пользовательский путь.

## Что нельзя делать автоматически

- мигрировать таблицы без schema review и backup;
- удалять local fallback только потому, что Supabase подключён;
- включать Gemini в пользовательский flow без grounding contract;
- исправлять десятки названий и ссылок одним огромным неревьюемым commit;
- считать visual polish доказательством product readiness.
