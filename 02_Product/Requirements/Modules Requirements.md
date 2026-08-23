Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить функциональные требования для cross-cutting product modules: resources, tracker, language, profile and shared discovery utilities.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Frontend/Frontend Modules.md
- Tracker Requirements.md
- ../Screens/Modules Overview Screen.md

# Modules Requirements

## Shared module principles

- one clear user job;
- typed data contract;
- no direct secret access;
- consistent loading/error/empty states;
- reusable design tokens;
- links back to the user path.

## Resource module

Search, category filter, official source link, verified/freshness indicator, relevant recommendation marker and graceful empty state.

## Tracker module

Create a small goal, add checklist items, mark completion, display progress, preserve local state and later sync safely.

## Profile module

Show language, user context, sync state and account actions without exposing internal IDs or raw credentials.

## Language module

Support `en`, `de`, `fr`, `it`; fallback to English only when a translation is absent; never display raw translation keys.

## Current gap

Resources logic appears in both `dashboard.tsx` and `modules.tsx`, and state ownership should be consolidated before adding more modules.
