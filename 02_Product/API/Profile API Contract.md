Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать хранение и изменение персонального профиля, который является основой персонализации, onboarding и ownership.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../../03_Data/SQL/Data Model.md
- ../../03_Data/SQL/Validation Rules.md
- ../../03_Data/SQL/Quality Rules.md
- ../Requirements/Auth Requirements.md
- ../UX/Personalization UX.md

# Profile API Contract

## Назначение

Профиль хранит только те сведения, которые нужны для пользовательского опыта и персонализации. Он не является окончательным психологическим портретом человека и не должен превращаться в скрытую систему оценки.

## MVP-поля

| Поле | Тип | MVP | Назначение |
|---|---|---:|---|
| `id` | UUID | да | связь с auth user |
| `name` | text | да | обращение в интерфейсе |
| `email` | text | auth-controlled | идентификатор аккаунта |
| `language` | enum | да | язык интерфейса |
| `interests` | controlled array | да | первичная персонализация |
| `goals` | controlled array | да | намерение пользователя |
| `currentStage` | controlled value | да | контекст следующего шага |
| `preferredCanton` | controlled/text | желательно | региональная релевантность |
| `targetLanguageRegion` | controlled value | желательно | языковой контекст |
| `onboardingComplete` | boolean | да | состояние flow |
| timestamps | datetime | да | аудит изменений |

Психотип, сильные стороны и более глубокие признаки личности относятся к будущему слою и требуют отдельной этики, согласия и качества измерения.

## Целевые операции

```text
GET   /api/profile
PATCH /api/profile
POST  /api/profile/onboarding/complete
DELETE /api/profile   # только после отдельного решения о поддержке удаления
```

В MVP UI должен использовать `GET/PATCH` для собственного профиля. Нельзя передавать `userId` из клиента как единственный механизм ownership.

## Валидация

- `language` только из поддерживаемого набора;
- `interests` и `goals` нормализуются по controlled vocabulary;
- неизвестные значения отклоняются или переводятся в review state, а не silently принимаются;
- строковые поля ограничиваются длиной и очищаются от неожиданных payloads;
- `onboardingComplete=true` допустим только после минимально необходимого набора данных.

## Ownership и безопасность

Пользователь читает и изменяет только собственный профиль. Supabase RLS и серверная авторизация должны подтверждать это независимо от UI. Guest profile хранится отдельно и не должен случайно перезаписывать authenticated profile.

## Текущее состояние

В текущем коде `handleLogin` создаёт локальный профиль без вызова `supabase.auth.signUp/signIn`; `DataRepository.saveProfile` пытается синхронизировать профиль только если реальная сессия уже существует. Это нужно считать demo-flow, а не готовой auth-реализацией.
