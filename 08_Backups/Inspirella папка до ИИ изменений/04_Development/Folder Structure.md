Status: Canonical
Owner: Sofiia
Last Updated: 2026-08-17
Purpose: зафиксировать целевую структуру папок и смысловых слоёв кодовой базы Inspirella, чтобы проект оставался понятным, масштабируемым и удобным для дальнейшей работы человека и будущих ИИ-агентов
Related Files:
- ./Coding Standards.md
- ./Environment Variables.md
- ./Dependencies.md
- ./Testing.md
- ./Definition of Done.md
- ../README.md
- ../02_Product/Architecture/
- ../03_Data/Data Model.md
- ../03_Data/Field Dictionary.md

# Folder Structure

## Зачем нужен этот файл

Этот файл нужен для того, чтобы зафиксировать, как должна быть устроена кодовая база Inspirella на уровне папок и крупных слоёв.

Если `Coding Standards.md` отвечает на вопрос:

> как писать код,

то `Folder Structure.md` отвечает на вопрос:

> где именно этот код должен жить и как понимать границы между разными частями системы.

Этот файл нужен для того, чтобы:
- уменьшать хаос в структуре проекта;
- не складывать UI, данные, бизнес-логику и временные решения в одни и те же места;
- сделать проект понятным для Sofiia и будущих ИИ-агентов;
- упростить рост Inspirella от прототипа к более зрелой системе;
- поддерживать архитектуру, в которой легче развивать персонализацию, data-layer и продуктовые модули.

---

## Главная идея структуры Inspirella

Inspirella не должна расти как один большой файл или случайный набор папок, которые сложились по ходу работы.

Правильная логика такая:

> **структура проекта должна отражать реальные слои системы: интерфейс, продуктовые фичи, данные, движки логики, инфраструктуру и development-правила.**

То есть хороший folder structure нужен не ради красоты, а ради того, чтобы:
- быстро понимать, где искать нужную часть проекта;
- безопаснее вносить изменения;
- не размазывать логику по случайным местам;
- легче подключать новых участников и будущих ИИ-агентов.

---

# 1. Главные слои кодовой базы Inspirella

На высоком уровне кодовая база Inspirella должна разделяться на несколько смысловых слоёв.

## 1.1. App shell / entry layer

Это слой, который:
- поднимает приложение;
- собирает главные корневые зависимости;
- подключает маршруты, провайдеры и глобальные оболочки.

Примеры файлов:
- `main.tsx`
- `App.tsx`

### Важный принцип

Этот слой не должен постепенно превращаться в место, где живёт вся система проекта.

---

## 1.2. UI / components layer

Это слой переиспользуемых визуальных компонентов.

Здесь должны жить:
- UI-блоки;
- визуальные элементы;
- небольшие презентационные компоненты;
- shared интерфейсные части.

Примеры:
- `Navbar`
- `PhoenixLogo`
- `MapboxMap`
- визуальные карточки
- display-блоки

### Важный принцип

Если компонент в основном отвечает за отображение, его место скорее в UI/components layer, а не в data/business logic.

---

## 1.3. Feature layer

Это один из самых важных слоёв проекта.

Здесь живут:
- крупные функциональные блоки продукта;
- сценарии пользователя;
- feature-specific orchestration;
- связка UI + feature logic в разумных пределах.

Примеры:
- auth
- dashboard
- marketing
- modules

### Важный принцип

Features должны быть понятными продуктово, а не только технически.

То есть папка `features/` должна отражать:
- реальные куски продукта;
- реальные сценарии;
- реальные зоны развития Inspirella.

---

## 1.4. Data layer

Это слой, который отвечает за работу с данными.

Здесь должны жить:
- repository logic;
- adapters;
- mock storage;
- raw/static data, если они ещё нужны;
- преобразование данных между storage и UI-friendly shapes.

Примеры:
- `data/Repository.ts`
- `data/localMockDB.ts`
- `data/seedData.ts`
- часть `data.ts`, если она реально про data, а не про business logic.

### Важный принцип

UI не должен быть главным местом, где понимают, как устроены raw данные.  
Эта ответственность должна смещаться в data layer.

