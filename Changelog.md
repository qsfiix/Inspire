Status: Canonical
Owner: Sofiia
Last Updated: 2026-09-11
Purpose: хронологический журнал заметных изменений в проекте Inspirella (код, документы, данные), чтобы человек и будущие ИИ-агенты могли быстро понять, что и когда менялось, не поднимая весь git log.
Related Files:
- ./Decisions.md
- ./Readme.md
- ./02_Product_Fill_Report.md
- ./02_Product/Backend/Prototype Limitations.md

# Changelog

## Зачем нужен этот файл

`Changelog.md` фиксирует **что изменилось** — по датам, коротко, по-человечески.
Это не замена `git log`: сюда попадают только изменения, о которых стоит помнить при следующей сессии (новый слой кода, смена архитектурного подхода, крупная чистка, важный документ).

Причины и обоснования решений — в `Decisions.md`, не здесь.

## Формат записи

```
## YYYY-MM-DD — короткий заголовок
- что изменилось;
- зачем (1 строка, если не очевидно);
- затронутые файлы/области.
```

Новые записи добавляются сверху (последняя дата — первая в файле).

---

## 2026-09-11 — Trust/quality data layer + зачистка AI Studio следов

- Закоммичен ранее не зафиксированный рефакторинг data layer (ветка `data-layer-trust-refactor`, поверх baseline `d2281fc`):
  - добавлен `Inspirella_code_AI.Studio/src/lib/` (`validation.ts`, `quality.ts`, `localized.ts`) — общие хелперы для проверки identity/координат, канонического quality-состояния (`verified/usable/provisional/review_needed/draft/archived`) и безопасного доступа к мультиязычным полям;
  - `data/Repository.ts` переработан: нормализация строк Supabase через эти хелперы, запись без стабильного id/title отбрасывается вместо генерации случайного id, отслеживание `incompleteFields`, поле `dataOrigin` (`cloud`/`static`) на каждой записи;
  - `types.ts` расширен (`RecordProvenance`, `DataOrigin`, `incompleteFields`);
  - `MapboxMap.tsx`, `dashboard.tsx`, `App.tsx`, `data.ts`, `localMockDB.ts`, `seedData.ts` обновлены под новые поля.
- Убраны остаточные следы Google AI Studio, не являющиеся частью реального продукта:
  - `.env.example` — комментарии про "Secrets panel in the AI Studio UI" и "Cloud Run" заменены на нейтральное описание;
  - `server.ts` — User-Agent Gemini-запроса `"aistudio-build"` → `"inspirella-server"`;
  - `vite.config.ts` — переписан комментарий про `DISABLE_HMR` (ранее содержал упоминание AI Studio и повреждённые символы);
  - удалён `metadata.json` (экспорт-манифест AI Studio, нигде не использовался в коде);
  - удалён случайный `src/Inspirella.code-workspace`.
- `MapboxMap` теперь получает `accessToken`/`styleUrl` явно из runtime-конфига (`02_Product/Backend/Prototype Limitations.md`, пункт 9 закрыт):
  - `supabaseClient.ts` — `/api/config` теперь также читает `mapboxAccessToken`/`mapboxStyleUrl` и кеширует результат (не перезапрашивает конфиг на каждый вызов `fetchSupabaseConfig()`);
  - `App.tsx` — передаёт значения в `<MapboxMap>` вместо пустых props.
- См. `Decisions.md` — запись от 2026-09-11 про объём коммита и что осознанно не тронуто (Supabase CSV backups).

---

## 2026-09-11 — Реальное подключение к Supabase заработало сквозным образом

Найдено и исправлено при проверке живого соединения с базой (сервер запускался локально, проверка шла через `/api/config` и сетевые запросы, `.env` не открывался):

- **`SUPABASE_URL` содержал лишний `/rest/v1/` в конце** — ломал каждый REST-запрос и realtime-websocket (404 "Invalid path specified"). Значение поправлено Sofiia в `.env`. Диагностика осложнилась тем, что dev-сервер перезапускает только внутренний Vite middleware при изменении `.env`, а не сам Node-процесс — понадобился полный `preview_stop`/`preview_start`, чтобы подхватить исправление.
- **Несоответствие схемы колонок в `data/Repository.ts`** (коммит `fdbb2a6`, ветка `data-layer-trust-refactor`): реальные таблицы `institutions`/`resources`/`professions` хранят мультиязычный текст как отдельные колонки на язык (`title_de/fr/it/en`, `summary_de`, ...), а не как единое поле `title`/`description`. Парсеры искали только единое поле, из-за чего почти все строки отбрасывались (у professions вообще не было `title`/`name`, у resources — `url`, был только `official_url`). Добавлены хелперы `pickLocalizedText`/`pickPlainText`, поддерживающие суффиксную схему с fallback на старую логику.
- Поля без соответствующей колонки в реальной схеме (`salaryCHF`, `establishedYear`, `studentCount`, `tags`, `skillsRequired`, `isFederal` и др.) сознательно оставлены `undefined`, а не придуманы/выведены из текстовых заметок — по правилу "никогда не изобретать данные".

**Результат подтверждён сквозной проверкой в браузере:** 108/114 реальных institutions на карте, реальные немецкоязычные professions (напр. "Maschinenbauingenieur/in") в рекомендациях EducationEngine, ~20 реальных resources из Supabase вперемешку с curated-статикой.

Также по пути найдены и исправлены два независимых бага (коммит `0f8cac3`):
- `MapboxMap.tsx` блокировал собственный Mapbox-стиль пользователя из-за проверки на подстроку `"qsfiix"` (это оказался её username в Mapbox) — убрано.
- `supabaseClient.ts` создавал несколько экземпляров Supabase-клиента при параллельных вызовах `fetchSupabaseConfig()` ("Multiple GoTrueClient instances") — исправлено общим in-flight promise.

