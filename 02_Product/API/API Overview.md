Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать границы API-слоя Inspirella, его текущую реализацию и целевую схему связи между UI, сервером, Supabase, Mapbox и Gemini.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../../04_Development/Environment Variables.md

# API Overview

## Роль API-слоя

API-слой соединяет продуктовый интерфейс с внешними сервисами и не даёт UI напрямую смешивать бизнес-логику, секреты и детали хранения. Для Inspirella это особенно важно: персонализация должна опираться на качественные данные, а не на случайные вызовы из компонентов.

## Текущая реализация

В кодовом snapshot `Inspirella_code/`:

- `server.ts` поднимает Express-сервер и Vite middleware;
- `GET /api/config` возвращает клиенту runtime-конфигурацию Supabase и Mapbox;
- `POST /api/gemini/advisor` содержит серверный вызов Gemini;
- `src/data/Repository.ts` является основным адаптером для профиля, ресурсов, institutions и professions;
- локальный fallback реализован через `src/data/localMockDB.ts` и статические данные;
- полноценная auth-сессия Supabase и cloud persistence для trackers ещё не завершены.

## Целевой поток

```text
UI feature
  → typed client service
  → Express/API boundary
  → validation + authorization
  → Supabase / Gemini / Mapbox
  → normalized product response
```

Клиентские компоненты не должны знать административные ключи, SQL-детали или правила публикации данных.

## Целевые группы endpoint-ов

| Группа | Назначение | MVP-состояние |
|---|---|---|
| `/api/config` | безопасно отдать только public runtime config | есть, требует проверки whitelist |
| `/api/profile` | получить и обновить профиль текущего пользователя | целевой контракт; текущая реализация частично local-first |
| `/api/institutions` | каталог подтверждённых образовательных организаций | чтение частично через Repository |
| `/api/recommendations` | получить объяснимую персональную подборку | rule-based engine уже существует локально |
| `/api/trackers` | хранить цели и checklist items пользователя | пока localStorage/mock |
| `/api/gemini/advisor` | генерировать объяснение поверх структурированных данных | серверный endpoint есть, UI-интеграция требует отдельной проверки |

## Общий контракт ответа

Успешный ответ должен иметь предсказуемую форму. Ошибка должна содержать безопасный `code`, понятное пользователю сообщение и внутренний correlation id без секретов. API не должен возвращать необработанные исключения, SQL-тексты или ключи.

## Правила API

1. Использовать канонические сущности из `03_Data`, прежде всего `institutions`, `programs`, `professions`, `resources`, `sources` и `profiles`.
2. Разделять `staging`, `provisional`, `review_needed` и product-facing данные.
3. Проверять входные данные до обращения к базе или AI.
4. Применять ownership/RLS для пользовательских данных.
5. Не считать наличие ответа AI доказательством истинности.
6. Версионировать изменения контрактов и обновлять соответствующий документ до изменения кода.
7. Для нового endpoint-а иметь loading, empty, error и fallback-сценарии.

## Критерии готовности API-изменения

- контракт описан до реализации;
- типы запроса и ответа совпадают на сервере и клиенте;
- запрещённые поля и секреты не возвращаются;
- есть обработка невалидных и пустых данных;
- выполнены lint/build и релевантные тесты;
- изменение не ломает локальный fallback без явного решения.
