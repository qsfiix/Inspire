Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: честно зафиксировать, что реально существует в текущем AI Studio snapshot, а что остаётся прототипом или планом.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../Frontend/Current Frontend State.md
- ../Backend/Prototype Limitations.md
- ../../04_Development/Folder Structure.md

# Current Product State

## Реально существует в snapshot

- React 19 + TypeScript + Vite + Tailwind CSS v4.
- Express server в `server.ts`.
- Public views: home, about, contact.
- Demo login, onboarding, dashboard, resources, map, tracker и profile views.
- Dark/light violet visual system с blur/glow атмосферой.
- Четыре языка UI: `en`, `de`, `fr`, `it`.
- `DataRepository` с локальным fallback и частичным Supabase access.
- Rule-based `EducationEngine` с scoring профессий, institutions и resources.
- Mapbox-компонент с fallback directory/SVG projection behavior.
- Gemini server endpoint с JSON response и fallback consultation.

## Что нельзя считать завершённым продуктом

- Login не является полноценной Supabase authentication flow.
- Guest profile и authenticated profile пока слишком близки.
- Trackers не имеют завершённого cloud persistence.
- `professions` fallback может вернуть пустой массив.
- Gemini endpoint не доказан как часть основного пользовательского пути.
- Product документы 02_Product ранее были пустыми и только теперь получили первый draft.
- Ряд mappings и naming ещё переходные: `institutions`/`schools`, static data/DB data, `package.json`/старый lock metadata.

## Главная оценка

Это полезный функциональный prototype foundation, а не законченная платформа. Его сильная сторона — уже видимая связка интерфейса, данных и recommendation logic. Главный риск — принять визуальную полноту за продуктовую и data-зрелость.

## Приоритет перехода

1. Зафиксировать product contracts и MVP.
2. Стабилизировать запуск, типы, config и data layer.
3. Реализовать настоящий profile/auth flow.
4. Подключить и проверить canonical data.
5. Сделать рекомендации доказательными и понятными.
6. Только затем расширять визуальную полировку и новые страны.
