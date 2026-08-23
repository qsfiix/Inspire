Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить контракт чтения и выдачи образовательных организаций для карты, каталога и recommendation engine.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../Architecture/Product Architecture.md
- ../Requirements/Map Discovery Requirements.md

# Institutions API Contract

## Каноническая сущность

API использует `institutions` как canonical name. `schools` допускается только как legacy/import fallback до завершения выравнивания. Одна запись должна иметь стабильный ID, понятное название, тип, location context и статус качества.

## Запрос списка

Целевой endpoint:

```text
GET /api/institutions?country=CH&canton=ZH&type=university&language=de&status=published
```

Поддерживаемые фильтры должны быть явными и ограниченными: `country`, `canton`, `institutionType`, `language`, `programId`, `verifiedOnly`, `page`, `pageSize` и `query`. Нельзя позволять свободному query менять SQL-структуру.

## Product-facing response

```json
{
  "items": [
    {
      "id": "stable-id",
      "name": "Institution name",
      "institutionType": "university",
      "countryCode": "CH",
      "canton": "Zurich",
      "city": "Zurich",
      "coordinates": {"lng": 8.54, "lat": 47.37},
      "languages": ["de", "en"],
      "summary": {"en": "..."},
      "website": "https://official.example",
      "quality": {"status": "verified", "sourceCount": 2, "lastReviewedAt": "..."}
    }
  ],
  "pagination": {"page": 1, "pageSize": 20, "total": 1}
}
```

Полные административные поля, сырые импортные значения и внутренние quality notes не выдаются публичному UI.

## Правила публикации

- В product-facing список попадают только записи, разрешённые publication policy.
- `draft`, `review_needed` и `invalid` не должны выглядеть как равноправные рекомендации.
- Координаты и website проверяются отдельно от display title.
- Отсутствие optional image не блокирует запись.
- Конфликт источников должен быть виден в quality state, а не молча разрешаться UI.

## Карта

Карта принимает тот же нормализованный shape, что и каталог. Она не должна самостоятельно угадывать координаты или переключаться на `schools` без сообщения о fallback. Если Mapbox недоступен, пользователь получает directory-map fallback и понимает ограничение.

## Ошибки

- `400 invalid_filter` — фильтр не поддерживается или невалиден;
- `401 authentication_required` — нужен пользовательский доступ;
- `404 institution_not_found` — запись не найдена в разрешённой области;
- `503 data_source_unavailable` — временно недоступен источник;
- `200 items: []` — корректный пустой результат, не ошибка.

## Текущее состояние

Сейчас `DataRepository.getInstitutions()` читает `institutions`, затем пробует `schools`, а затем статический `SWISS_INSTITUTIONS`. Это хороший переходный адаптер, но целевой endpoint должен вынести фильтрацию, publication policy и pagination из UI.
