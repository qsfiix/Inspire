Status: Canonical
Owner: Sofiia
Last Updated: 2026-09-13
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

## 2026-09-13 — Объединение Resources/Careers: ресурсы, профессии и институции в одном разделе

Реализована первая крупная архитектурная задача из бэклога ревью сайта (см. предыдущую запись): раздел "Resources" переименован в "Resources & Careers" и объединяет три раньше разрозненных способа находить возможности в Швейцарии.

- **Новый файл** `src/features/resourcesCareers.tsx` — `ResourcesCareersView` с переключателем из трёх вкладок (Web Resources / Professions / Institutions), стилистически как уже существующие category-фильтры.
- **Web Resources** и **Professions** — перенесены без изменения логики из `dashboard.tsx` (`ResourcesView`/`ProfessionsExplorer` физически перемещены в новый файл, `dashboard.tsx` соответственно облегчён — импорт неиспользуемых иконок/хуков подчищен).
- **Institutions — совершенно новое**: раньше институции можно было увидеть только по одной, кликая по точкам на 3D-карте — отдельного поиска не было вообще. Теперь `InstitutionsExplorer` — список+деталка в том же визуальном языке, что и Professions (поиск, фильтр по категории, карточка с полной информацией: канton, статус верификации, год основания, число студентов, язык, admission requirements, контакты). Подключён realtime (`subscribeToInstitutions`).
- **Сравнение институций теперь доступно из двух мест**: `InstitutionsExplorer` использует тот же `InstitutionCompareModal`, что и карта (см. запись от 2026-09-13 про comparison feature) — добавить в сравнение можно и с карты, и из нового поиска, результат идентичен.
- `DashboardView` больше не показывает `ProfessionsExplorer` внизу страницы — карточка "Quick Access → Resources" обновлена ("Search resources, professions & institutions"), что заодно снижает перегруженность dashboard (её саму Sofiia отмечала как отдельную проблему).
- Все новые строки переведены на 4 языка (не только английский).

Живая проверка: переключение между всеми тремя вкладками, поиск+фильтр в Institutions, выбор двух институций и открытие модалки сравнения — сквозной сценарий подтверждён работающим от начала до конца.

---

## 2026-09-13 — Исправления по итогам самостоятельного ревью сайта Sofiia

Sofiia прошлась по сайту вручную и составила список замечаний по каждому разделу (тема, hero, карта, навигация, IA). Из них выбрали и закрыли "честные баги" — без дизайн-споров:

- **Тема по умолчанию** — `App.tsx`: `useState("dark")` → `useState("light")`. Выбор пользователя в localStorage по-прежнему в приоритете.
- **Мёртвая кнопка "View Details"** на 4 карточках "How it Works" (`marketing.tsx`) — раньше это был декоративный текст без обработчика. Теперь каждая карточка кликабельна (`role="button"`, keyboard-доступна) и ведёт в соответствующий раздел (`login`/`map`/`tracker`/`resources`) через уже существующий `handleTabTransition` — то есть ведёт себя так же, как обычная навигация (для незалогиненного гостя это означает переход на логин, как и везде на сайте).
- **3D-карта, три бага одной причины:**
  - *Маленький "квадратик" вместо полной карты* и *пустой серый экран в Immersive Full Screen* — обе проблемы были следствием того, что Mapbox GL не знает о смене размера своего контейнера без явного `map.resize()`, а переключение fullscreen к тому же полностью пересоздавало карту, теряя синхронизацию с `mapEngineLoaded`. Исправлено: `isFullscreen` убран из зависимостей эффекта пересоздания карты; добавлен `ResizeObserver` на контейнер карты, который вызывает `map.resize()` при любом изменении размера (fullscreen, начальная загрузка макета, ресайз окна).
  - *Постоянно мигающие точки* — у каждого(!) маркера была безусловная `animate-ping` обводка (не только у выбранного). При 91 институции и планах на рост базы это создавало визуальный шум. Убрано.
