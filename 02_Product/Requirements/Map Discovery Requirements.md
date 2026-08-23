Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: описать требования к поиску и изучению образовательных организаций через карту и каталог.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- ../API/Institutions API Contract.md
- ../Screens/Map Exploration Screen.md
- ../UX/Discovery UX.md
- ../../03_Data/Entities/Location.md

# Map Discovery Requirements

## User problem

Пользователь хочет понять, какие образовательные возможности существуют, где они находятся и чем отличаются, не изучая разрозненные сайты без структуры.

## Must-have

- Switzerland-focused map/catalog;
- institution markers from normalized coordinates;
- list/card alternative to map;
- search and controlled filters;
- selected institution detail;
- official website/admission link when present;
- quality/source status;
- usable fallback when Mapbox/WebGL is unavailable;
- responsive mobile layout.

## Data rules

Map does not invent coordinates. Invalid or missing location records are excluded from geographic rendering and may appear in non-map lists only under the relevant quality policy.

## Safety/trust

External links open clearly; users see that details can change and should be checked with the official institution. The map is a discovery aid, not a guarantee of admission or fit.
