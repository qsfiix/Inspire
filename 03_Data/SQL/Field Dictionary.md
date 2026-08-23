Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-15
Purpose: зафиксировать канонический словарь полей Inspirella, чтобы данные, документация, Supabase, код и будущие ИИ-агенты опирались на единый набор сущностей, атрибутов и правил заполнения
Related Files:
- ./Data Model.md
- ./Sources.md
- ./Import Rules.md
- ./Validation Rules.md
- ./Quality Rules.md
- ./Coverage.md
- ./Entities/School.md
- ./Entities/Program.md
- ./Entities/Location.md
- ./Entities/Source.md

# Field Dictionary

## Зачем нужен этот файл

Этот файл фиксирует словарь полей Inspirella.

Если `Data Model.md` отвечает на вопрос, какие сущности существуют и как они связаны, то `Field Dictionary.md` отвечает на вопрос:

> какие именно поля существуют внутри этих сущностей, что они означают, какие из них обязательны, откуда они берутся и как их нужно интерпретировать.

Этот файл нужен для того, чтобы:
- убрать неоднозначность между документацией, Supabase, кодом и будущими AI-workflows;
- помочь быстро понимать, какие поля являются обязательными, а какие второстепенными;
- упростить импорт, валидацию и расширение данных;
- не допускать расхождения между текущим прототипом и целевой канонической моделью.

## Главные правила словаря полей

### 1. Одно поле = одно понятное значение
Каждое поле должно иметь чёткий смысл.

Нельзя использовать одно и то же поле одновременно:
- и как display label;
- и как внутренний identifier;
- и как контейнер для разных смыслов.

### 2. Каноническое имя важнее legacy-названий
Если в коде, старых импортах или временных таблицах уже встречаются другие имена полей, это допустимо только как transitional/legacy-слой.

В словаре фиксируются именно **канонические** имена.

### 3. Обязательные поля должны поддерживать реальную полезность
Поле считается обязательным не потому, что «так красивее», а потому что без него запись:
- не может быть корректно идентифицирована;
- не может быть показана пользователю;
- не может участвовать в фильтрации, сравнении или персонализации;
- становится слишком недостоверной.

### 4. Источник значения должен быть понятен
Для важных полей должно быть понятно:
- это значение пришло из внешнего источника;
- это значение вычислено;
- это значение нормализовано вручную или полуавтоматически.

### 5. Поля должны быть готовы к международному росту
Даже если старт — Швейцария, модель не должна жёстко запирать нас в слишком локальные допущения там, где это потом будет мешать масштабированию.

---

# 1. Общая структура описания полей

Для каждого поля в словаре полезно фиксировать:

- `Field Name` — каноническое имя поля;
- `Entity` — к какой сущности относится;
- `Type` — тип значения;
- `Required` — обязательность;
- `Description` — смысл поля;
- `Example` — пример значения;
- `Source` — откуда обычно берётся;
- `Validation Notes` — как проверяется;
- `Usage` — где используется в продукте.

---

# 2. Каноническая сущность: Institutions

## Общая логика

`institutions` — главная каноническая сущность для образовательных организаций.

Поле `school` пока не фиксируется как отдельная каноническая верхнеуровневая сущность. Оно допустимо как:
- legacy naming;
- import-layer термин;
- частный случай `institution_type`.

---

## 2.1. Identity fields

### `id`
- **Entity:** Institution
- **Type:** string / UUID
- **Required:** yes
- **Description:** внутренний уникальный идентификатор записи
- **Example:** `inst_ch_zh_001`
- **Source:** система / база / импорт
- **Validation Notes:** должен быть уникальным, стабильным и не меняться при обычном обновлении записи
- **Usage:** связи, API, Supabase, UI keys, deduplication

### `slug`
- **Entity:** Institution
- **Type:** string
- **Required:** recommended
- **Description:** человекочитаемый стабильный идентификатор для URL, ссылок и внутренних reference-слоёв
- **Example:** `university-of-zurich`
- **Source:** вычисляется из title или задаётся вручную
- **Validation Notes:** lowercase, kebab-case, уникальный в пределах сущности
- **Usage:** URL, readable references, search-friendly linking

### `title`
- **Entity:** Institution
- **Type:** localized string object or canonical display string
- **Required:** yes
- **Description:** главное отображаемое название учреждения
- **Example:** `University of Zurich`
- **Source:** официальный сайт / официальный реестр / каноническая редактура
- **Validation Notes:** не должно быть пустым; не должно содержать лишние marketing suffixes, если они не являются частью официального названия
- **Usage:** карточки, поиск, списки, карта, рекомендации