- **Настоящие объёмные 3D-здания** вместо просто наклона камеры — добавлен стандартный слой `fill-extrusion` Mapbox (по официальному рецепту, вставлен под первый symbol-слой, чтобы подписи оставались читаемыми). Код defensively проверяет, что в `composite`-источнике стиля реально есть `vectorLayerIds` содержащий `"building"`, прежде чем добавлять слой — и оборачивает всё в try/catch, чтобы сбой здесь никогда не мешал маркерам институций добавляться. **Важная находка**: текущий кастомный стиль Mapbox Studio (`qsfiix/cmoa4hno4000s01saggmv28ao`) реально содержит в `composite`-источнике только `country_boundaries` — данных о зданиях там нет физически, поэтому слой сейчас безопасно ничего не рисует (без ошибок в консоли). Чтобы увидеть эффект, нужно либо добавить источник "Mapbox Streets" в стиль через Mapbox Studio, либо переключиться на стандартный `dark-v11`/`light-v11`/`satellite-streets-v12` — это решение вне кода, обсудить отдельно.
- **About Us расширен** содержательно (не просто косметика) — добавлены секции Mission, Why It Matters, 4 Core Values (Trust & Verified Data / Deep Personalization / Clarity Over Chaos / Support Not Just Information), честная секция "Where We Are Today" (текущий этап — Швейцария, данные реальные и растущие, часть проверена/часть на проверке — без утверждения, что всё одинаково достоверно) и "Where We're Headed" (видение за пределы Швейцарии). Контент — сжатое изложение `00_Brain/Mission.md` и `Vision.md` для публичной страницы, переведено на все 4 языка (не только английский).

Живая проверка: тема, View Details-навигация, fullscreen, полноразмерная карта на первой загрузке, отсутствие мигания — всё подтверждено вживую в браузере. 3D-здания проверены через прямой доступ к live-инстансу Mapbox (React fiber walk) — слой создаётся корректно и безопасно не активируется, когда данных о зданиях в стиле нет.

---

## 2026-09-13 — Gemini подключён как объяснение поверх Advisor Report (пункт 5 плана)

- `/api/gemini/advisor` (существовал с начала, но был не подключён ни к какому UI) теперь вызывается кнопкой "Explain my recommendation with AI" в `AdvisorReport.tsx`: пользователь явно запрашивает объяснение, оно добавляется ПОВЕРХ уже посчитанного rule-based результата (не заменяет и не переопределяет "Recommended Path Focus"/"Relevant Careers"/"Suggested Institutions" — это разные, дополняющие друг друга блоки).
- Честность при сбое: сервер уже возвращал `isFallback: true` при ошибке Gemini, но это никогда не проверялось на фронтенде. Теперь при `isFallback` показывается явный жёлтый баннер "AI advisor couldn't be reached... this is a generic overview rather than a response tailored to your profile" — вместо того, чтобы выдавать общий текст за персональный ответ.
- Живая проверка: кнопка работает, запрос уходит на `/api/gemini/advisor`, сервер вернул `200` с `isFallback: true` (у ключа Gemini закончились prepayment credits — `RESOURCE_EXHAUSTED`, не связано с кодом), баннер и весь fallback-контент (заголовок, milestones, институты) отрендерились корректно. **Пользователю нужно будет пополнить биллинг на https://ai.studio/projects, чтобы увидеть настоящий персонализированный ответ Gemini** — код готов к этому, но сейчас каждый вызов будет честно показывать generic overview, пока кредиты не пополнены.

---

## 2026-09-13 — Функция сравнения институтов (пункт 4 плана)

- Добавлена первая на сайте возможность сравнить несколько вузов/школ рядом (до 3 одновременно):
  - `components/InstitutionCompareModal.tsx` (новый) — таблица сравнения: кантон, тип, год основания, число студентов, язык, статус верификации, рейтинг, сайт, описание. Честно показывает "Not recorded"/"Nicht erfasst"/... вместо пустой ячейки, когда поля нет в источнике (принцип "never invent data").
  - `components/MapboxMap.tsx` — кнопка "Add to Compare"/"Remove from Compare" в панели деталей институции; плавающий трей внизу карты со счётчиком ("Comparing (N/3)"), чипами выбранных институций и кнопкой "View Comparison"; добавлен нижний отступ у панели деталей, когда трей открыт, чтобы он не перекрывал кнопку.
  - `data.ts` — 17 новых ключей перевода (`compareAdd`, `compareModalTitle`, `compareField*`, ...) на всех 4 языках.
