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

## Как использовать этот файл дальше

- Одна содержательная сессия работы = обычно одна запись (не одна запись на каждый маленький commit).
- Если в сессии было архитектурное решение с альтернативами — короткая ссылка сюда, полное обоснование в `Decisions.md`.
- Не дублировать содержимое `02_Product/*` — там живёт целевое состояние продукта, здесь — история того, что реально произошло.
