Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать, как данные проходят через Inspirella от обнаружения и импорта до нормализованного, проверенного и product-facing слоя, чтобы база росла структурированно, прозрачно и без хаоса
Related Files:
- ../Data Model.md
- ../Field Dictionary.md
- ../Sources.md
- ../Validation Rules.md
- ../Import Rules.md
- ./Quality Rules.md
- ./Coverage.md
- ../Entities/School.md
- ../Entities/Program.md
- ../Entities/Source.md
- ../Entities/Location.md

# Data Pipeline

## Зачем нужен этот файл

Этот файл нужен для того, чтобы описать data pipeline Inspirella как целостную систему.

Если:
- `Data Model.md` объясняет, какие сущности существуют;
- `Import Rules.md` объясняет, как данные входят в систему;
- `Validation Rules.md` объясняет, как они проверяются;
- `SQL/Quality Rules.md` объясняет, как база должна поддерживать качество;

то `Data Pipeline.md` отвечает на вопрос:

> как весь этот процесс выглядит как единый поток данных от первого источника до конечного использования в продукте.

Этот файл нужен, чтобы:
- не мыслить данные кусками;
- видеть полный lifecycle записи;
- понимать, где именно происходит импорт, нормализация, проверка, review и публикация;
- подготовить ясный контур для будущих ИИ-агентов и автоматизации;
- уменьшить хаос при росте объёма данных и числа workflows.

---

## Краткое определение data pipeline

**Data pipeline Inspirella — это последовательная система стадий, через которые проходят данные: от обнаружения источника и извлечения сырой информации до канонической нормализации, проверки, review, сохранения и использования в пользовательском продукте.**

Коротко:

> pipeline нужен для того, чтобы данные не просто попадали в базу, а проходили понятный, контролируемый путь к качеству и полезности.

---

## Главная идея pipeline Inspirella

Inspirella не должна работать по логике:

> «нашли данные → сразу записали → потом как-нибудь разберёмся».

Правильная логика такая:

> **каждая запись должна проходить через понятный путь, где на каждом этапе ясно, что именно с ней происходит, почему и в каком она состоянии.**

Это особенно важно, потому что Inspirella строится на сочетании трёх опор:
- персонализация;
- качество данных;
- низко-хаотичная информационная архитектура.

Без pipeline эти опоры быстро начинают разрушаться:
- данные становятся неоднородными;
- provenance теряется;
- review превращается в хаос;
- public layer становится менее надёжным;
- ИИ-агенты начинают работать по-разному и непредсказуемо.

---

# 1. Главные стадии pipeline

Ниже — каноническая логика движения данных в Inspirella.

## Stage 0. Discovery

### Что происходит
На этом этапе система или человек обнаруживает потенциально полезный объект:
- institution / school;
- program;
- resource;
- profession;
- source;
- другой релевантный data candidate.

### Главный вопрос этапа

> это вообще объект, который имеет смысл заводить в систему Inspirella?

### На этом этапе важно
- оценить релевантность;
- понять тип сущности;
- понять силу источника;
- не путать сущность с просто страницей, текстом или маркетинговым шумом.

### Выход этапа
- кандидат допущен к extraction;
- либо отклонён как нерелевантный/слишком слабый.

---

## Stage 1. Extraction

### Что происходит
Из источника извлекаются raw values.

Примеры:
- title;
- address;
- website;
- contact info;
- description fragments;
- program name;
- language info;
- admission snippets.

### Главный вопрос этапа

> что именно источник реально говорит, ещё до нашей интерпретации?

### На этом этапе важно
- не подменять raw extraction выводами;
- не заполнять пробелы догадками;
- сохранять traceability;
- по возможности удерживать raw context.

### Выход этапа
Сырые поля или raw candidate object.

---

## Stage 2. Source Linking

### Что происходит
Raw-данные связываются с source layer.

### Главный вопрос этапа

> откуда пришли эти значения и насколько этому можно доверять?

### Что нужно зафиксировать
- `source_type`;
- `source_name`;
- `source_url`;
- `trust_level`;
- `retrieved_at`;
- к каким сущностям и полям относится источник.

### Почему этот этап критичен
Без него запись становится «данными без происхождения», а это противоречит самой логике Inspirella.

### Выход этапа
Raw object с привязанным provenance layer.

---

## Stage 3. Normalization

### Что происходит
Сырые данные приводятся к канонической модели Inspirella.

### Примеры
- свободные формулировки типа организации → `institution_type`;
- хаотичные language labels → controlled values;
- legacy `schools` → canonical institution logic;
- noisy description → usable neutral summary;
- разные форматы адресов → единая address structure.