### `short_title`
- **Entity:** Institution
- **Type:** string
- **Required:** no
- **Description:** короткая форма названия для UI с ограниченным пространством
- **Example:** `UZH`
- **Source:** официальный бренд / редакторская нормализация
- **Validation Notes:** не должна заменять `title` как source of truth
- **Usage:** badges, compact cards, map overlays

### `institution_type`
- **Entity:** Institution
- **Type:** enum / controlled string
- **Required:** yes
- **Description:** канонический тип образовательной организации
- **Example:** `university`, `vocational_school`, `private_school`, `training_center`
- **Source:** нормализуется из официальных данных
- **Validation Notes:** только значения из утверждённого controlled vocabulary
- **Usage:** фильтры, grouping, routing, personalization

### `is_school`
- **Entity:** Institution
- **Type:** boolean
- **Required:** no
- **Description:** служебный флаг для совместимости, указывающий, считать ли учреждение school-like сущностью в legacy logic
- **Example:** `true`
- **Source:** derived / migration support
- **Validation Notes:** не является главным классификатором; не должен заменять `institution_type`
- **Usage:** transitional compatibility

---

## 2.2. Location fields

### `country_code`
- **Entity:** Institution
- **Type:** string (ISO-like country code)
- **Required:** yes
- **Description:** код страны учреждения
- **Example:** `CH`
- **Source:** официальный адрес / источник данных
- **Validation Notes:** uppercase; желательно использовать стандартизированную кодировку
- **Usage:** country filters, expansion logic, localization

### `region`
- **Entity:** Institution
- **Type:** string
- **Required:** no
- **Description:** регион / state / canton / область верхнего уровня
- **Example:** `Zurich`
- **Source:** адрес / геоданные / официальный сайт
- **Validation Notes:** должен быть приведён к канонической форме для страны
- **Usage:** filters, maps, geographic grouping

### `canton`
- **Entity:** Institution
- **Type:** string
- **Required:** required for Switzerland, optional otherwise
- **Description:** кантон для швейцарских записей
- **Example:** `Zurich`
- **Source:** адрес / геоданные
- **Validation Notes:** для CH-записей должен быть в каноническом списке кантонов
- **Usage:** Swiss search and filtering

### `city`
- **Entity:** Institution
- **Type:** string
- **Required:** yes if known
- **Description:** город учреждения
- **Example:** `Zurich`
- **Source:** адрес / geocoding / официальный источник
- **Validation Notes:** не должен смешиваться с полным адресом
- **Usage:** search, UI display, map filters

### `address`
- **Entity:** Institution
- **Type:** string
- **Required:** strongly recommended
- **Description:** полный человекочитаемый адрес
- **Example:** `Rämistrasse 71, 8006 Zürich, Switzerland`
- **Source:** официальный сайт / официальные реестры
- **Validation Notes:** должен быть достаточно полным для геопроверки; если неполный — это должно быть явно известно
- **Usage:** карта, контакты, validation, trust

### `postal_code`
- **Entity:** Institution
- **Type:** string
- **Required:** no
- **Description:** почтовый индекс
- **Example:** `8006`
- **Source:** адрес / геокодинг / официальный источник
- **Validation Notes:** формат зависит от страны
- **Usage:** address validation, deduplication, filters

### `latitude`
- **Entity:** Institution
- **Type:** number
- **Required:** recommended for mappable institutions
- **Description:** широта точки на карте
- **Example:** `47.3769`
- **Source:** geocoding / verified map source
- **Validation Notes:** должна быть валидным числом в допустимом диапазоне
- **Usage:** карта, nearby search, clustering

### `longitude`
- **Entity:** Institution
- **Type:** number
- **Required:** recommended for mappable institutions
- **Description:** долгота точки на карте
- **Example:** `8.5417`
- **Source:** geocoding / verified map source
- **Validation Notes:** должна быть валидным числом в допустимом диапазоне
- **Usage:** карта, nearby search, clustering

---

## 2.3. Contact and access fields

### `website`
- **Entity:** Institution
- **Type:** URL string
- **Required:** yes if institution is public-facing
- **Description:** основной официальный сайт учреждения
- **Example:** `https://www.uzh.ch`
- **Source:** официальный сайт
- **Validation Notes:** должен быть валидным URL; приоритетно использовать официальный домен
- **Usage:** карточка, verification, trust

### `admission_url`
- **Entity:** Institution
- **Type:** URL string
- **Required:** no
- **Description:** ссылка на поступление / admissions / apply
- **Example:** `https://www.uzh.ch/en/studies/application.html`
- **Source:** официальный сайт
- **Validation Notes:** не должна дублировать homepage без причины, если есть более точная целевая страница
- **Usage:** CTA, application flows

