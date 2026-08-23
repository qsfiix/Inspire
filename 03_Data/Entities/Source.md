Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать, что в Inspirella считается source как отдельной сущностью данных, какие типы источников существуют, какие поля и правила применяются к source-записям и как source layer поддерживает доверие, валидацию и дальнейшую работу с данными
Related Files:
- ../Data Model.md
- ../Field Dictionary.md
- ../Sources.md
- ../Validation Rules.md
- ../Import Rules.md
- ./School.md
- ./Program.md
- ./Location.md

# Source

## Зачем нужен этот файл

Этот файл нужен для того, чтобы описать `source` не просто как «ссылку откуда-то», а как полноценную сущность внутри data-layer Inspirella.

Это важно, потому что для Inspirella источник — это не второстепенная техническая деталь. Source layer — это одна из главных опор доверия ко всей системе.

Без сильной source-сущности проект быстро сталкивается с проблемами:
- невозможно понять происхождение данных;
- непонятно, почему одному значению доверяют больше другого;
- конфликтующие данные сложно разруливать;
- ИИ-агенты начинают опираться на слабые или непрозрачные источники;
- база становится внешне богатой, но внутренне шаткой.

Этот файл должен ответить на вопрос:

> что именно в Inspirella считается source, какие признаки у source-записи обязательны и как source-сущность связывается с institutions, programs, professions, resources и quality logic.

---

## Краткое определение

**Source в Inspirella — это отдельная сущность, которая описывает происхождение данных: кто утверждает информацию, где она опубликована, насколько этому можно доверять, когда источник был получен и к каким полям или объектам он относится.**

Коротко:

> source — это не просто URL, а структурированная единица evidence layer, которая помогает понять происхождение, силу и применимость данных.

---

## Почему source — это отдельная сущность, а не просто поле

Очень легко было бы оставить источник в виде одного простого поля вроде:
- `source_url`
- `source_name`

Но для Inspirella этого недостаточно.

Потому что один и тот же источник может:
- подтверждать несколько полей;
- относиться к нескольким сущностям;
- иметь свой уровень trust;
- быть актуальным или устаревшим;
- конфликтовать с другим источником;
- использоваться как primary source или only supporting evidence.

Поэтому source лучше мыслить как полноценную сущность, а не как одноразовый атрибут.

---

## Как source соотносится с другими сущностями

### Source и Institution
Source может подтверждать:
- identity учреждения;
- адрес;
- website;
- language of instruction;
- admission data;
- статус активности;
- official classification.

### Source и Program
Source может подтверждать:
- title программы;
- тип программы;
- duration;
- admission requirements;
- delivery mode;
- language of instruction.

### Source и Profession
Source может подтверждать:
- existence and framing of profession;
- occupational description;
- demand / qualification / education route logic.

### Source и Resource
Иногда resource сам по себе может быть и user-facing object, и evidence source.

Но это не всегда одно и то же.

Поэтому в модели важно различать:
- resource as user-facing educational object;
- source as provenance/evidence layer.

---

## Что считается source

Запись может считаться source, если она отвечает большей части следующих признаков:

### 1. Есть identifiable origin
Понятно, кто или что является origin owner информации.

Примеры:
- официальный сайт учреждения;
- государственный реестр;
- PDF-документ организации;
- trusted educational portal;
- institutional program page.

### 2. Есть конкретная ссылка или ссылка-эквивалент
Это может быть:
- URL;
- документ;
- registry record;
- downloadable file;
- internal archived snapshot of external source.

### 3. Понятно, к чему именно source относится
Должно быть понятно, source подтверждает:
- institution в целом;
- конкретную program;
- адрес;
- admission details;
- profession description;
- другой конкретный слой данных.

### 4. Можно оценить силу доверия
Должно быть возможно отнести source хотя бы к одному trust-level.

---

## Что не должно считаться source

Следующие вещи не должны автоматически считаться полноценной source-сущностью:

### 1. Просто случайное упоминание без origin clarity
Например:
- обрывок текста;
- ненадёжная репост-страница;
- общий поисковый snippet.

