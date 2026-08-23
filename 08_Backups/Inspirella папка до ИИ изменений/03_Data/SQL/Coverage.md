Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать, что в Inspirella считается покрытием данных, по каким измерениям оценивается полнота и глубина базы, где coverage уже сильный, а где есть пробелы, и как growth базы должен измеряться не только количеством записей, но и реальной полезностью для продукта и пользователя
Related Files:
- ../Data Model.md
- ../Field Dictionary.md
- ../Sources.md
- ../Validation Rules.md
- ../Import Rules.md
- ./Quality Rules.md
- ./Data Pipeline.md
- ../Entities/School.md
- ../Entities/Program.md
- ../Entities/Source.md
- ../Entities/Location.md

# Coverage

## Зачем нужен этот файл

Этот файл нужен для того, чтобы зафиксировать, как Inspirella понимает coverage данных.

Если:
- `Data Model.md` отвечает на вопрос, какие сущности существуют;
- `Validation Rules.md` — какие записи считаются пригодными;
- `Data Pipeline.md` — как данные проходят через систему;

то `Coverage.md` отвечает на вопрос:

> насколько хорошо база вообще покрывает нужное пространство и где у нас всё ещё остаются большие пустоты.

Этот файл нужен, чтобы:
- не путать большое количество записей с хорошим покрытием;
- понимать, где база сильна, а где слаба;
- измерять рост Inspirella осмысленно, а не только по объёму;
- помогать future AI-agents работать не хаотично, а в направлениях, которые реально усиливают систему;
- держать фокус не на «наполнить побольше», а на «покрыть нужное пространство качественно и полезно».

---

## Краткое определение coverage

**Coverage в Inspirella — это степень, в которой база данных уже охватывает нужные сущности, регионы, уровни образования, программы, профессии, источники и связи между ними так, чтобы пользователь мог получать реальную, достаточно полную и надежную картину возможностей.**

Коротко:

> coverage — это не просто сколько записей у нас есть, а насколько хорошо база действительно представляет нужный образовательный мир.

---

## Главная идея coverage в Inspirella

Inspirella не должна расти по логике:

> «чем больше строк в базе, тем лучше».

Правильная логика такая:

> **хорошее покрытие — это когда база достаточно полно, структурированно и полезно отражает то пространство возможностей, в котором пользователь должен ориентироваться.**

Это особенно важно, потому что миссия Inspirella глубже, чем просто собрать каталог. Проект должен:
- давать ясность;
- помогать видеть реальные пути;
- поддерживать персонализацию;
- снижать хаос.

Если coverage слабый или неравномерный:
- рекомендации будут искажёнными;
- карта мира возможностей будет неполной;
- пользователь может видеть только то, что случайно лучше собрано;
- система начнёт переоценивать частично покрытые области как будто они и есть вся реальность.

---

# 1. Что именно нужно покрывать

Coverage в Inspirella должен измеряться не по одному измерению, а сразу по нескольким.

## 1.1. Entity coverage

Насколько база покрывает ключевые типы сущностей:
- institutions / schools;
- programs;
- professions;
- resources;
- sources;
- location layer.

### Почему это важно
Если одна сущность покрыта хорошо, а остальные почти пусты, пользовательский опыт остаётся фрагментированным.

---

## 1.2. Geographic coverage

Насколько база покрывает:
- страны;
- кантоны / регионы;
- города;
- важные geographic clusters.

### Почему это важно
Для Inspirella география — не фон, а часть реальности выбора.

Если coverage есть только в отдельных городах или кантонах, но это не видно явно, система может создавать ложное ощущение полноты.

---

## 1.3. Educational level coverage

Насколько база покрывает уровни образования.

Примеры:
- secondary;
- upper secondary;
- vocational;
- tertiary;
- certificate / continuing education;
- foundation / bridge programs.

### Почему это важно
Inspirella должна помогать разным пользователям на разных стадиях пути, а не только в одном сегменте.

---

## 1.4. Program depth coverage

Насколько хорошо institution-level слой дополняется program-level слоем.

### Почему это важно
Можно иметь много institutions, но если programs почти не описаны, пользователь всё ещё видит только поверхностный каталог.

---

## 1.5. Profession linkage coverage

Насколько хорошо база покрывает связи между:
- programs;
- professions;
- institutions;
- user path logic.

### Почему это важно
Для долгосрочной персонализации именно эти связи будут превращать Inspirella из каталога в систему реальных траекторий.

---

## 1.6. Source coverage

Насколько база покрыта strong sources и понятным provenance layer.

### Почему это важно
Без source coverage объём данных может расти, но trust не будет расти вместе с ним.

