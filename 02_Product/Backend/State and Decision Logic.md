Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать состояния приложения и правила переходов, чтобы пользовательский путь был предсказуемым при загрузке, ошибках, гостевом режиме и отсутствии данных.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Frontend/Navigation Model.md
- ../Design System/Interaction States.md
- ../Requirements/Auth Requirements.md

# State and Decision Logic

## Application states

```text
public
  → login_requested
  → guest_or_authenticated
  → onboarding_required
  → ready
  → discovering
  → recommendation_ready
  → progress_tracking
```

Дополнительные состояния могут прерывать flow: `loading`, `offline`, `data_unavailable`, `error`, `session_expired`.

## Decision rules

- Public user может читать marketing pages и запускать guest exploration.
- Authenticated zone требует действующей сессии или explicit guest policy.
- После login без завершённого onboarding пользователь идёт в onboarding.
- После завершённого onboarding dashboard показывает результат даже если часть data sources unavailable, но честно маркирует ограничения.
- Recommendation error не должен выбрасывать пользователя на пустой экран.
- Logout очищает локальный user-owned state и возвращает в public zone.

## Current implementation

`App.tsx` использует `isLoggedIn`, `userProfile`, `activeTab`, `theme`, resources и trackers. Это понятная prototype-state machine, но переходы и persistence со временем нужно вынести в typed app/session services.

## Запреты

Нельзя решать authorization только скрытием tab. Нельзя считать наличие local profile доказательством auth. Нельзя показывать recommendation_ready до завершения loading и проверки минимальной валидности данных.
