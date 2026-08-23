Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать обязательные состояния UI для загрузки, пустых результатов, ошибок, успеха, offline, provisional data и отсутствия авторизации.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- Design Principles.md
- ../../04_Development/Testing.md
- ../UX/Trust UX.md

# Interaction States

## Required states

| State | Что видит пользователь | Что нельзя делать |
|---|---|---|
| Loading | skeleton/spinner + короткое объяснение | оставлять пустой экран |
| Empty | почему пусто + действие уточнить/просмотреть общий каталог | показывать fake records |
| Error | понятная причина + retry/fallback | показывать stack trace |
| Success | подтверждение результата и следующий шаг | скрывать сохранение |
| Offline/local | local badge, доступные действия, sync status | выдавать local как cloud |
| Provisional | заметный quality label + ограничение | делать record равноправной verified |
| Unauthorized | объяснение, зачем нужен вход + guest option | бесшумно редиректить |
| Session expired | сохранить безопасное состояние + login CTA | терять введённые данные |
| Reduced motion | те же смыслы без декоративной анимации | скрывать feedback |

## Microcopy rule

Каждое состояние отвечает на три вопроса: что произошло, что это значит и что можно сделать дальше.

## Visual rule

State label должен быть текстовым и, где уместно, иконографическим; цвет — только дополнительный сигнал.
