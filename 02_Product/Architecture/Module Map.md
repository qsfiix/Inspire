Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: показать соответствие продуктовых модулей, текущих файлов и целевых границ, чтобы агент не расширял App.tsx хаотично.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Frontend/Frontend Architecture.md
- ../../04_Development/Folder Structure.md
- ../../03_Data/SQL/Data Model.md

# Module Map

## Текущие модули и код

| Product module | Current location | Целевая ответственность |
|---|---|---|
| App shell/navigation | `src/App.tsx`, `src/components/Navbar.tsx` | shell, route state, providers; не вся бизнес-логика |
| Marketing | `src/features/marketing.tsx` | public home/about/contact |
| Auth/onboarding | `src/features/auth.tsx` | login, guest entry, onboarding UI; auth service отдельно |
| Dashboard | `src/features/dashboard.tsx` | personalized overview, education explorer, resource/profile views |
| Resources | `src/features/modules.tsx` и `dashboard.tsx` | catalogue/search/recommendation presentation |
| Map discovery | `src/components/MapboxMap.tsx` | map rendering, institution selection, fallback |
| Tracker | `src/components/TrackerSystem.tsx` | goals and checklist interaction |
| Data access | `src/data/Repository.ts`, `localMockDB.ts` | adapters, fallback, normalization |
| Recommendation | `src/engine/*` | deterministic ranking and explanations |
| Runtime integrations | `server.ts`, `supabaseClient.ts` | server API, external services, runtime config |

## Целевая граница

- `features/` знает пользовательский сценарий, но не SQL.
- `components/` получает typed props и отвечает за presentation/interaction.
- `data/` нормализует storage records.
- `engine/` не зависит от React и сетевого транспорта.
- `server/` защищает secrets и выполняет server-side calls.
- `types/` фиксирует contracts, а не дублирует их в каждом feature.

## Правило нового модуля

Новый модуль появляется только если он решает отдельную пользовательскую проблему, имеет место в MVP/roadmap и может быть описан через requirement, screen/flow и data/API contract. Иначе он остаётся идеей, а не кодом.