---

## 1.7. Quality-adjusted coverage

Насколько покрытие состоит именно из usable / strong data, а не из массы provisional или weak records.

### Почему это важно
1000 слабых записей не равны 1000 реально полезным записям.

---

# 2. Что не считается хорошим coverage

Ниже — важные anti-patterns.

## 2.1. Quantity without usability

Много записей, но:
- нет source support;
- нет program depth;
- нет usable descriptions;
- нет geography clarity.

Это объём, но не хорошее покрытие.

## 2.2. Coverage concentrated in one visible cluster

Например, если хорошо собраны только несколько известных institutions или один кантон, а остальное почти пусто.

Это не strong system-wide coverage, а локальный остров.

## 2.3. Institution-heavy but program-empty base

Если у нас есть много schools/institutions, но почти нет program-level слоя, покрытие остаётся поверхностным.

## 2.4. Weak-source coverage

Если большая часть записей держится на низкокачественных источниках, coverage нельзя считать по-настоящему сильным.

## 2.5. Visible coverage without path coverage

Если пользователь видит много объектов, но не может понять:
- как они связаны с его путём;
- какие программы ведут к чему;
- какие возможности реально релевантны,

то coverage ещё не выполняет миссию Inspirella.

---

# 3. Основные измерения coverage

Ниже — practical framework, по которому полезно мыслить базу.

## 3.1. Breadth coverage

Это ширина охвата.

### Вопросы
- сколько регионов покрыто?
- сколько institution types покрыто?
- сколько уровней образования покрыто?
- сколько категорий программ покрыто?

### Риск
Можно иметь breadth без depth.

---

## 3.2. Depth coverage

Это глубина описания внутри уже охваченных объектов.

### Вопросы
- есть ли details beyond title?
- есть ли location clarity?
- есть ли admission context?
- есть ли program data?
- есть ли source layer?

### Риск
Можно иметь breadth without depth — и это создаёт видимость силы без реальной опоры.

---

## 3.3. Linkage coverage

Это покрытие связями.

### Вопросы
- связаны ли institutions с programs?
- связаны ли programs с professions?
- связаны ли records с source layer?
- есть ли связка с location logic?

### Почему это критично
Связи — это то, что позже даст персонализацию и route-building.

---

## 3.4. Trust-weighted coverage

Это покрытие, скорректированное на качество и надёжность.

### Вопросы
- какой процент записей source-backed strong enough?
- сколько verified / usable versus provisional?
- есть ли системные зоны, где trust layer слабее?

### Почему это важно
Две одинаковые по количеству зоны покрытия могут быть radically different по реальной ценности.

---

## 3.5. User-relevant coverage

Это один из самых важных слоёв.

### Вопрос

> покрывает ли база то, что действительно нужно пользователю для выбора?

### Это включает
- meaningful institutions;
- relevant programs;
- understandable geography;
- practical options;
- links to professions and pathways.

### Важный принцип
Хорошее coverage в Inspirella — это coverage, которое усиливает реальную ориентацию пользователя, а не просто красиво выглядит в статистике.

---

# 4. Coverage for institutions / schools

## Хорошее institution coverage означает, что:
- покрыты основные типы institutions;
- покрыты значимые регионы;
- institutions source-backed;
- location layer usable;
- duplicate noise контролируется;
- institutions достаточно пригодны для карты и фильтров.

## Слабое institution coverage выглядит так:
- только громкие бренды;
- много пустых карточек;
- хаотичная география;
- нет distinction между strong и weak records.

---

# 5. Coverage for programs

## Хорошее program coverage означает, что:
- institutions дополняются реальными program-level объектами;
- есть program type diversity;
- есть language/admission basics;
- есть institution links;
- program layer supports comparison and recommendation.

## Слабое program coverage выглядит так:
- есть только general institution pages;
- programs редкие, неструктурированные или шумные;
- невозможно строить meaningful user path beyond school name.

---

# 6. Coverage for professions

## Хорошее profession coverage означает, что:
- professions не просто перечислены, а имеют смысловую ясность;
- связаны с educational paths;
- помогают later personalization;
- поддерживаются adequate source logic.

## Слабое profession coverage выглядит так:
- vague keyword lists;
- нет связей с programs;
- professions существуют как декоративный слой, а не как реальная сущность пути.

---

# 7. Coverage for sources

## Хорошее source coverage означает, что:
- критические сущности имеют strong source support;
- provenance layer понятен;
- есть source diversity, но с clear trust hierarchy;
- not too much weak data pretending to be strong.

## Слабое source coverage выглядит так:
- много данных без происхождения;
- почти все записи держатся на low-quality directories;
- internal summaries подменяют real sources.

