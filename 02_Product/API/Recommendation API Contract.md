Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: зафиксировать контракт выдачи персонального образовательного пути с объяснением, доказательствами и безопасными ограничениями.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../Backend/Recommendation Engine.md
- ../UX/Decision Support UX.md

# Recommendation API Contract

## Принцип выдачи

Recommendation API не возвращает «единственно правильную профессию». Он формирует ограниченную, объяснимую подборку вариантов и следующий шаг. Ценность — в связи между человеком, качественными данными и ясным маршрутом.

## Целевой запрос

```text
POST /api/recommendations
{
  "profile": {
    "interests": ["academic", "tech"],
    "goals": ["study_active"],
    "currentStage": "stage_university",
    "language": "en",
    "preferredCanton": "Zurich"
  },
  "scope": {"countryCode": "CH", "limit": 3}
}
```

На authenticated flow профиль предпочтительно брать на сервере из сессии, а не доверять всем полям из body.

## Ответ

```json
{
  "engineVersion": "rules-v1",
  "pathFocus": "Academic Excellence Track",
  "nextBestStep": "Review relevant tertiary options",
  "items": [
    {
      "type": "institution",
      "id": "stable-id",
      "title": "...",
      "score": 82,
      "matchReasons": ["Matches your interest area", "Verified source"],
      "evidence": [{"sourceId": "source-id", "label": "Official source"}],
      "confidence": "medium",
      "limitations": ["Admission requirements should be checked on the official site"]
    }
  ]
}
```

## Алгоритм MVP

1. Проверить, что профиль минимально заполнен.
2. Получить только разрешённые и достаточно качественные records.
3. Рассчитать deterministic alignment, route, regional и trust signals.
4. Удалить дубли и несовместимые записи.
5. Сформировать top-N с match reasons.
6. Добавить next step и evidence.
7. При необходимости использовать Gemini только для объяснения уже выбранных фактов.

## Ограничения

Score — внутренний ranking signal, а не вероятность успеха и не оценка личности. UI не должен превращать его в школьную или карьерную «оценку». При недостатке данных API возвращает `confidence=low` и предлагает уточнить профиль.

## Текущее состояние

`EducationEngine.run()` уже формирует `pathFocus`, `nextBestStep`, top professions, institutions и resources с причинами совпадения. Сейчас professions могут быть пустыми при отсутствии таблицы, а основной вызов происходит локально в React hook. Перевод этой логики в API — отдельный шаг после стабилизации типов и data layer.