---

## 1.5. Engine / business logic layer

Это слой логики, который особенно важен для будущего Inspirella.

Здесь должны жить:
- recommendation logic;
- path logic;
- scoring;
- trust logic;
- personalization rules;
- later — более зрелые decision engines.

Примеры:
- `engine/EducationEngine.ts`
- `engine/useEducationEngine.ts`
- `engine/engineConfig.ts`

### Почему это важно

Для Inspirella engine-layer — это один из наиболее стратегических слоёв, потому что именно он позже будет всё сильнее связан с персонализацией и реальной помощью пользователю.

---

## 1.6. Infrastructure / integration layer

Это слой, который связывает приложение с внешними системами и runtime-средой.

Здесь могут жить:
- `supabaseClient.ts`
- server-side integration logic
- API wrappers
- environment-sensitive config

### Важный принцип

Infrastructure не должна расползаться по компонентам.

Если интеграция с Supabase, Mapbox, Gemini или другим сервисом нужна в нескольких местах, её лучше держать в предсказуемом инфраструктурном слое.

---

## 1.7. Shared types / schemas layer

Это слой общих типов и соглашений.

Примеры:
- `types.ts`
- later `schemas/`
- validation types
- DTO-like shared models

### Важный принцип

Типы, которые используются в нескольких слоях системы, не должны хаотично дублироваться в feature-файлах.

---

# 2. Практическая целевая структура

Ниже — рекомендованная логика структуры для текущего и ближайшего будущего Inspirella.