---

# 8. Coverage for location layer

## Хорошее geographic coverage означает, что:
- institutions reasonably distributed across meaningful geographies;
- city/canton/country layers usable;
- map data not dangerously sparse or misleading;
- coordinates sufficiently trustworthy where used.

## Слабое geographic coverage выглядит так:
- несколько точек собраны глубоко, остальное почти пусто;
- location noisy or inconsistent;
- карта visually exists, but semantically weak.

---

# 9. Practical ways to think about coverage growth

Рост coverage в Inspirella должен быть не одномерным.

## 9.1. Horizontal growth

Расширение по:
- новым регионам;
- новым institution types;
- новым categories of programs;
- later — новым странам.

## 9.2. Vertical growth

Усиление already covered entities:
- больше source depth;
- лучше program detail;
- better location precision;
- stronger profession links;
- richer validated fields.

## 9.3. Relational growth

Усиление связей между уже существующими сущностями:
- institution ↔ program;
- program ↔ profession;
- entity ↔ source;
- entity ↔ location;
- later ↔ user profile relevance.

### Важный принцип
Inspirella должна расти по всем трём направлениям, а не только вширь.

---

# 10. How future AI agents should use coverage logic

Будущие ИИ-агенты должны понимать, что их задача — не просто «добавить ещё записи», а усиливать покрытие системы осмысленно.

## Агент не должен
- бесконечно добавлять низкокачественные дубли;
- усиливать уже и так хорошо покрытую зону, игнорируя пустые области;
- считать количество строк главным KPI.

## Агент должен
- замечать пробелы по географии;
- замечать пробелы по program depth;
- замечать weak-source areas;
- усиливать linkage coverage;
- улучшать trust-weighted coverage, а не только raw volume.

### Идеальная логика

> не где легче добавить много, а где полезнее усилить систему.

---

# 11. Coverage and SQL / analytics layer

Coverage later должно быть удобно смотреть через SQL/views/metrics.

Например, later можно анализировать:
- institutions by canton/city/country;
- institutions by quality state;
- institutions with/without source support;
- programs per institution;
- professions linked vs unlinked;
- percentage of usable vs provisional records;
- coverage gaps by region or entity type.

### Почему это полезно
Coverage перестаёт быть абстракцией и становится реально наблюдаемым слоем развития базы.

---

# 12. Coverage and product reality

Очень важно помнить:

Хорошее coverage в Inspirella — это не coverage ради базы.

Это coverage ради того, чтобы пользователь:
- видел реальные возможности;
- не упускал важные варианты из-за пустот базы;
- не получал искажённую картину рынка;
- мог строить путь на основе действительно широкой и достаточно глубокой картины.

То есть coverage — это одна из форм справедливости продукта по отношению к пользователю.

---

# 13. Coverage and Inspirella mission

Для Inspirella coverage — это часть большой миссии.

Проект хочет:
- помочь человеку находить свой путь;
- показывать реальные возможности;
- превращать хаос в ясность;
- строить систему мирового уровня.

Но всё это невозможно, если база покрывает мир возможностей слишком узко, случайно или неравномерно.

Поэтому growth coverage — это не просто database expansion.

Это постепенное приближение Inspirella к её реальному предназначению:

> стать системой, которая действительно помогает человеку увидеть больше реальных путей и выбрать свой осознаннее.

---

# 14. Как понять, что coverage стало сильнее

Coverage усиливается, если:
- больше релевантных сущностей переходят в usable layer;
- растёт не только количество institutions, но и program depth;
- улучшается source-backed trust;
- уменьшаются geographic blind spots;
- растут связи между institutions, programs и professions;
- пользователь получает более realistic map of possibilities.

### Не всё улучшение coverage выглядит как “+100 записей”
Иногда coverage реально усиливается, когда:
- 50 старых записей получают хорошие sources;
- institutions получают program links;
- целый кантон перестаёт быть grey zone;
- profession layer перестаёт быть декоративным и становится route-supporting.

---

# 15. Final practical principle

Для Inspirella coverage нужно оценивать не вопросом:

> «Сколько данных у нас уже есть?»

а вопросом:

> «Насколько полно, надёжно и полезно наша база уже отражает пространство возможностей, в котором пользователь должен ориентироваться?»

Именно этот вопрос ближе всего к реальной сути coverage.

## Открытые вопросы

- какие измерения coverage позже сделать formal KPI;
- насколько рано выделять “coverage gaps” как отдельные backlog objects;
- нужен ли later separate coverage view by user persona / path type;
- как лучше считать trust-weighted coverage по регионам и типам сущностей.