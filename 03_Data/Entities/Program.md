Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать, что в Inspirella считается program, как program соотносится с institution, profession и пользовательским путём, а также какие требования применяются к программным записям в данных, импорте, проверке и продукте
Related Files:
- ../Data Model.md
- ../Field Dictionary.md
- ../Sources.md
- ../Validation Rules.md
- ../Import Rules.md
- ./School.md
- ./Location.md
- ./Source.md

# Program

## Зачем нужен этот файл

Этот файл нужен для того, чтобы чётко зафиксировать, что именно в Inspirella считается program.

Это важно, потому что в образовательных данных очень легко смешать разные уровни:
- institution;
- program;
- degree;
- track;
- subject area;
- profession pathway;
- marketing wording с сайта.

Без ясного определения program проект быстро получает хаос:
- программы смешиваются с учреждениями;
- один и тот же объект описывается на разных уровнях детализации;
- admission logic становится нечёткой;
- персонализация начинает рекомендовать не реальные образовательные пути, а случайные названия.

Этот файл должен ответить на вопрос:

> что в Inspirella считается program, какие признаки у программы обязательны и когда program-запись достаточно сильна для использования в продукте.

---

## Краткое определение

**Program в Inspirella — это конкретный образовательный путь, предложение обучения или структурированная единица образования, которую пользователь потенциально может выбрать внутри образовательной организации или системы.**

Коротко:

> program — это не просто тема или направление интереса, а реальный образовательный объект, который можно связать с institution, admission logic, уровнем обучения, языком, длительностью и потенциальным пользовательским маршрутом.

---

## Почему program — критически важная сущность

Для Inspirella program важна не меньше, чем school/institution.

Потому что пользователь часто выбирает не просто:
- «какую школу вообще посмотреть»,

а более конкретно:
- какую программу выбрать;
- какой учебный путь подойдёт;
- какой трек ведёт к нужной профессии;
- где требования реалистичны именно для него;
- какой вариант лучше совпадает с его интересами, уровнем и направлением.

Это особенно важно для долгосрочной миссии Inspirella, потому что персонализация должна со временем опираться не только на institution-level слой, но и на program-level слой.

---

## Как program соотносится с institution

### Базовое правило

Program не существует в данных как полностью отдельный мир без контекста.

В большинстве случаев program должна быть связана с:
- конкретной institution;
- либо конкретным provider-level entity;
- либо, в редких случаях, с system-level offering, если это действительно самостоятельный образовательный путь.

### Практическая логика

- **institution** отвечает на вопрос: *где это обучение существует*;
- **program** отвечает на вопрос: *что именно там предлагается как путь обучения*.

### Важное следствие

Если есть institution без program, такая запись всё ещё может быть полезной.

Но если есть program без ясной institution context, её качество и применимость обычно сильно ниже.

---

## Что считается program

Запись может считаться program, если она соответствует большей части следующих признаков:

### 1. Это реальная единица образовательного предложения
Программа должна быть чем-то, что реально предлагается пользователю как путь обучения.

Примеры:
- bachelor program;
- master program;
- vocational training track;
- certificate program;
- preparatory program;
- apprenticeship-related path;
- specialization path внутри institution.

### 2. У неё есть понятный учебный смысл
Должно быть понятно:
- чему человек учится;
- на каком уровне;
- в каком формате;
- в каком контексте institution это существует.

### 3. Её можно связать с решением пользователя
Пользователь потенциально может:
- выбрать эту программу;
- сравнить её с другой;
- понять её требования;
- соотнести её с профессией или направлением.

### 4. Её можно подтвердить источником
У программы должен быть source trail:
- official program page;
- official admissions page;
- faculty page;
- institutional PDF/document;
- другой sufficiently strong source.

---

## Что не должно считаться program

Следующие объекты не должны автоматически считаться полноценной program-сущностью:

### 1. Просто broad field of interest
Например:
- `Science`
- `Business`
- `Arts`

Это может быть category, theme или user interest, но не обязательно program.

### 2. Просто профессия
`Doctor`, `Architect`, `Designer` — это не program сами по себе.

Они могут быть связаны с program, но не заменяют её.

### 3. Просто institution section
Если страница называется вроде `Study with us`, это ещё не означает, что внутри есть конкретная program-запись.

### 4. Просто marketing statement
Например:
- `Future-ready learning experience`
- `Top international education pathway`

