Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать целевую структуру frontend без преждевременной сложности и с ясными границами между shell, features, data и engine.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Architecture/Product Architecture.md
- ../../04_Development/Folder Structure.md
- ../../04_Development/Coding Standards.md

# Frontend Architecture

## Target shape

```text
src/
├── app/              # shell, providers, navigation
├── features/         # auth, discovery, dashboard, progress
├── components/       # reusable presentation
├── data/             # repository, adapters, schemas
├── engine/           # pure recommendation logic
├── services/         # API clients and integration boundaries
├── types/            # shared contracts (gradually extract)
└── styles/           # tokens and global styles
```

Текущую структуру можно мигрировать постепенно; переименование папок само по себе не является ценностью.

## Dependency direction

```text
components → typed props
features → components + services/hooks
services → API contracts
engine → types + config (no React/network)
data → types + adapters
app → features + providers
```

## State placement

- Server data — repository/query layer.
- Session — auth/session service.
- Cross-feature UI state — app shell only when truly global.
- Local form state — feature component.
- Recommendation computation — engine, not JSX.

## Definition of done

Новый frontend block имеет owner layer, typed input/output, empty/error/loading states, responsive behavior и тестируемый пользовательский результат.
