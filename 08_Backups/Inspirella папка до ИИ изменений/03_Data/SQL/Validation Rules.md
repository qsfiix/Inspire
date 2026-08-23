Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать правила валидации данных Inspirella, чтобы было понятно, как проверяются записи, какие ошибки считаются критичными, когда запись считается usable или review-needed, и по каким принципам будущие ИИ-агенты, импорт и ручная работа должны оценивать качество данных
Related Files:
- ./Data Model.md
- ./Field Dictionary.md
- ./Sources.md
- ./Import Rules.md
- ./Quality Rules.md
- ./Coverage.md
- ./Entities/School.md
- ./Entities/Program.md
- ./Entities/Source.md

# Validation Rules

## Зачем нужен этот файл

Этот файл фиксирует правила валидации данных Inspirella.

Если:
- `Data Model.md` объясняет, какие сущности существуют;
- `Field Dictionary.md` описывает поля;
- `Sources.md` определяет, каким источникам мы доверяем;

то `Validation Rules.md` отвечает на вопрос:

> как именно понять, что конкретная запись достаточно корректна, структурирована и надёжна для использования в продукте.

Этот файл нужен, чтобы:
- не превращать валидацию в интуитивный хаос;
- отделять сильные записи от слабых;
- заранее фиксировать критерии usable/provisional/review-needed data;
- помочь будущим ИИ-агентам проверять данные одинаково, а не каждый раз по-разному;
- подготовить почву для автоматической и полуавтоматической проверки.

---

## Главная идея валидации Inspirella

Inspirella строится не вокруг принципа:

> «если запись хоть как-то похожа на правду, значит её можно использовать».

Наоборот, базовая логика такая:

> **запись должна пройти понятный набор проверок на идентичность, структуру, верифицируемость и полезность.**

Важно понимать:
- валидация — это не то же самое, что полнота;
- валидация — это не то же самое, что source trust;
- валидация — это не только технический формат;
- валидация — это проверка того, можно ли разумно опираться на запись в продукте.

---

## Что означает “валидная запись”

Запись считается валидной, если:

1. понятно, **что это за сущность**;
2. у неё есть достаточный набор полей для идентификации;
3. значения полей не противоречат друг другу;
4. ключевые поля подтверждаемы через приемлемые источники;
5. запись достаточно чистая, чтобы не ломать продуктовый опыт;
6. нет сильного сигнала, что это дубль, ошибка импорта или выдуманная структура.

---

## Главные уровни validation outcome

Для Inspirella полезно разделять не просто `valid/invalid`, а несколько состояний.

### 1. `usable`
Запись можно использовать в продукте.

Это не значит, что она идеальна, но она:
- достаточно чистая;
- понятная;
- не выглядит опасной для UX;
- не несёт критичных противоречий.

### 2. `provisional`
Запись частично пригодна, но требует осторожности.

Она может:
- отображаться ограниченно;
- участвовать в внутренней работе;
- использоваться как промежуточная,

но не должна автоматически считаться fully trusted / verified.

### 3. `review_needed`
Запись требует отдельной проверки.

Например:
- конфликт источников;
- сомнительный тип сущности;
- слабая география;
- непонятный website;
- подозрение на дубль.

### 4. `invalid`
Запись нельзя считать пригодной.

Причины:
- критически не хватает identity fields;
- данные противоречивы;
- источник слишком слабый;
- запись не относится к нужной сущности;
- ошибка структуры слишком сильная.

---

# 1. Базовые принципы валидации

## Принцип 1. Сначала identity, потом enrichment

Сначала нужно понять:
- кто это;
- что это;
- где это;
- можно ли это проверить.

И только потом имеет смысл думать о richer fields:
- tags;
- summaries;
- recommendation hints;
- quality scoring.

## Принцип 2. Формат без смысла не считается настоящей валидацией

Даже если поле выглядит syntactically correct, этого недостаточно.

Пример:
- валидный URL, который ведёт не на официальный сайт;
- адрес, который формально похож на адрес, но не подтверждается;
- title, который есть, но не позволяет понять сущность.

## Принцип 3. Противоречие сильнее неполноты

Неполная запись может быть provisional.

Но если запись содержит сильное противоречие, это опаснее, чем простая нехватка полей.

## Принцип 4. Validation должна быть объяснимой

Если запись помечена как invalid или review-needed, должно быть понятно почему.

## Принцип 5. Будущие ИИ-агенты должны валидировать консервативно

Если есть сомнение, лучше:
- понизить статус до provisional;
- отправить в review;
- оставить поле пустым,

чем уверенно принять слабое или выдуманное значение.

---

# 2. Основные типы validation checks

Для Inspirella удобно разделять проверки на несколько групп.

## 2.1. Identity validation

Проверяет:
- можно ли однозначно понять сущность;
- есть ли стабильный `id`;
- есть ли понятный `title`;
- есть ли `institution_type` / `program_type` / другой ключевой классификатор.

