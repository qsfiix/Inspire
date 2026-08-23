Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать правила качества данных на уровне SQL-слоя Inspirella, чтобы таблицы, views, импорты и future automation поддерживали чистую, устойчивую и доверительную базу данных
Related Files:
- ../Data Model.md
- ../Field Dictionary.md
- ../Sources.md
- ../Validation Rules.md
- ../Import Rules.md
- ../Coverage.md
- ../Entities/School.md
- ../Entities/Program.md
- ../Entities/Source.md
- ../Entities/Location.md

# SQL Quality Rules

## Зачем нужен этот файл

Этот файл нужен для того, чтобы зафиксировать quality rules именно на уровне SQL/data-storage слоя Inspirella.

Если:
- `Validation Rules.md` отвечает на вопрос, как понимать, что запись логически годна;
- `Import Rules.md` отвечает на вопрос, как данные попадают в систему;

то `SQL/Quality Rules.md` отвечает на другой, более технический вопрос:

> как сама база данных должна быть устроена и защищена, чтобы слабые, противоречивые и хаотичные данные не разрушали систему изнутри.

Этот файл нужен, чтобы:
- поддерживать чистоту SQL-слоя;
- уменьшать количество мусора уже на уровне хранения;
- не допускать silent quality degradation;
- упростить future QA, views, analytics и AI workflows;
- сделать качество данных не только продуктовым пожеланием, а встроенным свойством базы.

---

## Главная идея quality в SQL-слое

Inspirella не должна строиться на логике:

> «сначала запишем всё как попало, потом когда-нибудь разберёмся».

Правильная логика такая:

> **SQL-слой должен сам поддерживать базовую дисциплину данных: структуру, согласованность, traceability и защиту от самых опасных типов загрязнения.**

Это не значит, что база должна быть чрезмерно жёсткой и ломать гибкость MVP.

Это значит, что она должна:
- сохранять скорость роста;
- но не позволять хаосу становиться нормой.

---

## Что в Inspirella считается quality problem на уровне SQL

Ниже — главные проблемы, от которых база должна защищаться.

### 1. Structural garbage
Когда поля формально существуют, но их типы, форматы или назначения перепутаны.

### 2. Identity ambiguity
Когда невозможно понять, что за объект хранится и как его отличать от других.

### 3. Duplicate pollution
Когда одна и та же сущность создаётся несколько раз под slightly different naming.

### 4. Weak provenance
Когда значения есть, но непонятно, откуда они взялись и можно ли им доверять.

### 5. Silent inconsistency
Когда разные таблицы, поля и записи противоречат друг другу, но это нигде не ловится.

### 6. Low-usability completeness
Когда запись technically сохранена, но practically слишком пустая для реального продукта.

---

# 1. Основные принципы качества на уровне SQL

## Принцип 1. Каноническая структура важнее удобного хаоса

Если сущность имеет каноническую модель, SQL-слой должен её поддерживать.

Это означает:
- предсказуемые поля;
- предсказуемые типы;
- controlled values там, где это критично;
- минимум случайных ad-hoc structure решений.

## Принцип 2. Лучше допустить controlled provisional data, чем бесконтрольный мусор

База должна позволять:
- raw/staging слой;
- provisional записи;
- review-needed записи;

но эти состояния должны быть явными.

## Принцип 3. Provenance must survive storage

Если запись попала в базу, не должно теряться понимание:
- откуда она пришла;
- когда;
- каким процессом;
- насколько ей можно доверять.

## Принцип 4. SQL quality checks должны быть объяснимыми

Любая quality-защита должна иметь смысл:
- не просто усложнять запись;
- а реально защищать качество и usability данных.

## Принцип 5. Не всё надо жёстко запрещать, но всё важное надо уметь пометить

Некоторые weak records можно сохранять в staging/provisional layers.

Но база должна уметь различать:
- сильные usable данные;
- слабые provisional;
- broken/invalid;
- duplicate-risk.

---

# 2. Quality rules for IDs and identity

## 2.1. Каждая каноническая сущность должна иметь стабильный первичный идентификатор

Для таблиц уровня:
- institutions
- programs
- professions
- resources
- sources

каждая запись должна иметь:
- стабильный `id`;
- уникальность внутри своей сущности;
- независимость от display title.

## 2.2. ID не должен зависеть от легко меняемых display fields

Например:
- title может меняться;
- нормализация названия может меняться;
- официальный бренд может обновляться.

ID должен переживать такие изменения.

## 2.3. Duplicate identity must be detectable