- Место реализации выбрано осознанно: карта — единственное место на сайте, где институции просматриваются по одной (см. `Decisions.md`).
- Живая проверка (браузер, guest-режим): добавление/удаление институции из сравнения, отображение счётчика и чипов, отсутствие визуального перекрытия кнопки треем — подтверждено многократно на реальных кликах по разным институциям (ETH Zürich, USI, Kollegium Spiritus Sanctus Brig, Kollegi Stans, Kalaidos Fachhochschule). Полный прогон с 2 одновременными институциями в открытой модалке не удалось снять чисто из-за нестabильного размера окна тестового браузера в этой сессии (дважды подряд разные скриншоты той же страницы возвращали разные размеры) - код модалки прошёл строгую проверку типов и по структуре идентичен уже проверенным блокам (`AdvisorReport.tsx`).

---

## 2026-09-12 — Learning paths подключены к Advisor Report + исправлен баг в скоринге "tech"-интереса

- `learning_paths`/`learning_path_steps` (17 реальных путей, включая `become_software_engineer`, `become_physician` и т.д.) теперь читаются из Supabase и показываются пользователю:
  - `types.ts` — добавлены `LearningPath`/`LearningPathStep`;
  - `data/Repository.ts` — добавлены парсеры `parseDbLearningPathStep`/`parseDbLearningPath` и метод `getLearningPaths()` (тянет обе таблицы параллельно, группирует шаги по `learning_path_id`; при ошибке/отсутствии Supabase возвращает `[]`, без выдуманных данных);
  - `components/AdvisorReport.tsx` — новый блок "Your Path to Becoming X": подбирает путь по `targetProfessionId` топ-профессии из `useEducationEngine`, показывает шаги по порядку (заголовок/описание/срок), скрыт полностью если путь не найден или у него ещё нет шагов (часть путей в БД пока без шагов — это честно, БД ещё наполняется).
- Попутно найден и исправлен реальный баг скоринга в `engine/EducationEngine.ts`: интерес "tech" сверялся с категориями `"engineering"/"IT"`, которых не существует в реальных данных (`professions.sector` содержит `"technology"`, `"engineering"`, `"science"` и др.) — из-за этого профессии сектора `technology` (Softwareentwickler, Data Analyst, Cybersecurity-Spezialist) никогда не получали бонус за совпадение интереса. Проверено вживую через консоль (прямой вызов `EducationEngine` с реальными профессиями/профилем) — теперь "tech" корректно матчит `technology`/`engineering`/`IT`/`science`.
- Живая проверка: `DataRepository.getLearningPaths()` вызван напрямую в браузере, вернул все 17 путей с корректно сгруппированными шагами; сквозной прогон движка (профессии → топ-профессия → path lookup) подтвердил, что для Softwareentwicklerin находится путь с 6 реальными немецкоязычными шагами.

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

**Ещё не сделано**: UI для `saved_items` (сохранённые institutions/professions) и `recommendation_feedback` (лайк/дизлайк рекомендаций) вообще не существует — таблицы готовы, фичи нет.

---

## 2026-09-12 — Трекеры подключены к Supabase (tracker_goals/tracker_items)

- **`Repository.getTrackers`/`saveTrackers`** теперь cloud-first для настоящих аккаунтов (guest — как и раньше, local-only: у него просто нет реальной Supabase-сессии). Дочерние записи (`tracker_items`) синхронизируются полной заменой на каждое сохранение — как и для `profile_interests`/`profile_goals` — потому что у клиента нет надёжного способа диффать построчно; удаление `tracker_goal` каскадно удаляет его `tracker_items` (`ON DELETE CASCADE`).
- **ID переведены на `crypto.randomUUID()`** (`TrackerSystem.tsx`, `seedData.ts`) вместо `Math.random().toString(36)` — колонки `id` в БД типа `uuid`, без этого синхронизация была бы невозможна в принципе. `saveTrackers` защитно проверяет ID на UUID-формат перед отправкой в облако — старые localStorage-данные (если у кого-то остались с до-фикса) просто не будут облачно синхронизироваться, но не потеряются локально.
- **Маппинг несовпадений схемы**: `tracker_goals.category` в БД не поддерживает `"sport"` (только education/habit/language/career/health/productivity/other) — на запись мапится в `"health"`, на чтение DB-only значения (`language`/`career`) схлопываются в `"other"`.
- **Найден и исправлен реальный баг** в `App.tsx`: логика "это первый визит → показать example tracker" проверяла только `hasStoredTrackers()` (наличие данных в этом браузере). На новом устройстве у уже существующего облачного пользователя это привело бы к немедленной перезаписи его настоящих трекеров example-трекером (`saveTrackers` делает полную замену). Теперь также проверяется `cachedTrackers.length > 0`.
- См. `02_Product/Backend/Prototype Limitations.md` — пункты 5 и 14 отмечены закрытыми.