### Failure examples
- у записи нет понятного названия;
- тип сущности неясен;
- невозможно отличить institution от resource;
- запись выглядит как “кусок текста”, а не как объект данных.

---

## 2.2. Structural validation

Проверяет:
- соответствуют ли поля ожидаемой структуре;
- нет ли грубых type mismatches;
- нет ли сломанной локализации;
- нет ли неожиданных пустых critical fields.

### Failure examples
- `languages_of_instruction` хранится как хаотичная строка вместо списка/канонического значения;
- `latitude`/`longitude` не числа;
- `website` лежит в `description`;
- `country_code` заполнен свободным текстом вместо канонического кода.

---

## 2.3. Source-backed validation

Проверяет:
- можно ли связать запись с хотя бы одним приемлемым источником;
- соответствует ли сила источника критичности поля;
- нет ли ложной уверенности при слабом source layer.

### Failure examples
- critical fields взяты из weak source без подтверждения;
- запись выглядит verified, но source trail неясен;
- admission requirements взяты из сомнительного каталога.

---

## 2.4. Consistency validation

Проверяет:
- согласуются ли поля между собой;
- не противоречат ли location, type, website, language и прочие элементы друг другу.

### Failure examples
- website ведёт на institution из другой страны;
- city и address не совпадают;
- тип школы конфликтует с официальным описанием;
- языки обучения не соответствуют institution profile.

---

## 2.5. Usability validation

Проверяет:
- можно ли запись безопасно и полезно показывать пользователю;
- достаточно ли она понятна для карточки, списка, карты, фильтров.

### Failure examples
- institution есть, но description настолько пустое, что запись неинформативна;
- нет usable title;
- нет geographic context для карты;
- нет ни одного meaningful field кроме имени.

---

## 2.6. Deduplication validation

Проверяет:
- не является ли запись дублем другой;
- не описывает ли она уже существующий institution под slightly different naming.

### Failure examples
- одинаковый website у двух записей;
- одинаковый адрес и почти одинаковый title;
- schools/institutions продублированы в legacy и canonical layer.

---

# 3. Validation rules for Institution / School

## 3.1. Minimum identity requirements

Для institution/school запись должна иметь минимум:
- `id`
- `title`
- `institution_type`
- `country_code`
- `city` или `address`
- `website` или другой strong reference

Если этого нет, запись не должна считаться `usable`.

---

## 3.2. Title validation

### Хороший `title`
- понятный;
- не пустой;
- не выглядит как raw import мусор;
- не состоит только из общих слов типа `School Page`, `Institution`, `Profile`.

### Warning cases
- all caps без причины;
- title содержит URL;
- title выглядит как дублирование address line;
- title слишком общий и не позволяет различить организацию.

---

## 3.3. Institution type validation

`institution_type` должен:
- быть из controlled vocabulary;
- соответствовать описанию и source context;
- не подменяться вольной формулировкой.

### Invalid examples
- `institution_type = best school ever`
- тип отсутствует при otherwise strong record;
- тип противоречит official page.

---

## 3.4. Address and location validation

### Минимальные требования
- location должна быть хотя бы на уровне city или полного address;
- если есть `canton`, он должен быть согласован с city/address для CH;
- если есть coordinates, они должны быть валидными.

### Good signs
- address подтверждён официальным сайтом;
- city согласуется с address;
- coordinates попадают в разумную географию.

### Warning signs
- адрес слишком общий;
- coordinates находятся в другой стране/регионе;
- city и website content не совпадают.

---

## 3.5. Website validation

`website` должен:
- быть валидным URL;
- вести на institutional or official domain;
- содержательно относиться к данной организации.

### Critical failures
- broken or malformed URL;
- URL ведёт на unrelated domain;
- URL является только directory page, но помечен как official;
- website отсутствует, и нет равноценного strong reference.

---

## 3.6. Description validation

`description` не обязана быть длинной, но должна быть:
- понятной;
- нейтральной;
- информативной;
- не полностью рекламной;
- не бессодержательной.

### Weak description examples
- `Great school`;
- `Top quality education`;
- пустой marketing fluff без фактов;
- просто copy-paste title.

---

## 3.7. Contact validation

### Email
- валидный email format;
- желательно institutional domain;
- не выглядит случайным.

### Phone
- желательно международный формат;
- не содержит явного мусора;
- соответствует региону, если это возможно проверить.

Контакты полезны, но их отсутствие не всегда делает запись invalid, если identity/source layer достаточно сильные.

---

## 3.8. Source validation for school

Institution/school не должна считаться `verified` без strong source layer.

### Minimum acceptable logic
- либо есть official website;
- либо есть government/registry source;
- либо есть несколько согласованных medium-trust sources, если official пока не найден.

Если source layer слабый, статус записи должен быть понижен.

---

# 4. Validation rules for Program

Программа должна иметь минимум:
- `id`
- `institution_id` или другой ясный parent link;
- `title`
- `program_type`
- хотя бы один meaningful source

### Special checks
- программа действительно существует как program-like object, а не как marketing phrase;
- она связана с реальной institution;
- admission / duration / language не противоречат source page.