### `email`
- **Entity:** Institution
- **Type:** email string
- **Required:** no
- **Description:** основной контактный email
- **Example:** `admissions@institution.ch`
- **Source:** официальный сайт
- **Validation Notes:** валидный формат email; приоритетно institutional domain
- **Usage:** contact, trust, operations

### `phone`
- **Entity:** Institution
- **Type:** string
- **Required:** no
- **Description:** основной контактный телефон
- **Example:** `+41 44 123 45 67`
- **Source:** официальный сайт
- **Validation Notes:** желательно международный формат
- **Usage:** contact, trust

---

## 2.4. Description and presentation fields

### `description`
- **Entity:** Institution
- **Type:** localized string object / rich text
- **Required:** yes if institution is user-visible
- **Description:** краткое понятное описание учреждения
- **Example:** `Public university in Zurich with strong research and international programs.`
- **Source:** официальный сайт + редакторская нормализация
- **Validation Notes:** должно быть информативным, нейтральным и не перегруженным marketing copy
- **Usage:** карточки, details, recommendations

### `image_url`
- **Entity:** Institution
- **Type:** URL string
- **Required:** no
- **Description:** изображение учреждения для карточек или detail view
- **Example:** `https://.../campus.jpg`
- **Source:** разрешённый media source
- **Validation Notes:** только валидный и допустимый по правам asset
- **Usage:** UI cards, map detail panel

### `tags`
- **Entity:** Institution
- **Type:** array of strings or normalized relation
- **Required:** no
- **Description:** вспомогательные теги для быстрого смыслового описания
- **Example:** `['public', 'research', 'stem']`
- **Source:** derived / editorial / classification
- **Validation Notes:** не должны подменять структурированные поля вроде `institution_type`
- **Usage:** search, filters, ranking support

---

## 2.5. Trust and quality fields

### `verified`
- **Entity:** Institution
- **Type:** boolean
- **Required:** recommended
- **Description:** прошла ли запись базовую верификацию
- **Example:** `true`
- **Source:** internal validation workflow
- **Validation Notes:** должно опираться на прозрачные правила, а не на интуицию
- **Usage:** trust scoring, ranking, UI badges

### `status`
- **Entity:** Institution
- **Type:** enum / controlled string
- **Required:** recommended
- **Description:** рабочий статус записи
- **Example:** `verified`, `provisional`, `draft`, `archived`
- **Source:** internal workflow
- **Validation Notes:** controlled vocabulary only
- **Usage:** workflow, trust, publication logic

### `source_count`
- **Entity:** Institution
- **Type:** number
- **Required:** no
- **Description:** количество источников, подтверждающих запись
- **Example:** `3`
- **Source:** derived
- **Validation Notes:** вычисляемое поле
- **Usage:** trust, QA, internal dashboards

### `last_verified_at`
- **Entity:** Institution
- **Type:** datetime
- **Required:** no
- **Description:** когда запись последний раз была проверена
- **Example:** `2026-08-10`
- **Source:** internal review process
- **Validation Notes:** не путать с `updated_at`
- **Usage:** freshness, review workflow

### `data_confidence_score`
- **Entity:** Institution
- **Type:** number
- **Required:** no
- **Description:** внутренний score уверенности в качестве записи
- **Example:** `88`
- **Source:** derived / QA logic
- **Validation Notes:** вычисляется по прозрачным правилам
- **Usage:** ranking, QA prioritization

---

## 2.6. Product and recommendation fields

### `languages_of_instruction`
- **Entity:** Institution
- **Type:** array / normalized relation
- **Required:** yes if known
- **Description:** языки обучения
- **Example:** `['de', 'en']`
- **Source:** официальный сайт / программы
- **Validation Notes:** использовать канонические language codes
- **Usage:** filters, matching, personalization

### `degree_levels`
- **Entity:** Institution
- **Type:** array / normalized relation
- **Required:** no
- **Description:** какие уровни обучения предлагает учреждение
- **Example:** `['bachelor', 'master']`
- **Source:** официальный сайт / structured classification
- **Validation Notes:** controlled vocabulary
- **Usage:** filtering, route building, recommendations

### `admission_requirements_summary`
- **Entity:** Institution
- **Type:** localized string / structured summary
- **Required:** no
- **Description:** краткое описание требований к поступлению
- **Example:** `Swiss Matura or equivalent qualification.`
- **Source:** официальный сайт / editorial normalization
- **Validation Notes:** summary, not full raw dump
- **Usage:** compare, decision support, cards/details