### Главный вопрос этапа

> как привести данные к ясной и устойчивой модели, не исказив смысл?

### На этом этапе важно
- усиливать ясность;
- уменьшать хаос;
- не терять source trace;
- не выдавать uncertainty за факт.

### Выход этапа
Normalized candidate.

---

## Stage 4. Entity Mapping

### Что происходит
Система определяет, в какую каноническую сущность ложится объект.

### Примеры
- institution / school;
- program;
- profession;
- resource;
- source.

### Главный вопрос этапа

> чем именно является этот объект в модели Inspirella?

### Почему это важно
Это защищает систему от типичной путаницы:
- institution vs program;
- resource vs source;
- profession vs interest tag;
- school vs general organization mention.

### Выход этапа
Объект mapped к нужной сущности и структуре.

---

## Stage 5. Validation

### Что происходит
Normalized candidate проходит проверку по validation rules.

### Проверки включают
- identity;
- structure;
- source adequacy;
- consistency;
- usability;
- duplicate risk.

### Главный вопрос этапа

> можно ли этой записи разумно доверять и насколько она пригодна для системы?

### Возможные результаты
- `usable`
- `provisional`
- `review_needed`
- `invalid`

### Выход этапа
Validated candidate с assigned status.

---

## Stage 6. Deduplication / Matching

### Что происходит
Кандидат сравнивается с уже существующими сущностями.

### Главный вопрос этапа

> это новая запись или, возможно, уже существующая сущность под другим видом?

### Особенно важно проверять
- website;
- normalized title;
- address/location;
- source overlap;
- coordinates;
- institution/program context.

### Возможные исходы
- это новая сущность;
- это дубль;
- это uncertain duplicate candidate;
- это update existing entity.

### Выход этапа
Object either:
- создаётся как новая сущность;
- объединяется;
- идёт в review.

---

## Stage 7. Layer Assignment

### Что происходит
Запись направляется в правильный слой хранения.

### Возможные слои
- staging layer;
- canonical entity layer;
- review queue;
- public/product-facing layer.

### Главный вопрос этапа

> в каком слое этой записи место на текущем этапе качества?

### Почему это важно
Сохранение в базе не должно автоматически значить, что запись уже готова для пользователя.

### Выход этапа
Entity placed in the correct layer.

---

## Stage 8. Persistence

### Что происходит
Запись сохраняется в нужные SQL-таблицы / views / workflow layers.

### Что важно
- сохранить canonical form;
- сохранить provenance;
- сохранить timestamps;
- сохранить статус;
- не потерять связи между сущностями.

### Выход этапа
Structured stored record.

---

## Stage 9. Review / Enrichment

### Что происходит
Weak, conflicting or incomplete records дорабатываются.

### Когда это нужно
- source conflict;
- missing key fields;
- duplicate uncertainty;
- weak description;
- incomplete location;
- ambiguous program identity.

### Главный вопрос этапа

> что нужно улучшить, чтобы запись поднялась на более сильный уровень качества?

### Выход этапа
- запись усиливается;
- остаётся provisional;
- отклоняется;
- переводится в usable.

---

## Stage 10. Product-Facing Use

### Что происходит
Только достаточно сильные записи попадают в пользовательский опыт.

### Это может быть
- карта;
- карточки institutions;
- filtering and search;
- recommendation logic;
- comparison flows;
- route-building experience.

### Главный вопрос этапа

> достаточно ли запись сильна, чтобы влиять на пользовательский выбор?

### Важный принцип
Product layer должен использовать прежде всего более надёжные данные, а не все записи подряд.

---

# 2. Главные pipeline layers в Inspirella

Для ясности полезно мыслить систему не только как последовательность стадий, но и как набор слоёв.

## 2.1. Source layer
Слой происхождения и evidence.

Здесь хранятся:
- source entities;
- source metadata;
- trust logic;
- freshness context.

## 2.2. Raw / Staging layer
Слой сырых или полуобработанных кандидатов.

Здесь можно хранить:
- raw extracted values;
- uncertain candidates;
- provisional objects;
- import artifacts.

## 2.3. Canonical entity layer
Основной нормализованный слой.

Здесь живут:
- institutions;
- programs;
- professions;
- resources;
- location structures;
- связи между ними.

## 2.4. Review layer
Слой конфликтов, дублей, слабых записей и pending decisions.

## 2.5. Product-facing layer
Views / projections / curated outputs для:
- UI;
- карты;
- рекомендаций;
- search/filtering.

---

# 3. Как pipeline должен работать для разных сущностей

## Institution / School pipeline
Особенно важны:
- source quality;
- address/location normalization;
- website verification;
- duplicate control between `schools` and canonical `institutions`.