Даже если SQL не всегда может hard-block every duplicate, база должна поддерживать логику, при которой дубль можно обнаружить через:
- same website;
- same source identity;
- normalized location + title similarity;
- canonical keys.

---

# 3. Quality rules for required fields

## 3.1. Не все поля обязательны одинаково

В SQL-слое полезно различать:

### Hard required
Без них запись не должна существовать как канонический объект.

Примеры:
- `id`
- entity type fields where relevant
- key title/identity fields

### Soft required
Желательны для usable/product-ready layer, но могут временно отсутствовать в staging/provisional layers.

Примеры:
- `description`
- `city`
- `website`
- `language_of_instruction`

### Derived / optional
Не должны блокировать запись.

Примеры:
- quality scores
- completeness scores
- internal ranking helpers

## 3.2. SQL-слой должен различать canonical и staging requirements

Очень важно не требовать одинаковой строгости от:
- raw import table;
- normalized canonical table;
- product-facing views.

Иначе либо база станет слишком ломкой, либо наоборот слишком слабой.

---

# 4. Quality rules for controlled values

## 4.1. Controlled vocabularies важны для ключевых классификаторов

Там, где это критично для продукта, SQL-слой должен стремиться к controlled values.

Примеры:
- `institution_type`
- `program_type`
- `trust_level`
- `status`
- `source_type`
- `country_code`

## 4.2. Свободный текст не должен подменять категориальные поля

Например:
- `institution_type = "top private business-focused future-ready school"` — плохая практика;
- для этого должны быть отдельные description/tags/notes.

## 4.3. Controlled values должны быть расширяемыми, но не хаотичными

Нужно избегать ситуации, где в базе одновременно живут:
- `university`
- `University`
- `uni`
- `higher_education_university`

для одного и того же смысла.

---

# 5. Quality rules for text fields

## 5.1. Title fields должны быть usable

`title` не должен быть:
- пустым;
- мусорным;
- равным URL;
- слишком общим без entity identity.

## 5.2. Description fields не должны быть pure noise

Description может быть краткой, но не должна быть:
- пустым marketing fluff;
- дублированием title;
- случайным обрывком страницы;
- нечитабельным raw dump.

## 5.3. SQL-слой должен допускать richer text, но продуктовые views должны очищать шум

База может хранить richer content,
но product-facing layer должен стремиться к clean usable output.

---

# 6. Quality rules for URLs and contact fields

## 6.1. Website URLs должны быть валидными

База должна стремиться отсекать:
- malformed URLs;
- meaningless placeholders;
- broken obvious garbage values.

## 6.2. Official website и weak directory page нельзя смешивать в одном поле

Если `website` — это primary institutional site,
то weak directory pages должны жить отдельно как sources, а не подменять main website.

## 6.3. Contact fields должны быть храниться в предсказуемом виде

Например:
- email как email;
- phone как phone string;
- без смешивания с description/notes.

---

# 7. Quality rules for location data

## 7.1. География должна быть логически согласованной

Нельзя допускать silent contradictions между:
- country;
- canton/region;
- city;
- address;
- coordinates.

## 7.2. Coordinates без проверки могут быть опаснее отсутствия

Если координаты ненадёжны, лучше provisional/null,
чем точка, которая ломает карту и вводит пользователя в заблуждение.

## 7.3. Country and region values должны быть пригодны для масштабирования

SQL-слой должен поддерживать международный рост,
а не быть жёстко пришитым только под один локальный формат.

---

# 8. Quality rules for source provenance

## 8.1. Каждая сильная каноническая запись должна иметь source support

На SQL-уровне важно, чтобы можно было связать запись с source layer.

## 8.2. Provenance не должна теряться при normalizing/updating

Если raw values были cleaned or normalized,
нужно сохранять возможность понять origin.

## 8.3. Derived data должна быть отличима от source-of-truth data

Например:
- internal summary;
- normalized labels;
- quality score;
- confidence score

не должны путаться с raw externally evidenced fields.

---

# 9. Quality rules for duplicates

## 9.1. SQL-слой должен уменьшать вероятность silent duplicates

Не обязательно всё жёстко блокировать, но база должна поддерживать anti-duplicate logic.

### Особенно важно для:
- institutions
- programs
- sources
- resources

## 9.2. Duplicate risk indicators worth tracking

- same normalized website
- same normalized title + city
- same source URL + same entity type
- same coordinates + same address

## 9.3. Лучше duplicate flags и review, чем скрытые дубли в public layer

Если hard-blocking рано внедрять опасно,
то хотя бы:
- duplicate candidates;
- merge review flags;
- canonical/alias logic

должны позже поддерживаться архитектурно.

---

# 10. Quality rules for statuses