---

## 2026-09-12 — Закрытие вопроса Supabase RLS (round 2): найден и починен регресс + полный обход схемы

Sofiia попросила закрыть тему настройки Supabase полностью, чтобы дальше только добавлять данные.

- **Нашёл и починил регресс от сегодняшних утренних изменений**: переключение 3 VIEW на `security_invoker` (см. запись выше) сработало правильно только благодаря тому, что `institutions` имеет публичную политику — но `institution_locations` (129 реальных строк, от неё зависят обе map-view для multi-campus институций) имела RLS включён и **ноль политик**. После переключения на invoker-режим анон больше не мог её читать — обе VIEW молча теряли часть строк. Добавлена политика с тем же trust-фильтром, что уже зашит в самих VIEW (`verification_status in ('verified','needs_review')`). Проверено живым REST-запросом — обе VIEW снова отдают полные данные.
- **Полный обход оставшихся 40 таблиц с RLS-без-политик**: 13 из них оказались настоящими публичными справочниками/связями (`cantons`, `cities`, `education_levels`, `institution_types`, `languages`, `institution_languages`, `institution_focus_areas`, `profession_institutions`, `profession_resources`, `profession_program_links`, `resource_path_links`, `profession_activity_items`, `profession_family_map`) — добавлены read-политики (с фильтром по `is_active`, где есть такая колонка). Остальные ~26 (`future.*`, `ops.stg_*`, `*_import_batches`, `*_source_records`, `*_seed_map`, `*_match_candidates`, `source_registry`, `institution_media_manifest`, `institution_source_links`) — осознанно оставлены закрытыми, это внутренние pipeline-таблицы.
- **Осталось невозможным исправить через SQL/миграции** (требует действий Sofiia в Supabase Dashboard): leaked password protection выключена — путь: Authentication → Sign In / Providers → **Email** → "Prevent the use of leaked passwords" (доступно только на Pro-плане и выше — на Free его физически нет в интерфейсе); `citext` extension в public schema (не двигаю — рискует сломать `profiles.email`).
- Подробности и таблица "что публично / что закрыто и почему" — в памяти агента `inspirella-supabase-schema`.

---

## 2026-09-12 — Закрыт жёлтый pre-launch блок (favicon, meta-теги, crash guard, Privacy)

- **`public/favicon.svg` + `index.html`**: favicon на основе `PhoenixLogo` (упрощённая версия для мелких размеров), meta description, theme-color, Open Graph/Twitter card теги — раньше шаринг ссылки давал пустой previev.
- **`src/components/ErrorBoundary.tsx`**, обёрнут вокруг `<App/>` в `main.tsx`: раньше необработанная ошибка рендера в любом месте дерева роняла всё приложение в чистый белый экран без объяснений. Специально не зависит от i18n/темы/app state — они сами могли быть частью того, что упало.
- **`PrivacyView`** (`features/marketing.tsx`), доступна из футера (`activeTab: "privacy"`): честное простым языком описание — кто отвечает (Inspirella, пока без юр. лица, контакт `iinspirella@gmail.com`), что собираем (аккаунт/профиль/персонализация/трекеры, отдельно оговорён guest-режим — ничего не уходит с браузера), зачем, где хранится (Supabase, Mapbox), права пользователя, cookies/local storage. Только на английском пока, с явной пометкой "первый честный черновик, нужен юрист (nLPD/FADP, GDPR) перед масштабированием за пределы друзей/тестеров".
- **Production build** уже проверялся ранее (собирается чисто, единственное замечание — тяжёлый бандл без code-splitting, не блокирует запуск).
- **Побочная находка, не трогал**: `ContactView` показывает выдуманный адрес ("Rue de l'Athénée 12, 1205 Genève"), телефон и email `office@inspirella.ch` — остаток демо-контента AI Studio. Показывать несуществующий офис/телефон реальным пользователям нечестно; стоит заменить или убрать перед реальным запуском.

---

## Как использовать этот файл дальше

- Одна содержательная сессия работы = обычно одна запись (не одна запись на каждый маленький commit).
- Если в сессии было архитектурное решение с альтернативами — короткая ссылка сюда, полное обоснование в `Decisions.md`.
- Не дублировать содержимое `02_Product/*` — там живёт целевое состояние продукта, здесь — история того, что реально произошло.
