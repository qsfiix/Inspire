---
version: 2.0
name: Inspirella
description: Alpenglühen. Dawn light on the Bernese Alps for a Swiss education and career explorer. Calm lilac-and-white surfaces, plum ink, one coral accent (the head of the swift, the dot of the i). Swisstopo contour lines and layered mountain ranges carry the brand instead of glows. Nacht is the same world at night (moon, stars, moonlit range), not a different design. Wix Madefor Display for headings, Manrope for everything else.

colors:
  # Brand (alpen / nacht)
  plum: "#4a2377 / #c4b0f2"          # --plum: brand text, links, active states
  btn: "#4a2377 / #7b55c7"           # --btn: solid primary buttons (white text)
  btn-2: "#3a1a60 / #6a45b5"         # --btn-2: button hover
  coral: "#e46f4c / #f08a68"         # --coral: the one accent (summit dot, swift head, focus ring, checks)
  coral-ink: "#a8401a / #f4a383"     # coral as text on light ground (AA)
  # Text
  ink: "#1e1730 / #ece8f5"           # --ink: headings, body
  ink-2: "#43395a / #cfc6e2"         # --ink-2: secondary body
  muted: "#5c5470 / #a9a0c0"         # --muted: captions, meta (still AA on card)
  # Surfaces
  mist: "#f8f5fc / #0e0a19"          # --mist: page floor, soft chips
  paper: "#ffffff / #120d1f"         # --paper: home sections
  card: "#ffffff / #161024"          # --card: app cards, inputs
  wash: "#efe8f8 / #211933"          # --wash: hover fill
  line: "#e7e1ee / #2c2340"          # --line: hairlines, card borders
  # Landscape (home + app backdrop; nacht re-colours the same SVG)
  sky: "#d3c1f0 → #fdebe0"           # --sky-1..4
  dusk: "#2b1546"                    # foreground ridge, My Path band
  peach: "#f4a27f"                   # sun, alpenglow
  # Semantic (Tailwind palette, both themes)
  success: emerald-600 / emerald-300 # verified, done
  warning: amber-700 / amber-300     # estimates, caveats, guest notice
  error: "#b3261e"                   # btn-danger text

typography:
  display:
    fontFamily: "Wix Madefor Display Variable"   # --f-display, self-hosted (@fontsource-variable)
    weight: 600-800
    letterSpacing: "-0.02em to -0.035em on large sizes"
  body:
    fontFamily: "Manrope Variable"               # --f-body, self-hosted, Latin + Cyrillic
    size: "16px base; app text never below 12.5px"
    weight: 400-650
  static-pages: "public/fonts/manrope-*.woff2 + wix-display-*.woff2 subsets"

rounded:
  pill: 999px
  control: 12-14px     # buttons, inputs
  card: 20px           # app cards (rounded-2xl/3xl render as 20px)
  panel: 22-28px       # home panels, profession card

spacing:
  page-gutter: "24px desktop, 18px ≤520px"
  max-width: 1200px
  section: "88-120px vertical on home"

components:
  nav: SiteNav.tsx (.alp-nav): transparent over the home sky, solid white after 24px scroll; burger sheet ≤900px
  button: .alp-btn (plum), .alp-btn.coral, .alp-btn.sm; app .btn-primary is re-skinned to the same plum
  pill: .alp-pill, aria-pressed = selected
  card: app .card-premium (white card, soft shadow, contour lines on hover)
  logo: SwiftMark.tsx (split wings, coral head); PNGs public/swift-mark-{32..512}.png
  backdrop: AlpenBackdrop.tsx (fixed pale range behind app pages, time of day per page; not on home or map)
---

## Overview
Inspirella helps teenagers, parents and newcomers find their way through the Swiss education system. The design has to earn trust from parents, schools and career counsellors, so it is calm and plainly structured. It still has one memorable world: the Alps at dawn. The 2026-11 redesign replaced a dark violet "glow" look that early users read as AI-made. The rule now is **one authored moment per screen**, everything else quiet.

