Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать, как вход пользователя превращается в безопасный и пригодный для персонализации profile context.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../API/Profile API Contract.md
- ../UX/Onboarding UX.md
- ../../03_Data/SQL/Validation Rules.md

# Profile Processing Logic

## Pipeline

```text
Raw form input
  → trim and type validation
  → controlled vocabulary normalization
  → required-field checks
  → privacy/ownership checks
  → profile context
  → recommendation input
```

## Normalized context

Для MVP engine получает:

- language;
- interests;
- goals;
- currentStage;
- preferredCanton, если указан;
- targetLanguageRegion, если указан.

Не следует передавать в engine весь объект user record или технические поля хранения.

## Неполный профиль

Неполный профиль не должен приводить к случайной персонализации. Система выбирает один из вариантов:

- показать следующий onboarding question;
- дать общий discovery mode с низкой уверенностью;
- показать безопасную подборку verified general resources.

## Психологические данные

Психотип и сильные стороны не считаются доступными фактами только потому, что AI так написал. Для будущего слоя нужны отдельное измерение, объяснение, consent, возможность исправления и запрет на дискриминационные выводы.

## Текущее состояние

Текущий UI передаёт интересы, goals и stage в local profile, а `EducationEngine` использует их напрямую. Следующий шаг — единая runtime schema, чтобы значения из onboarding, Supabase и engine совпадали и не требовали множества alias-исключений.