### Review triggers
- программа указана, но institution unclear;
- source page слишком общая;
- title программы ambiguous;
- тип программы неясен.

---

# 5. Validation rules for Profession

Поскольку `profession` более абстрактная сущность, валидация здесь должна быть осторожной.

Минимум:
- `id`
- `title`
- `category` или другой базовый классификатор
- понятное описание или хотя бы ясный semantic identity
- source support достаточной силы

### Important rule
Profession не должна быть просто тегом, случайно превращённым в полноценную сущность.

---

# 6. Validation rules for Resource

Минимум для resource:
- `id`
- `title`
- `category`
- `url`
- достаточно ясное описание

### Важно
Нужно отдельно валидировать:
- resource как user-facing object;
- source strength этой страницы как evidence layer.

Потому что полезный resource может быть слабым evidence source, и наоборот.

---

# 7. Critical vs non-critical validation failures

## Critical failures
Если есть одно из этого, запись обычно не может быть `usable`:

- отсутствует identity minimum;
- сломан или неясен источник;
- website явно не тот;
- сущность неправильно классифицирована;
- сильное противоречие в стране/адресе/типе;
- запись выглядит как дубль с высокой вероятностью.

## Non-critical failures
Это может понизить trust или перевести запись в provisional, но не обязательно делает её invalid:

- не хватает phone;
- нет image;
- description короткое, но usable;
- missing secondary metadata;
- не хватает richer classification fields.

---

# 8. Validation states and recommended actions

## `usable`
### Когда ставить
- critical identity checks пройдены;
- source layer достаточный;
- грубых противоречий нет.

### Что делать дальше
- можно использовать в продукте;
- можно показывать пользователю;
- можно дальше улучшать quality.

## `provisional`
### Когда ставить
- запись частично сильная, но не всё подтверждено;
- часть полей слабая;
- source layer пока не идеален.

### Что делать дальше
- использовать осторожно;
- не маркировать как fully trusted;
- отправить в future enrichment/review.

## `review_needed`
### Когда ставить
- конфликт источников;
- странная классификация;
- сильное подозрение на дубль;
- questionable address/website match.

### Что делать дальше
- ручная проверка или отдельный review agent/workflow.

## `invalid`
### Когда ставить
- критическая нехватка identity;
- broken structure;
- weak/no evidence;
- сущность не соответствует модели.

### Что делать дальше
- не показывать как готовый объект;
- либо исправлять, либо архивировать/отклонять.

---

# 9. How future AI agents should validate data

Будущие ИИ-агенты должны следовать этим правилам.

## 1. Не считать заполненность равной качеству
Запись с множеством полей может быть хуже, чем короткая, но подтверждённая запись.

## 2. Не принимать слабые значения как факт
Если источник слабый или противоречивый, агент должен снижать статус, а не делать уверенный вывод.

## 3. Не скрывать uncertainty
Если есть сомнение, лучше:
- оставить поле пустым;
- отметить `provisional`;
- отправить в review.

## 4. Не игнорировать semantic mismatches
Если website, type и description не складываются в одну реальность, это повод для warning.

## 5. Валидировать по сущности, а не только по формату
Важно не только что поле syntactically correct, но и что оно logically fits the entity.

## 6. Не раздувать auto-verification
Если запись не проходит strong checks, агент не должен artificially поднимать её до `verified`.

---

# 10. Recommended validation order

Практически лучше валидировать запись в таком порядке:

1. **Entity check** — что это вообще за сущность
2. **Identity check** — есть ли id/title/type
3. **Source check** — есть ли приемлемый источник
4. **Location / website / contact check**
5. **Consistency check**
6. **Deduplication check**
7. **Usability check**
8. **Final status assignment**

Так validation становится стабильной и объяснимой.

---

# 11. Validation and Inspirella mission

Для Inspirella валидация — это не сухая техническая бюрократия.

Она нужна потому, что проект обещает пользователю:
- ясность;
- структуру;
- качественные данные;
- поддержку;
- реалистичный путь, а не информационный шум.

Если validation слабая, то:
- ясность превращается в иллюзию;
- доверие к продукту падает;
- персонализация начинает работать на грязном фундаменте.

Поэтому сильная validation layer — это одна из форм реальной ответственности перед пользователем.

---

# 12. Что логично после этого файла

После `Validation Rules.md` особенно логично продолжать:

1. `Import Rules.md`
2. `Quality Rules.md`
3. `Coverage.md`

Потому что теперь у нас уже есть:
- модель;
- поля;
- school logic;
- source hierarchy;
- validation logic.

Следующий уровень — зафиксировать:
- как данные попадают в систему;
- как оценивать их общий quality layer;
- как понимать, где у нас coverage сильное, а где ещё пустоты.

## Открытые вопросы

- нужен ли отдельный completeness score рядом с validation status;
- какие проверки можно будет автоматизировать раньше всего;
- как глубоко уже в MVP разделять validation at field level и validation at entity level;
- нужен ли отдельный review workflow для high-value institutions/programs.