Это не program, а рекламный слой.

### 5. Слишком размытый internal track без identity
Если нельзя понять:
- что это;
- где это;
- как это называется официально;

то это не сильная program-сущность.

---

## Основные типы program в Inspirella

Ниже — хороший канонический стартовый набор типов.

### 1. Degree program
Примеры:
- bachelor;
- master;
- doctoral pathway;
- diploma program.

### 2. Vocational program
Примеры:
- apprenticeship pathway;
- vocational education track;
- practical qualification route.

### 3. Certificate / short program
Примеры:
- certificate course;
- continuing education program;
- short specialized training.

### 4. Preparatory / foundation program
Примеры:
- foundation year;
- bridge program;
- admission preparation track.

### 5. Specialized track / concentration
Примеры:
- specialization inside a broader degree;
- internal study track;
- concentration path.

### Важное замечание

Не все программы одинаковы по масштабу.

Поэтому для Inspirella важно не только слово `program`, а ещё:
- тип программы;
- уровень;
- степень самостоятельности;
- степень готовности этой сущности к сравнению и recommendation logic.

---

## Как program связана с professions

Это одна из самых важных связей во всей системе.

Program должна помогать отвечать на вопрос:

> какой образовательный путь может вести пользователя к определённым профессиям или направлениям.

### Важно понимать

Связь `program → profession` редко бывает абсолютно жёсткой one-to-one.

Одна программа может вести:
- к нескольким возможным профессиональным путям;
- к группе related professions;
- к разным траекториям в зависимости от дальнейших шагов.

И наоборот:
- одна profession может быть достижима через несколько разных programs.

### Практический вывод

Для Inspirella лучше мыслить это как:
- many-to-many relationship;
- с возможностью later добавить strength / relevance / route explanation.

---

## Как program связана с персонализацией

Program-сущность особенно важна для будущей сильной персонализации.

Потому что именно через неё можно делать более точный matching между:
- личностью пользователя;
- интересами;
- goals;
- academic/practical fit;
- language fit;
- level readiness;
- career direction.

Если institution — это более общий уровень выбора, то program — это уже уровень, на котором recommendation может становиться действительно персонализированной и practically useful.

---

## Обязательные поля для program в MVP

Чтобы program-запись считалась минимально пригодной, желательно иметь:

### Обязательный минимум
- `id`
- `title`
- `institution_id` или другой ясный parent/provider reference
- `program_type`
- хотя бы один strong или acceptable source

### Сильный желательный слой
- `description`
- `language_of_instruction` или `languages_of_instruction`
- `duration`
- `study_mode`
- `admission_requirements_summary`
- `status`

### Более зрелый слой
- `degree_level`
- `target_audience`
- `profession_links`
- `application_deadlines`
- `tuition / cost layer`, если это релевантно и устойчиво
- `delivery format details`

---

## Когда program-запись считается валидной

Program можно считать валидной, если:

1. это действительно образовательная программа, а не broad category;
2. у неё есть понятный title;
3. есть связка с institution/provider или достаточный эквивалентный контекст;
4. есть source trail;
5. program type ясен или хотя бы reasonably inferable из strong source;
6. нет сильного конфликта с already known data.

---

## Когда program-запись считается неполной

Запись считается неполной, если:
- неясно, к какой institution она относится;
- название слишком общее;
- тип программы не определён;
- нет source support;
- admission layer completely unknown;
- description пустое или noise-heavy.

Такая запись может быть provisional, но не должна автоматически считаться fully usable и trusted.

---

## Когда program-запись считается сильной

Сильная program-запись обычно имеет:
- official or strong source;
- ясный parent institution;
- понятный program type;
- usable description;
- language information;
- хотя бы summary admission logic;
- достаточно контекста для сравнения и recommendation.

Именно такие записи особенно ценны для Inspirella, потому что они позволяют делать не просто каталог, а route-building experience.

---

## Как проверять title программы

### Хороший title
- конкретный;
- соответствует source page;
- отражает реальную program identity;
- не является просто general marketing heading.

### Слабый title
- слишком общий;
- ambiguous;
- дублирует institution name без program meaning;
- является только названием раздела сайта.

### Примеры хороших заголовков
- `Bachelor in Computer Science`
- `Master in Architecture`
- `Vocational Training in Hospitality Management`

