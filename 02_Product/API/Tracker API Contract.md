Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать пользовательские цели и checklist-операции, сохранив tracker как поддерживающий слой, а не замену образовательному пути.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Non-Goals.md
- ../Requirements/Tracker Requirements.md
- ../../03_Data/SQL/Data Model.md

# Tracker API Contract

## Назначение

Tracker помогает превратить выбранный следующий шаг в небольшое действие и увидеть прогресс. Он не должен создавать ложное ощущение, что количество streak-дней равно качеству образовательного решения.

## Модель MVP

```json
{
  "id": "goal-id",
  "userId": "owned-by-session",
  "title": "Daily physics practice",
  "category": "education",
  "description": "Short practice block",
  "progress": 40,
  "streak": 3,
  "items": [
    {"id": "item-id", "text": "Complete one exercise", "completed": false, "frequency": "daily"}
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Целевые операции

```text
GET    /api/trackers
POST   /api/trackers
PATCH  /api/trackers/:trackerId
DELETE /api/trackers/:trackerId
POST   /api/trackers/:trackerId/items
PATCH  /api/trackers/:trackerId/items/:itemId
```

Каждая операция проверяет ownership, допустимую длину текста, category и frequency. Повторная отправка одной и той же операции не должна создавать дубли.

## Состояния

UI должен различать `loading`, `empty`, `saved`, `offline/local`, `syncing`, `error` и `conflict`. Local-first fallback допустим для прототипа, но должен быть явно обозначен и не выдавать локальное сохранение за cloud sync.

## Текущее состояние

`TrackerSystem.tsx` и `localMockDB.ts` обеспечивают локальную работу. `DataRepository` содержит TODO для Supabase trackers. Перед подключением API нужно определить SQL-модель, даты completion, timezone policy и поведение при нескольких устройствах.