## Program pipeline
Особенно важны:
- parent institution link;
- program type clarity;
- admission/language consistency;
- separation of program from broad study area.

## Profession pipeline
Особенно важны:
- semantic clarity;
- source strength;
- distinction between profession and vague tag/category.

## Resource pipeline
Особенно важны:
- category clarity;
- URL quality;
- distinction between user-facing resource and evidence source.

## Source pipeline
Особенно важны:
- trust level;
- applicability to fields;
- freshness;
- traceability.

---

# 4. Pipeline and statuses

Pipeline должен не просто двигать данные, но и делать состояние записи прозрачным.

### Recommended statuses across pipeline
- `discovered`
- `extracted`
- `source_linked`
- `normalized`
- `validated`
- `usable`
- `provisional`
- `review_needed`
- `invalid`
- `archived_rejected`

Не обязательно, что все эти статусы сразу лягут в точности как SQL-enum, но концептуально эта логика очень полезна.

---

# 5. Что future AI agents должны делать внутри pipeline

Будущие ИИ-агенты должны не просто «добавлять данные», а уметь понимать, на какой стадии pipeline они работают.

## Агент discovery
Находит релевантные объекты и strong sources.

## Агент extraction
Достаёт raw fields без излишней интерпретации.

## Агент normalization
Приводит данные к канонической модели.

## Агент validation
Проверяет quality, consistency и usability.

## Агент review
Разбирает конфликты, duplicate risk и weak records.

## Агент enrichment
Усиливает записи после того, как identity and trust уже понятны.

### Важный принцип

Лучше несколько понятных ролей внутри pipeline,
чем один агент, который одновременно:
- находит;
- угадывает;
- нормализует;
- публикует;
- и сам себе верит.

---

# 6. Где pipeline особенно легко ломается

Ниже — самые опасные точки.

## 6.1. Discovery without relevance filtering
Слишком много weak candidates.

## 6.2. Extraction without provenance
Есть поля, но непонятно откуда.

## 6.3. Normalization that invents certainty
Догадки превращаются в якобы clean data.

## 6.4. Validation skipped for speed
База быстро растёт, но теряет trust.

## 6.5. Deduplication ignored
Появляются множественные почти одинаковые сущности.

## 6.6. Public layer fed from weak data
Пользователь видит сырой или противоречивый слой.

---

# 7. Pipeline and SQL architecture

Pipeline должен later удобно ложиться на SQL-архитектуру.

### В practical terms это значит
- иметь staging-friendly слой;
- иметь canonical tables;
- иметь review flags / workflow fields;
- иметь product-facing views;
- иметь timestamps и provenance hooks.

Pipeline не обязан полностью жить внутри SQL, но SQL должен поддерживать его логику, а не мешать ей.

---

# 8. Pipeline and quality growth over time

Одна из сильных сторон Inspirella должна быть в том, что качество базы не просто есть или нет, а **растёт по мере прохождения pipeline**.

Хороший pipeline позволяет:
- начинать с imperfect inputs;
- усиливать записи;
- не терять source context;
- постепенно переводить больше данных в usable layer.

То есть pipeline — это не только фильтр, но и механизм постепенного укрепления базы.

---

# 9. Pipeline and Inspirella mission

Для Inspirella pipeline — это не сухая backend-схема.

Это один из инфраструктурных слоёв той самой миссии проекта:
- помогать человеку находить реальный путь;
- опираться на качественные данные;
- уменьшать хаос;
- делать выбор более ясным и надёжным.

Если pipeline слабый:
- хаос проникает в базу;
- доверие к рекомендациям падает;
- персонализация строится на шатком фундаменте.

Если pipeline сильный:
- база растёт осмысленно;
- карта и выбор становятся надёжнее;
- продукт становится ближе к своей большой цели — реально помогать людям через качество и структуру.

---

# 10. Что логично после этого файла

После `Data Pipeline.md` очень логично переходить к:

1. `Coverage.md`

Потому что после того, как мы описали:
- сущности;
- источники;
- validation;
- import rules;
- SQL quality;
- pipeline,

нам осталось зафиксировать ещё один важный слой:

> как понимать, насколько хорошо база вообще покрывает нужное пространство и где у нас ещё большие пробелы.

## Открытые вопросы

- насколько рано formalize pipeline statuses прямо в БД;
- какие стадии лучше оставить в app/workflow logic, а какие later перенести в SQL layer;
- нужен ли later отдельный review table для duplicate/conflict handling;
- стоит ли later разделить pipeline for institutions/programs/professions ещё жёстче на уровне архитектуры.