```plain
src/
├── app/
├── components/
├── features/
├── data/
├── engine/
├── integrations/
├── types/
├── utils/
├── styles/
└── assets/


Это не обязательно нужно внедрять одномоментно прямо сейчас, но именно к такой логике структура должна постепенно стремиться.


# 3. Как понимать каждую папку
src/app/
Что должно жить здесь
app shell;
root providers;
global app composition;
routing entry;
app-level configuration.
Что не должно жить здесь
глубокая business logic;
raw database access;
большие feature-specific алгоритмы.
Зачем это нужно
Чтобы App.tsx не оставался единственным местом, где собирается вообще всё приложение.



src/components/
Что должно жить здесь
reusable UI components;
presentation-first blocks;
visual pieces, которые могут использоваться в нескольких местах.
Что не должно жить здесь
тяжёлая бизнес-логика;
raw Supabase queries;
сложное feature orchestration.
Хорошие примеры
navbar
logo
card components
layout blocks
map presentation shell


src/features/
Что должно жить здесь
feature-oriented modules;
auth flow;
dashboard logic;
onboarding flow;
profile-related screens;
marketing/public view slices;
planner / recommendation UI features.
Как мыслить feature
Feature — это не просто папка «по техническому признаку», а кусок реального продукта.

Что не должно жить здесь
слишком универсальные shared utilities;
глобальные types;
raw infrastructure clients.


src/data/
Что должно жить здесь
repositories;
data adapters;
mock data storage;
seed data;
normalization helpers, если они mainly data-oriented.
Что не должно жить здесь
визуальные компоненты;
routing logic;
deep recommendation scoring, если это уже engine-level задача.
Важный принцип
Этот слой должен становиться главным посредником между хранилищем/источниками данных и feature/UI layer.



src/engine/
Что должно жить здесь
recommendation engines;
path logic;
scoring and weighting rules;
trust/relevance logic;
personalization helpers;
rule-based domain engines.
Почему это отдельный слой
Потому что для Inspirella это не «вспомогательный код», а будущая одна из самых сильных частей продукта.

Что не должно жить здесь
UI rendering;
raw JSX-heavy files;
infrastructure plumbing without business meaning.


src/integrations/
Что должно жить здесь
Supabase integration wrappers;
Mapbox integration helpers;
Gemini / AI integration boundaries;
external service clients;
sync helpers.
Почему это полезно
Сейчас часть такой логики может быть разбросана по другим файлам. В будущем лучше, чтобы внешние интеграции были более явно собраны в одном инфраструктурном слое.



src/types/
Что должно жить здесь
shared types;
core data models;
domain interfaces;
type-safe contracts между слоями.
Что не должно жить здесь
runtime-only helpers;
raw business logic;
UI-specific one-off props, если они нужны только в одном месте.


src/utils/
Что должно жить здесь
small generic helpers;
formatting utilities;
parsing utilities;
functions, которые не несут отдельного feature/business identity.
Что не должно жить здесь
всё подряд.


utils/ — одна из самых опасных папок, потому что туда легко начать складывать всё неочевидное.

Важный принцип
Если логика имеет явную:

product identity,
data identity,
engine identity,
feature identity,


её не нужно прятать в utils/.



src/styles/
Что должно жить здесь
global styles;
design tokens;
theme logic;
shared style-layer pieces.


Если проект later разрастётся, это поможет не держать всё только в одном giant CSS file.



src/assets/
Что должно жить здесь
статические изображения;
иконки;
media assets;
non-code project resources.
Что не должно жить здесь
важная бизнес-логика;
markdown knowledge files;
конфигурации, которые должны быть в более понятных technical местах.


# 4. Как структура должна соотноситься с текущим состоянием Inspirella
Сейчас у проекта уже есть хорошее начало:

components/
features/
data/
engine/
types.ts
supabaseClient.ts


Это уже довольно неплохая основа.



Но по мере роста логично двигаться к большей ясности:

сильнее отделять app shell;
сильнее выделять integrations;
не оставлять слишком много ответственности в root-level файлах;
постепенно делать shared types и helpers более предсказуемыми.


5. Правила распределения кода по папкам
5.1. Один смысловой слой — одно главное место
Если логика относится к data layer, она не должна в основном жить в UI layer.



Если логика относится к engine, она не должна быть размазана по случайным feature-компонентам.

5.2. Не создавать папки заранее без реальной роли
Не нужно заводить 20 папок просто ради красивой схемы.



Каждая папка должна иметь:

понятную ответственность;
ожидаемый тип содержимого;
пользу для навигации по проекту.
5.3. Не складывать временное в канонические места без пометки
Если есть:

experimental code;
migration layer;
AI Studio workaround;
temporary bridge,


это должно быть либо явно обозначено, либо вынесено так, чтобы не выглядеть как идеальное конечное решение.



6. Как future AI-agents должны читать структуру проекта
Будущие ИИ-агенты должны уметь быстро понимать:

где искать бизнес-логику;
где искать доступ к данным;
где лежат reusable UI pieces;
где лежат external integrations;
где находятся shared types и основные contracts.
Базовая логика для них
нужно менять отображение → сначала смотреть components/ и features/
нужно менять данные → смотреть data/
нужно менять recommendation/path logic → смотреть engine/
нужно менять интеграцию с сервисом → смотреть integrations/ / infra layer
нужно менять общие типы → смотреть types/


Это одна из причин, почему structure должна быть смысловой, а не случайной.



7. Чего структура Inspirella не должна делать
Хорошая структура не должна:

прятать важную логику в случайных местах;
делать App.tsx центром всей системы;
смешивать raw data access и UI rendering;
превращать utils/ в склад всего непонятного;
зависеть от legacy naming сильнее, чем от канонической модели проекта.


8. Folder structure и миссия Inspirella
Для Inspirella структура папок — это не просто организационная привычка.



Она напрямую влияет на то, сможет ли проект:

долго расти без архитектурного распада;
поддерживать качественные данные;
развивать сильную персонализацию;
масштабироваться на другие страны;
оставаться понятным для Sofiia и будущих ИИ-агентов.


Если структура хаотична, то со временем начинает слабеть всё:

скорость работы;
качество изменений;
устойчивость рекомендаций;
предсказуемость data-layer;
ясность продукта как системы.


Поэтому правильная folder structure — это одна из форм заботы о будущем масштабе Inspirella.



Открытые вопросы
когда именно later выделить integrations/ в отдельную папку вместо root-level integration files;
насколько рано стоит разделить types.ts на несколько domain-based type modules;
какие current root-level файлы потом правильнее всего перенести в app/, integrations/ или types/;
где позже провести границу между engine logic и feature orchestration точнее.