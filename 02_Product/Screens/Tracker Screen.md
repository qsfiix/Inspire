Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать tracker screen как место для небольших действий, связанных с личным путём пользователя.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Tracker Requirements.md
- ../UX/Progress UX.md
- ../API/Tracker API Contract.md

# Tracker Screen

## Layout

- heading that explains purpose;
- create goal form;
- active goal cards;
- checklist items and completion control;
- progress/streak summary;
- local/cloud sync state;
- empty state with example, not fake achievement.

## Copy

Encourage consistency without pressure. «Сделайте следующий небольшой шаг» is preferable to competitive language or guilt.

## States

- no goals;
- saving;
- saved locally;
- syncing;
- sync failed;
- completed item;
- no network.

## Current implementation

`TrackerSystem.tsx` supports local interactive goals and checklist items. Cloud persistence, time semantics and cross-device consistency remain later implementation work.