### `target_audience`
- **Entity:** Institution
- **Type:** array / controlled values
- **Required:** no
- **Description:** для каких типов пользователей особенно релевантно учреждение
- **Example:** `['teenagers', 'international_students']`
- **Source:** derived/editorial classification
- **Validation Notes:** не заменяет персонализацию, а дополняет её
- **Usage:** routing, filters, ranking

---

# 3. Каноническая сущность: Programs

## Минимальный набор полей

### `id`
- уникальный идентификатор программы

### `institution_id`
- ссылка на institution

### `title`
- название программы

### `program_type`
- тип программы
- пример: `bachelor`, `master`, `apprenticeship_track`, `certificate`

### `study_mode`
- формат обучения
- пример: `full_time`, `part_time`, `hybrid`

### `language_of_instruction`
- язык/языки программы

### `duration`
- длительность программы

### `admission_requirements`
- структурированная или summary-форма требований

### `profession_links`
- связь с профессиями / карьерными направлениями

### `status`
- рабочий статус записи

---

# 4. Каноническая сущность: Professions

## Минимальный набор полей

### `id`
- уникальный идентификатор профессии

### `title`
- название профессии

### `category`
- каноническая категория профессии

### `description`
- краткое описание

### `education_required`
- какой образовательный путь обычно нужен

### `skills_required`
- ключевые навыки

### `demand_level`
- спрос

### `salary_range`
- диапазон зарплаты, если уместно

### `related_programs`
- связь с программами

### `related_institutions`
- связь с institutions

---

# 5. Каноническая сущность: Resources

## Минимальный набор полей

### `id`
- уникальный идентификатор ресурса

### `title`
- название ресурса

### `category`
- тип ресурса
- пример: `official_portal`, `guide`, `career_resource`, `admission_resource`

### `url`
- ссылка на ресурс

### `description`
- краткое описание

### `country_code`
- страна, если применимо

### `language`
- язык ресурса

### `verified`
- флаг достоверности

### `institution_id` / `program_id` / `profession_id`
- контекстная привязка, если есть

---

# 6. Каноническая сущность: Sources

## Минимальный набор полей

### `id`
- уникальный идентификатор источника

### `source_type`
- тип источника
- пример: `official_website`, `government_registry`, `institution_document`, `manual_entry`

### `source_name`
- имя источника

### `source_url`
- ссылка на источник

### `trust_level`
- внутренний уровень доверия
- пример: `high`, `medium`, `low`

### `retrieved_at`
- когда источник был получен

### `applies_to_entity`
- к какой сущности относится источник

### `applies_to_id`
- к какой записи относится источник

---

# 7. Обязательные поля для institution в MVP

На раннем этапе запись institution должна считаться минимально пригодной, если у неё есть:

- `id`
- `title`
- `institution_type`
- `country_code`
- `city` или достаточно полный `address`
- `website` или другой сильный официальный reference
- `description` хотя бы в краткой форме
- `source` / подтверждение происхождения данных

Если этих полей нет, запись не должна считаться достаточно сильной для полноценного пользовательского опыта.

---

# 8. Вычисляемые поля

Следующие поля желательно считать вычисляемыми или derived, а не первичными source-of-truth:

- `source_count`
- `data_confidence_score`
- `is_school`
- ranking-oriented scores
- recommendation support scores
- completeness scores

Это важно, чтобы не смешивать первичные данные с результатами внутренних алгоритмов.

---

# 9. Legacy и transitional fields

Пока проект ещё выравнивается, допустимы transitional решения:

- `schools` как legacy table / legacy naming;
- `canton` как отдельное практическое поле для CH, даже если позже location станет более нормализованным;
- частичное хранение multilingual content в более простой форме;
- временное наличие mixed fields в прототипе.

Но эти вещи нельзя бесконечно считать каноном.

Задача словаря — как раз помочь постепенно перевести проект из mixed prototype state в чистую модель.

---

# 10. Что особенно важно для будущих ИИ-агентов

Будущие ИИ-агенты должны быстро понимать:

- какая сущность является канонической;
- какие поля обязательны;
- какие поля можно безопасно дополнять;
- какие поля нельзя придумывать без источника;
- какие поля derived, а какие source-of-truth;
- как не путать `institutions`, `schools`, `programs`, `resources`, `professions`.

Этот файл должен стать одним из главных антихаосных документов data-layer.

## Открытые вопросы

- насколько рано фиксировать multilingual fields как обязательный object, а не как простой string;
- какие поля у institution лучше вынести позже в отдельную location-сущность;
- как именно оформлять admission requirements: как summary, structured JSON или отдельную таблицу;
- насколько глубоко уже сейчас закладывать поля для персонализации и recommendation trace.