### 2. Просто внутреннее мнение без внешней опоры
Например:
- ручная догадка;
- редакторская формулировка без связи с внешним источником.

### 3. Просто copied data without provenance
Если данные были откуда-то взяты, но не сохранилось, откуда именно — это не сильная source-сущность.

### 4. Derived summary без traceability
Внутренняя summary не должна сама по себе заменять исходный source.

---

## Основные типы source в Inspirella

Ниже — канонический стартовый набор.

### 1. Official institutional source
Примеры:
- официальный сайт школы;
- официальный сайт университета;
- official admissions page;
- faculty page;
- official contact page.

### 2. Official governmental / registry source
Примеры:
- государственный образовательный реестр;
- кантональный реестр;
- федеральный источник;
- государственные карьерные/образовательные порталы.

### 3. Official document source
Примеры:
- handbook;
- admissions PDF;
- curriculum document;
- institutional brochure, если она официальна.

### 4. Structured secondary source
Примеры:
- trusted educational directory;
- reputable comparison portal;
- strong sector-specific informational platform.

### 5. Internal derived source record
Это внутренний слой, который описывает derived or normalized data, но обязательно с traceability к внешним источникам.

---

## Основные поля для source в MVP

### Обязательный минимум
- `id`
- `source_type`
- `source_name`
- `source_url` или эквивалентный identifier
- `trust_level`
- `retrieved_at`
- `applies_to_entity`
- `applies_to_id`

### Сильный желательный слой
- `applies_to_fields`
- `source_status`
- `language`
- `notes`
- `is_primary`
- `last_checked_at`

### Более зрелый слой
- `evidence_strength_score`
- `freshness_status`
- `archived_snapshot_reference`
- `conflict_flags`
- `normalization_notes`

---

## Что означает каждое ключевое поле

### `id`
Уникальный идентификатор source-записи.

### `source_type`
Тип источника.

Примеры:
- `official_website`
- `official_program_page`
- `government_registry`
- `official_document`
- `trusted_directory`
- `internal_derived`

### `source_name`
Понятное название источника.

Примеры:
- `University of Zurich official website`
- `Canton Zurich education registry`
- `ETH admissions PDF`

### `source_url`
Ссылка на источник или эквивалентный pointer.

### `trust_level`
Уровень доверия.

Примеры:
- `high`
- `medium`
- `low`
- иногда later: `internal_derived`

### `retrieved_at`
Когда источник был получен или зафиксирован.

### `applies_to_entity`
К какой сущности относится source.

Примеры:
- `institution`
- `program`
- `profession`
- `resource`

### `applies_to_id`
К какой конкретной записи сущности относится source.

### `applies_to_fields`
Какие поля source действительно подтверждает.

Это очень важно, потому что один и тот же source может подтверждать title и website, но не admission requirements.

---

## Как source связан с trust hierarchy

Source-сущность должна поддерживать иерархию доверия, а не разрушать её.

### High trust
- official institutional source;
- government/registry source;
- official document.

### Medium trust
- strong structured secondary source.

### Low trust
- weak directory;
- unclear aggregator;
- stale third-party listing.

### Internal derived
- не внешний trust layer, а внутренний слой, который обязан быть traceable.

### Важный принцип

`trust_level` не должен ставиться «на глаз» без опоры на source type и реальный контекст.

---

## Когда source-запись считается валидной

Source можно считать валидной, если:

1. у неё есть ясный identity;
2. понятен source type;
3. есть usable URL или equivalent reference;
4. понятно, к какой сущности/полям она относится;
5. assigned trust level не выглядит нелогичным;
6. source не выглядит completely broken, irrelevant или fabricated.

---

## Когда source-запись считается слабой

Source-запись слабая, если:
- origin unclear;
- URL ведёт на нерелевантную страницу;
- источник слишком общий и не подтверждает конкретное поле;
- trust level завышен;
- source stale и ничем не перепроверен;
- нет ясной связи с entity.