### Примеры слабых заголовков
- `Study Programs`
- `Your Future Starts Here`
- `Academic Opportunities`

---

## Как проверять institution link

Program должна иметь понятную связь с provider-level entity.

### Хороший link
- есть clear `institution_id`;
- source page принадлежит конкретной institution;
- program logically embedded in institution structure.

### Слабый link
- institution only guessed indirectly;
- source page слишком общая;
- provider unclear;
- program could belong to multiple entities without disambiguation.

---

## Как проверять program type

`program_type` должен фиксировать educational nature программы.

### Хорошие типы
- `bachelor`
- `master`
- `certificate`
- `vocational_track`
- `foundation_program`
- `specialization_track`

### Что важно
Тип должен быть:
- controlled;
- понятным;
- не хаотично textual;
- полезным для фильтрации, UI и recommendation logic.

---

## Как проверять duration

`duration` полезна, но только если она не вводит в заблуждение.

### Хорошая duration
- взята из official source;
- имеет понятный формат;
- соотносится с mode/level программы.

### Слабая duration
- vague estimate без source;
- устаревшее значение из weak directory;
- значение без unit context.

### Практическая рекомендация
Лучше не заполнять duration вообще, чем заполнять недостоверно.

---

## Как проверять language of instruction

Это одно из критичных полей для Inspirella.

Потому что language fit может быть важнейшей частью user choice.

### Хороший language field
- подтверждён official source;
- приведён к controlled values/codes;
- не смешивает UI language сайта и actual language of instruction.

### Частая ошибка
Источник может быть на английском, но сама программа преподаваться на немецком. Это нельзя путать.

---

## Как проверять admission requirements

Program-level admission layer особенно важна.

### Базовое правило
Admission requirements должны быть:
- достаточно точными;
- source-backed;
- не придуманы на основе broad assumptions.

### На MVP-этапе
Можно хранить:
- summary form;
- structured notes;
- provisional flags,

но нельзя выдавать сомнительную admission info как точный факт.

---

## Что считается достоверным источником для program

### High trust
- official program page;
- official admissions page;
- faculty page;
- official curriculum / handbook / PDF;
- official institutional database.

### Medium trust
- trusted program directories;
- strong educational comparison sites;
- institutional partner listings.

### Low trust
- generic directories;
- SEO summaries;
- reposted content without direct source.

---

## Что делать при конфликте program sources

Если источники расходятся:

1. приоритет у official и более direct source;
2. затем — у более свежего;
3. если conflict material, program не должна silently считаться verified;
4. такая запись должна идти в review-needed слой.

Особенно это важно для:
- program title;
- admission rules;
- degree level;
- duration;
- delivery mode;
- language of instruction.

---

## Deduplication-логика для program

Program-дубли особенно легко возникают, потому что:
- одна и та же программа может фигурировать на нескольких страницах;
- есть локальные и английские версии названия;
- broad degree и specialization могут путаться;
- institution pages и faculty pages могут дублировать одну сущность.

### Сильные признаки дубля
- одинаковый official program URL;
- одинаковая institution + очень близкий title;
- совпадающий type + level + source;
- один и тот же curriculum object под slightly different naming.

### Важный принцип

Лучше одна сильная каноническая program-запись,
чем три похожих program-card, которые создают шум в продукте.

---

## Как program используется в продукте

Program должна поддерживать:
- точный поиск;
- сравнение путей;
- more realistic recommendations;
- route explanation;
- связь между school/institution и profession outcome;
- более тонкий personalization layer.

То есть program — это одна из ключевых сущностей, которая превращает Inspirella из просто каталога организаций в систему реальных образовательных траекторий.

---

## Что важно для будущих ИИ-агентов

Будущие ИИ-агенты должны быстро понимать:
- что не каждое broad направление является program;
- что program должна быть связана с provider-level context;
- что source quality особенно важна для admission / duration / language fields;
- что programs нельзя плодить без duplicate check;
- что именно program-layer со временем станет одной из важнейших опор сильной персонализации.

Этот файл должен стать антихаосной опорой для program-data слоя.

## Открытые вопросы

- насколько рано выносить specializations в отдельную сущность, а не держать как subtype program;
- стоит ли сразу отделять full degree programs от shorter learning offers;
- как глубоко program-level admission data нужно структурировать уже на MVP-этапе;
- нужен ли later отдельный score для recommendation readiness program-записей.