---

## 2026-09-11 — Pre-launch hardening: rate limiting + настоящая авторизация

Готовим проект к деплою на Railway и первым живым пользователям (решение выбрать Railway — см. `Decisions.md`). Закрыты первые два критичных пункта из pre-launch аудита:

- **`/api/gemini/advisor` защищён** (коммит `fb58173`): `app.set("trust proxy", 1)` (иначе за прокси Railway все посетители делили бы один rate-limit bucket), in-memory rate limiter (5 запросов / 10 минут на IP — небольшой локальный Map вместо новой зависимости, по `04_Development/Dependencies.md`), `express.json({ limit: "50kb" })` + санитизация полей запроса, структурированный JSON error handler (дефолтная Express-страница ошибки утекала stack trace и локальный путь к файлу при 413 "payload too large" — теперь чистый JSON).
- **Настоящая авторизация через Supabase Auth** (коммит `e155696`): `LoginView` получил переключатель Create Account/Sign In, поле пароля, честный экран "Check your inbox" при email-confirmation, баннер ошибок (перемещён к кнопке отправки — иначе не виден без скролла вверх). `Repository.ts` получил `signUp`/`signIn`/`signOut`. Guest bypass не тронут, остаётся явным local-only режимом.
  - Проверено на реальном (тестовом, одноразовом) аккаунте: регистрация создаёт настоящего Supabase-пользователя, email-confirmation экран показывается честно, неверный пароль/email показывают реальную ошибку Supabase.
  - По пути найден и исправлен баг: кнопка "Sign In" на экране подтверждения email не возвращала к форме (не сбрасывала `pendingConfirmationEmail`).
  - **Таблицы `profiles` в Supabase пока нет** (проверено live REST-запросом — 404 "Could not find the table"). Аккаунт (identity) теперь настоящий, но содержимое профиля пока не синхронизируется между устройствами. SQL для таблицы — у Sofiia (создание БД она делает сама).
- См. `02_Product/Backend/Prototype Limitations.md` — пункты 3, 4, 6, 9 отмечены закрытыми.

---

## 2026-09-12 — Прямой доступ к Supabase (MCP): RLS-фиксы и схема `profiles`

Sofiia подключила Supabase MCP — прямой доступ к базе (список таблиц, RLS-политики, advisors, миграции). Обнаружено: база выросла намного больше, чем предполагал код приложения — появились настоящие `profiles`, `profile_interests`, `profile_goals`, `profile_target_languages`, `profile_target_cantons`, `tracker_goals`, `tracker_items`, `saved_items`, `recommendation_feedback` с в целом корректными RLS (`auth.uid() = profile_id`). Полная структура — в памяти `inspirella-supabase-schema`.

**RLS/security фиксы (миграции применены через Supabase MCP):**
- `institutions` — было 3 дублирующие SELECT-политики (2 из них `qual: true`, из-за чего draft/неактивные/непроверенные записи были публично читаемы). Заменены одной политикой, повторяющей trust-фильтр из `public_institutions_map_view`.
- 3 VIEW (`public_institutions_map_view`, `public_institution_locations_view`, `legacy_schools_compat_view`) были `SECURITY DEFINER` (ERROR по Supabase advisor, полностью обходит RLS) — переключены на `security_invoker = true`.
- `rls_auto_enable()` (служебная функция для event trigger) была доступна анонимам через RPC — revoked.
- 8 функций без фиксированного `search_path` (WARN) — исправлено.
- **Не исправлено, флагнуто Sofiia**: leaked password protection выключена (настройка Auth в дашборде, не SQL); `citext` extension в public schema (рискованно двигать — от неё зависит `profiles.email`); unindexed FK / unused/duplicate indexes — performance-only, отложено (таблицы почти пустые).

**Критичный баг найден и исправлен**: `Repository.ts`'s `getProfile`/`saveProfile` писали/читали колонки, которых физически нет в реальной схеме `profiles` (`interests`, `goals`, `language`, `onboarding_complete`, `preferred_canton`, `target_language_region` — на самом деле это `full_name`, `interface_language_code`, `onboarding_status`+`onboarding_completed_at`, и отдельные нормализованные таблицы `profile_interests`/`profile_goals`/`profile_target_languages`/`profile_target_cantons`). Каждое сохранение профиля тихо падало (column does not exist, перехватывалось try/catch) — почти наверняка та самая "проблема с RLS", о которой сообщила Sofiia. Переписано на правильный маппинг колонок + delete-then-insert для дочерних таблиц.

Проверено: CHECK-constraints на всех задействованных полях (`onboarding_status`, `interface_language_code` и т.д.) — все используемые значения валидны. Полный живой прогон через подтверждённую сессию не делал (подтверждение email через SQL запрещено классификатором безопасности Claude Code — не обходил), вместо этого прогнал регрессию на guest-режиме и публичном чтении institutions/map — всё чисто.

**Ещё не сделано** (возможно теперь благодаря новым таблицам): cloud-персистентность трекеров (`tracker_goals`/`tracker_items` готовы, но `Repository.getTrackers/saveTrackers` всё ещё только `localStorage`); UI для `saved_items` (сохранённые institutions/professions) и `recommendation_feedback` (лайк/дизлайк рекомендаций) вообще не существует — таблицы готовы, фичи нет.

---

## Как использовать этот файл дальше

- Одна содержательная сессия работы = обычно одна запись (не одна запись на каждый маленький commit).
- Если в сессии было архитектурное решение с альтернативами — короткая ссылка сюда, полное обоснование в `Decisions.md`.
- Не дублировать содержимое `02_Product/*` — там живёт целевое состояние продукта, здесь — история того, что реально произошло.