## 10.1. Статусы качества должны быть явными

SQL-слой должен позволять различать хотя бы:
- draft
- provisional
- review_needed
- usable
- verified
- archived / rejected

## 10.2. Не всякая сохранённая запись должна быть public-facing

Это один из самых важных принципов.

Сохранение в базе ≠ готовность для продукта.

## 10.3. Product-facing views должны preferentially использовать strong statuses

То есть база может хранить широкий спектр состояния записей,
но пользовательский слой должен работать прежде всего с более сильными данными.

---

# 11. Quality rules for staging vs canonical vs public layers

## 11.1. Staging layer

Можно хранить:
- более сырые данные;
- неполные значения;
- provisional imports;
- candidate duplicates.

Но этот слой не должен автоматически считаться чистой базой.

## 11.2. Canonical layer

Здесь должны жить:
- уже нормализованные сущности;
- понятные identity fields;
- controlled classifications;
- usable provenance logic.

## 11.3. Public/product-facing layer

Этот слой должен быть самым строгим по качеству.

Потому что именно здесь данные влияют на:
- пользовательское доверие;
- карту;
- рекомендации;
- сравнение;
- ощущение качества Inspirella.

---

# 12. Quality rules for timestamps and auditability

## 12.1. Важные записи должны иметь понятный time context

Полезно поддерживать поля уровня:
- `created_at`
- `updated_at`
- `retrieved_at`
- `last_verified_at`
- `last_checked_at`

## 12.2. Freshness matters

Даже сильные данные со временем стареют.

SQL-слой должен поддерживать идею того, что freshness — это часть качества.

## 12.3. Updates не должны стирать важную историю silently

В долгосрочной перспективе очень полезно сохранить хотя бы частичную auditability:
- что изменилось;
- почему;
- на основе какого source.

---

# 13. Quality rules for future AI-agent interaction

Будущие ИИ-агенты должны работать не против SQL-качества, а вместе с ним.

## 13.1. Агент не должен записывать guessed values как hard truth

Если значение uncertain, оно должно:
- оставаться пустым;
- идти в provisional field/state;
- сопровождаться notes/review logic.

## 13.2. Агент не должен обходить controlled vocabularies случайным текстом

Если поле controlled, агент должен использовать канонические значения.

## 13.3. Агент не должен разрушать provenance layer

Любые normalized/derived changes должны сохранять связь с source logic.

## 13.4. Агент должен уважать public vs staging separation

Не всё, что найдено, должно instantly become user-facing truth.

---

# 14. Recommended SQL quality checks by priority

Ниже — practical priority order.

## Priority 1 — must have
- stable IDs
- usable status fields
- controlled key enums
- valid website/basic URL hygiene
- traceable source linkage
- no broken critical nulls in canonical layer

## Priority 2 — highly recommended
- duplicate risk detection
- normalized location consistency
- freshness-related timestamps
- product-facing filtering by quality state

## Priority 3 — mature system layer
- quality scores
- completeness scores
- freshness scores
- field-level provenance
- automated anomaly detection

---

# 15. What “high quality data” means in SQL terms for Inspirella

На уровне SQL high quality data — это не просто «заполненные строки».

Это записи, которые:
- имеют ясную identity;
- структурно чисты;
- source-backed;
- логически непротиворечивы;
- пригодны для product-facing use;
- поддерживают долгосрочный рост системы без хаоса.

---

# 16. SQL quality and Inspirella mission

Для Inspirella SQL quality — это не просто инженерная аккуратность.

Это один из слоёв реальной ответственности перед пользователем.

Если база:
- грязная;
- противоречивая;
- нетрассируемая;
- переупрощённая,

то всё остальное начинает терять силу:
- карта;
- выбор;
- персонализация;
- доверие;
- реалистичность путей.

А если SQL-слой чистый и disciplined,
то он становится частью той самой ясности, на которой держится вся философия Inspirella.

---

# 17. Что логично после этого файла

После `SQL/Quality Rules.md` особенно логично продолжать:

1. `SQL/Data Pipeline.md`
2. `SQL/Coverage.md`

Потому что теперь после quality rules нужно зафиксировать:
- как данные двигаются по системе;
- как выглядят этапы pipeline;
- как понимать, что у нас уже покрыто хорошо, а где база пока ещё редкая и неполная.

## Открытые вопросы

- насколько рано закладывать отдельные SQL constraints против business-rule validation;
- какие quality checks лучше держать в DB layer, а какие в app/import layer;
- нужен ли later отдельный materialized quality view;
- как глубоко уже на MVP-этапе хранить audit trail field-by-field.