Source of truth: `Inspirella_code/src/alpen.css` (tokens + all theme CSS), `src/index.css` (`@theme inline` maps tokens to Tailwind utilities), `src/lib/theme.ts` (theme switch), `index.html` (pre-paint theme script).

## Themes
- **Alpenglühen** (`data-theme="alpen"`, default): dawn sky, lilac ranges, coral sun.
- **Nacht** (`data-theme="nacht"`): the same layout and components at night. Moon instead of sun, a few stars, moonlit ranges, solid dark cards. No glows, no particles.
- The theme is set on `<html>` before first paint (localStorage `inspirella_theme`; old values `dark`/`light` migrate). Components still receive `isDark` for the parts not yet on tokens.

### Using colours in components
Use token utilities. They switch with the theme by themselves:

| Role | Class |
|---|---|
| Heading / body text | `text-ink` |
| Secondary text | `text-ink-2` |
| Captions, meta | `text-muted` |
| Brand text, links | `text-plum` |
| Card / input surface | `bg-card` |
| Soft chip, quiet area | `bg-mist` |
| Hover fill | `hover:bg-wash` |
| Hairline | `border-line` |
| Primary button | `bg-btn text-white` |
| Accent | `text-coral`, `bg-coral` |

Status colours (emerald, amber, red) still come from the Tailwind palette with an `isDark` pair. About 200 older `isDark ? … : …` pairs remain (shadows, status chips, SVG colours, Mapbox style). Section 3 of alpen.css re-skins their light branch. Move them to tokens when you touch a file, then delete the matching skin rule.

## Signature moments (one per screen)
- **Home hero**: layered SVG massif (`Landscape.tsx`, one SVG per depth for parallax). Over about 3 s the sky warms, the sun rises, alpenglow descends the lit faces, the white-red-white Wanderweg draws to the summit, and the swift flies in to become the coral summit dot.
- **App pages**: `AlpenBackdrop` puts a pale range behind the page. Each page has its own time of day (`data-time` dawn/morning/noon/afternoon/evening; colours are `@property` registered so they fade), the range climbs slightly on scroll, and the swift flies across once per visit.
- **Cards**: a 2px lift; swisstopo contour lines surface in the corner on hover.
- **Checks**: a completed checkbox pops with a coral ring.
- **Profession card**: numbers roll like a departure board.

All motion respects `prefers-reduced-motion` (final state, no flyby).

## Typography
- Headings: Wix Madefor Display, tight tracking at large sizes. Body: Manrope.
- No mono fonts, no all-caps tracking eyebrows (alpen.css neutralises leftovers in app code).
- `font-black` renders as 700. Readable text is never below 12.5px.
- Write for German string length and 375px width.

## Shapes & elevation
- Soft, rounded (12-28px), one soft plum shadow (`--shadow-soft`). No borders thicker than 1px on cards.
- No backdrop blur, no gradient buttons, no glow shadows.

## Imagery
- The landscape, contour lines and the swift are the imagery. No stock photos, no 3D blobs, no sparkle icons (`lucide-sparkles` is hidden in app pages).
- Brand images: `public/og-image.png`, `swift-mark-*.png`, `apple-touch-icon.png`, `favicon.svg`. `logo-mark.png` (phoenix) is legacy and only kept for the unused PhoenixScene.

## Voice in the UI
Supportive, precise, honest. Never invent data or promise outcomes. Say plainly when something is an estimate, German-only, or needs checking with the canton or school. Swiss context is explicit: cantons, EFZ/EBA, Matura, FH/Uni, permeability. No mention of AI in site texts.

## Do's and Don'ts

### Do
- Use token utilities (`text-ink`, `bg-card`, `border-line` …) for new UI. They cover both themes.
- Check both themes and 375px width.
- Keep coral rare: one accent per view.
- Respect `prefers-reduced-motion`.
- Show the source and "as of" date next to numbers.

### Don't
- Don't add glows, shimmer, beams, particles or sparkle icons. These were the main "AI-made" tell.
- Don't add a second effect to a screen that already has its moment.
- Don't build Nacht as a separate design. It is the same page at night.
- Don't re-add the founder block on the home page (removed at Sofiia's request).
- Don't show fabricated or placeholder data as if it were real.
