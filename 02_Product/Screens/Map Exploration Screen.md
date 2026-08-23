Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать screen experience для интерактивной карты и альтернативного каталога institutions.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../Requirements/Map Discovery Requirements.md
- ../API/Institutions API Contract.md
- ../UX/Discovery UX.md

# Map Exploration Screen

## Layout

- page heading and short orientation text;
- map/canvas with controls;
- list or side panel of institutions;
- search and controlled filters;
- selected institution card with location, type, language, source and official links;
- toggle between map-first and list-first on small screens.

## Interaction

Select marker → focus card → inspect details → open official source or save/compare if supported. A user can always return to the full list.

## Fallback

If Mapbox token/WebGL/style is unavailable, show directory map/list with clear «map visualization unavailable» copy. Never show a blank map with no explanation.

## Current implementation

`MapboxMap.tsx` loads institution data, attempts Mapbox and includes dynamic SVG projection fallback. Runtime token/style wiring and marker cleanup should be audited before production use.
