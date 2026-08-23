Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить требования к входу, гостевому режиму, onboarding, ownership и безопасному переходу к персональному продукту.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../../00_Brain/Mission.md
- ../../00_Brain/Core Principles.md
- ../../00_Brain/Positioning.md
- ../API/Profile API Contract.md
- ../UX/Onboarding UX.md
- ../Frontend/Public vs Authenticated Areas.md

# Auth Requirements

## User needs

Пользователь хочет быстро понять ценность, не отдавая лишние данные, а затем сохранить полезный путь и вернуться к нему.

## Functional requirements

1. Public entry объясняет разницу между guest exploration и account.
2. Login/sign-up использует реальный auth provider до публичного запуска.
3. Onboarding собирает только минимальные необходимые поля.
4. Пользователь может изменить язык и основные preferences.
5. Profile ownership enforced by backend/RLS.
6. Guest state явно маркируется и может быть преобразован в account.
7. Logout очищает/сохраняет данные по понятной политике.
8. Session expiry имеет recoverable flow.

## Non-functional requirements

- no passwords or tokens in logs;
- accessible forms and validation;
- multilingual error messages;
- no account creation through an untrusted arbitrary email-only demo path in production;
- consent and age/privacy policy planned for real users.

## Current gap

Current `LoginView` collects name/email and calls local profile creation. This is prototype behavior and must not be represented as production authentication.
