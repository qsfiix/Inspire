Status: Working
Owner: Sofiia
Last Updated: 2026-08-21
Purpose: определить цветовые токены и правила свечения/blur для тёмной и светлой тем Inspirella.
Maturity: This is a first product-layer draft grounded in the current Inspirella strategy, data model and AI Studio code snapshot. Review before treating it as final product policy.
Related Files:
- Brand UI Foundations.md
- Design Principles.md
- ../../04_Development/Coding Standards.md

# Color and Atmosphere

## Core palette

| Token | Dark mode | Light mode | Use |
|---|---|---|---|
| `surface.base` | near-black violet | soft lavender-white | page background |
| `surface.card` | translucent black/white | white | primary cards |
| `accent.primary` | electric violet | deep violet | CTA and active state |
| `accent.secondary` | indigo | muted indigo | secondary navigation |
| `text.primary` | near-white | near-black violet | main content |
| `text.muted` | cool grey | dark muted violet | supporting text |
| `status.success` | emerald | dark emerald | saved/verified |
| `status.warning` | amber | dark amber | provisional/attention |
| `status.error` | red | dark red | failure |

## Atmosphere rules

- Использовать glow как акцент вокруг primary action или key insight.
- Blur ограничивать крупными background layers и glass cards.
- Не использовать прозрачность, если она ухудшает чтение текста или trust labels.
- На светлой теме borders и text должны иметь самостоятельный контраст.
- Пользовательский status не должен зависеть только от цвета.

## Motion and performance

Анимации должны поддерживать transition и feedback. При `prefers-reduced-motion` отключать декоративные loops и сохранять смысловую информацию.