Слабый source не обязательно useless, но он не должен давать такую же опору, как strong source.

---

## Когда source-запись считается сильной

Сильный source обычно имеет:
- официальный origin;
- прямую связь с сущностью;
- ясный scope подтверждения;
- хороший уровень свежести;
- понятный trust level;
- возможность быть primary evidence.

Именно такие source-записи особенно ценны для Inspirella, потому что они удерживают data-layer честным и устойчивым.

---

## Как проверять source URL

### Хороший source URL
- валиден технически;
- ведёт на реальный, релевантный и содержательный источник;
- соответствует source name и source type.

### Слабый source URL
- битый;
- нерелевантный;
- слишком общий root page, если нужна более точная page-level evidence;
- не соответствует заявленному institution/program.

### Важный принцип

Не каждый официальный домен автоматически подтверждает любой факт.

Нужно смотреть, подтверждает ли **конкретная страница** именно то поле, которое мы к ней привязываем.

---

## Как проверять applies_to_fields

Это один из самых важных элементов source-сущности.

Если source attached to record, нужно понимать:
- он подтверждает title?
- address?
- website?
- admission requirements?
- program duration?
- language of instruction?

### Почему это важно

Иначе появляется ложная уверенность, будто один source валидирует всю запись целиком, хотя на самом деле он покрывает только часть полей.

---

## Что делать, если один source относится к нескольким сущностям

Это нормально.

Например:
- official institution site может подтверждать и institution, и несколько programs;
- official handbook может подтверждать несколько policy/admission fields.

### Практическая логика

Нужно допускать, что source-сущность может:
- быть связана с несколькими entities;
- или иметь несколько relationship records,

если архитектура later станет более нормализованной.

На раннем этапе можно идти pragmatic path, но не терять это из виду.

---

## Что делать при конфликте источников

Source-сущность особенно важна именно здесь.

Если есть два conflicting source:

1. сравниваем `trust_level`;
2. сравниваем `source_type`;
3. сравниваем directness;
4. сравниваем freshness;
5. если конфликт материален — не делаем вид, что его нет.

### Примеры material conflict
- два разных адреса;
- разные admission rules;
- разный status program;
- противоречащие contact details;
- разный institution type.

### Правильное поведение

Лучше иметь review-needed слой,
чем silently выбирать удобное значение без объяснения.

---

## Как source используется в продукте

Source чаще всего не является front-facing сущностью для обычного пользователя как основная карточка.

Но source layer влияет почти на всё:
- verified status;
- trust signals;
- ranking confidence;
- review decisions;
- quality evaluation;
- explainability для внутренних workflows и будущих AI-агентов.

То есть source — это скорее internal truth-supporting entity, без которой пользовательский опыт становится менее надёжным.

---

## Как source поддерживает миссию Inspirella

Inspirella обещает пользователю:
- ясность;
- структуру;
- качество данных;
- реалистичную помощь;
- персонализированные, но не выдуманные пути.

Source-сущность — это одна из вещей, которая делает это обещание реальным.

Потому что без понятного происхождения данных:
- ясность становится иллюзией;
- trust ослабевает;
- персонализация начинает строиться на догадках;
- продукт теряет свою опору.

Поэтому source — это не скучная техничка, а один из deepest infrastructure layers доверия Inspirella.

---

## Что важно для будущих ИИ-агентов

Будущие ИИ-агенты должны быстро понимать:
- что source — это отдельная сущность, а не просто поле `url`;
- что один source не всегда подтверждает всю запись целиком;
- что trust level нельзя придумывать;
- что internal summary не заменяет внешний origin;
- что при конфликте источник должен участвовать в review logic, а не маскироваться.

Этот файл должен стать одной из главных антихаосных опор evidence-layer.

## Открытые вопросы

- насколько рано выносить source-to-field mapping в полностью отдельную relation model;
- как лучше хранить archived snapshots official pages;
- нужен ли later отдельный freshness score для sources;
- как глубоко field-level provenance нужно держать уже на MVP-этапе.