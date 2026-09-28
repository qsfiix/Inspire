---
version: 1.0
name: Inspirella
description: Deep-space violet interface for a Swiss education and career explorer. Dark-first (near-black violet canvas) with a full light theme on a pale lavender floor. Brand voltage comes from violet-to-fuchsia light — glows, shimmer, particle phoenix — used as accents on otherwise calm, dense, information-heavy surfaces. Space Grotesk display, Inter body, JetBrains Mono for labels and metadata.

colors:
  # Brand
  primary: "#7c3aed"            # violet-600 — CTA gradient start, links, active states (light)
  primary-bright: "#8b5cf6"     # violet-500 — glows, focus, active icons
  primary-soft: "#a78bfa"       # violet-400 — accents on dark, active nav icon
  primary-pale: "#c4b5fd"       # violet-300 — secondary accents on dark
  accent-fuchsia: "#e879f9"     # fuchsia-400 — shimmer / beam highlight only
  accent-indigo: "#818cf8"      # indigo-400 — shimmer / gradient partner only
  ink-violet: "#2e1065"         # violet-950 — primary text on light theme
  # Dark theme surfaces
  canvas-dark: "#030008"        # html body floor
  surface-dark: "#06040a"       # page background, card base (at 40-90% alpha)
  surface-dark-raised: "rgba(255,255,255,0.05)"
  hairline-dark: "rgba(255,255,255,0.10)"
  on-dark: "#ffffff"
  on-dark-muted: "#a1a1aa"      # zinc-400
  on-dark-soft: "#d4d4d8"       # zinc-300
  # Light theme surfaces
  canvas-light: "#f5f3ff"       # violet-50
  surface-light: "#ffffff"
  surface-light-tint: "#faf5ff" # purple-50
  hairline-light: "#e9d5ff"     # purple-200
  on-light: "#2e1065"           # violet-950
  on-light-muted: "rgba(46,16,101,0.80)"
  # Semantic
  success: "#10b981"            # emerald-500 — verified data, live dot, done
  warning: "#f59e0b"            # amber-500 — caveats, tips, "estimate" flags
  warning-soft: "#fde68a"       # amber-200 — warm highlights
  error: "#f87171"              # red-400 on zinc-900 (btn-danger)

typography:
  display-hero:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "36px / md:60px"   # text-4xl md:text-6xl
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: tight
  display-section:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "30px / md:36px"   # text-3xl md:text-4xl
    fontWeight: 800
    letterSpacing: tight
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: 18-20px            # text-lg / text-xl
    fontWeight: 700
  body-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px / md:20px"   # hero subtitle only
    fontWeight: 400
    lineHeight: relaxed
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px               # text-sm
    fontWeight: 400-500
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px               # text-xs — the workhorse size in dashboards
  eyebrow:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 9-12px
    fontWeight: 700
    textTransform: uppercase
    letterSpacing: widest (0.1em-0.3em)
  section-label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: 14px
    fontWeight: 800
    textTransform: uppercase
    letterSpacing: wide

rounded:
  sm: 4px        # rounded — tiny chips, bars
  md: 8px        # rounded-lg — nav tabs, small buttons, list rows
  lg: 12px       # rounded-xl — buttons, inputs
  xl: 16px       # rounded-2xl — cards (card-premium*)
  2xl: 24px      # rounded-3xl — hero panels, modals
  pill: 9999px   # rounded-full — badges, status dots, avatars

spacing:
  unit: 4px (Tailwind scale)
  tight: 4-8px        # gap-1 / gap-2 inside controls
  control: 12-16px    # p-3 / p-4
  card: 24px          # p-6
  container: "max-w-7xl, px-4 sm:px-6 lg:px-8"
  nav-height: 64px

components:
  btn-primary:
    class: .btn-primary
    background: "linear-gradient(to right, violet-600, indigo-600, purple-600)"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    press: scale(0.95)
    optional: .btn-shine (one per view)
  btn-secondary:
    class: .btn-secondary
    dark: "border white/10, bg white/5, text violet-200"
    light: "border violet-950/20, bg violet-950/5, text violet-950"
  btn-danger:
    class: .btn-danger
    background: zinc-900
    textColor: red-400
    border: red-950
  card:
    class: .card-premium
    rounded: "{rounded.xl}"
    dark: "bg white/5 over #06040a/40, border white/10, backdrop-blur-xl"
    light: "bg white, border purple-200, soft violet shadow"
    hover: "violet border + cursor spotlight (--sx/--sy set in App.tsx)"
  card-accent:
    class: .card-premium-accent
    note: "quieter nested panel inside a card"
  card-glow:
    class: .card-premium-glow
    note: "the one highlighted card in a group"
  nav:
    height: 64px
    style: "sticky, backdrop-blur-xl, border-b; dark bg black/40, light bg white/70"
    active-tab: "sliding pill (motion layoutId), violet-500/15 bg + glow on dark, violet-100 on light"
  badge:
    style: "rounded-full, px-3 py-1, bg violet-500/10, text violet-400, mono uppercase bold text-xs"
  input:
    style: "rounded-xl, py-3, text-xs, leading icon at pl-10, no outline — focus via violet border/ring"
---

## Overview

Inspirella helps students and families in Switzerland find their way through the dual-track education system (Berufslehre ↔ Gymnasium/university, with permeability between them) and track their own path. The interface has to carry two things at once: **inspiration** (a future that feels open and luminous) and **trust** (dense, accurate, sourced information about real schools, professions and cantons).

The design resolves that tension like this: **calm, dense, legible information surfaces, lit by violet light.** The light (glows, shimmer, the particle phoenix, border beams) is the emotional layer and is used sparingly; the surfaces underneath are quiet and readable.

**Key characteristics**
- **Dark-first.** Default theme is a near-black violet canvas (`#030008` / `#06040a`). A complete light theme exists (pale lavender `#f5f3ff` floor, white cards, deep violet-950 ink); every component must work in both. Theme is toggled by `body.dark-mode`, and components branch on `isDark`.
- **One hue family.** Violet is the brand. Purple, indigo and fuchsia appear only as partners inside gradients and glows, never as independent accent colours. Emerald and amber are strictly semantic.
- **Light as material.** Soft violet glows, blurred radial blobs, and particles instead of flat illustrations or stock photography.
- **The phoenix.** The home hero is a three.js particle phoenix (`components/phoenix/`) that morphs through scene chapters on scroll: rebirth and transformation, which is the brand metaphor for changing or finding your path.
- **Technical-editorial labels.** Small uppercase JetBrains Mono eyebrows and metadata give a precise, "instrument panel" feel next to Space Grotesk headlines.

## Colors

### Brand & accent
- **Violet 600** (`#7c3aed`): start of the primary CTA gradient; strong accent on light theme.
- **Violet 500** (`#8b5cf6`): the glow colour. Card hover glow, spotlight, active nav glow, focus.
- **Violet 400 / 300** (`#a78bfa` / `#c4b5fd`): accent text and icons on dark (active nav icon, badges, eyebrows at reduced opacity).
- **Violet 950** (`#2e1065`): primary text colour in the light theme, and base for light-theme borders/tints at low alpha (`violet-950/5`, `/10`, `/20`).
- **Fuchsia 400** (`#e879f9`) and **Indigo 400** (`#818cf8`): used *only* inside the shimmer gradient, border beam and bridge-pulse gradients.

### Surfaces
| Role | Dark | Light |
|---|---|---|
| Page floor | `#030008` (body) / `#06040a` | `#f5f3ff` |
| Card | `white/5` over `#06040a/40`, blur | `#ffffff` |
| Nested panel | `white/[0.02]` | `purple-50/50` |
| Hairline | `white/10` | `purple-200` |
| Nav | `black/40` + blur | `white/70` + blur |

### Text
- Dark: headings `#fff` (hero words use a white→zinc-300 vertical gradient), body `zinc-400`, secondary `zinc-300`, section headings may use `violet-200`.
- Light: headings and body `violet-950`, body at `/80` opacity, muted text as `violet-900/50`.

### Semantic
- **Emerald** (`emerald-500`/`400`): verified/official data, "live" pulse dot, completed steps.
- **Amber** (`amber-500`/`300`, tints `amber-50`/`amber-500/10`): caveats, estimates, tips (Lightbulb icon), "check with the canton" notes. Amber is also the warm counterpoint in the particle scene's highlights (`#fde68a`).
- **Red** (`red-400` on `zinc-900`): destructive actions only.

## Typography

### Families
- **Space Grotesk** (`--font-display`): all `h1`–`h4` automatically via `index.css`. Weight 700–800, `tracking-tight`.
- **Inter** (`--font-sans`): body, UI, forms.
- **JetBrains Mono** (`--font-mono`): eyebrows, badges, metadata, numbers, tiny labels. Always uppercase with wide tracking when used as a label.

### Hierarchy
- Hero: `text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]`, words reveal one by one out of a blur, last word gets `.text-shimmer`.
- Section title: `text-3xl md:text-4xl font-extrabold tracking-tight`.
- Card title: `text-lg`/`text-xl font-bold`.
- Body: `text-sm`; dashboard and data UIs lean on `text-xs`. Hero subtitle alone uses `text-base md:text-xl`.
- Eyebrow: `text-[10px]`/`text-xs font-mono font-bold uppercase tracking-widest`.
- Legal/long-form section labels: `text-sm font-extrabold uppercase tracking-wide`.

### Principles
- Weight carries hierarchy (bold/extrabold headings over regular body). Avoid `font-black` for new work; extrabold is the ceiling.
- Don't set body copy below `text-xs` (12px); `text-[9px]`/`[10px]` is only acceptable for mono uppercase labels.
- Copy is multilingual (DE/FR/IT/EN), and German runs long, so layouts must tolerate 30–40% longer strings and never rely on single-line fits for headings.

## Layout

- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Long-form pages (About, Privacy) narrow to prose width.
- Spacing on the Tailwind 4px scale: `gap-1/2` inside controls, `p-3/4` for compact panels, `p-6` for cards.
- Home hero is left-aligned on `lg`, centred on mobile.
- Mobile first: every page must work at 375px with no horizontal scroll. Nav collapses; between `md` and `xl` logged-in nav tabs are icon-only (label kept in `title`/`aria-label`).

## Elevation & depth

Depth comes from **light, not shadow**.
- Dark theme: cards are translucent (`white/5`) with `backdrop-blur-xl`; elevation reads as a violet glow on hover (`0 0 28px -8px rgba(139,92,246,.22)`), not a drop shadow.
- Light theme: soft violet-tinted shadow (`0 4px 25px rgba(46,16,101,.06)`) with a glow added on hover.
- Ambient blobs (`.glow-bubble-violet`, `HeroBackground`, `SectionGlow`) sit behind content at heavy blur (120px) and low opacity.

### Signature effects (use sparingly)
| Effect | Class / source | Budget |
|---|---|---|
| Flowing gradient text | `.text-shimmer` | one accent word per view |
| Button light sweep | `.btn-shine` | one primary CTA per view |
| Travelling border light | `.border-beam` | 1–2 "most important" elements per page |
| Cursor spotlight | built into `.card-premium*` | automatic |
| 3D tilt | `.tilt-3d` | feature cards only |
| Bidirectional pulse | `.bridge-track` | VET ↔ academic permeability visual |
| Rising sparks | `.path-spark` | My Path ladder, climbed steps |
| Scroll cue | `.scroll-cue` | home hero only |
| Particle phoenix | `components/phoenix/` | home hero only |

Every animated effect **must** be disabled under `prefers-reduced-motion: reduce` (see bottom of `index.css`).

## Shapes

- Radius scale: 4 / 8 / 12 / 16 / 24 / full (see frontmatter). Buttons and inputs are `rounded-xl`, cards `rounded-2xl`, hero panels and modals `rounded-3xl`, badges and dots `rounded-full`.
- Icons: **lucide-react** only, usually `h-4 w-4` in controls, `h-5 w-5` in card headers.
- Logo: `/logo-mark.png` with a violet drop-shadow, beside the wordmark **INSPIRELLA** (bold, wide tracking) and the mono sub-label "Swiss Education Explorer".
- Imagery: no stock photos. Use particles, glows, maps (Mapbox), and data visualisation (My Path staircase) instead.

## Components

### Top navigation
Sticky, 64px, `backdrop-blur-xl`, bottom hairline. Public tabs: Home / About / Contact. Logged-in tabs: Dashboard / Map / Resources / Tracker / Profile. Active tab = sliding pill (`motion` `layoutId="activeNavBarPill"`, spring 380/32). Language switcher and theme toggle on the right.

### Buttons
Use the classes in `index.css`; don't hand-roll button styles.
- `.btn-primary`: violet→indigo→purple gradient, white semibold text, `rounded-xl`, `active:scale-95`. One per section.
- `.btn-secondary`: translucent, theme-aware border.
- `.btn-danger`: zinc-900 + red text, for delete/logout-type actions.

### Cards
- `.card-premium` is the default container for everything.
- `.card-premium-accent` is for nested/secondary panels.
- `.card-premium-glow` is for the single highlighted item in a set.
- Add `.tilt-3d` only to marketing feature cards, never to data or forms.

### Badges / eyebrows
Pill: `rounded-full px-3 py-1 bg-violet-500/10 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider`. A status badge may lead with an emerald ping dot.

### Inputs & forms
`w-full rounded-xl py-3 text-xs`, leading lucide icon (`pl-10`), no default outline; focus state is a violet border/ring. Theme-aware background (translucent on dark, white/violet-50 on light).

### Data surfaces
Map (Mapbox, custom style), Advisor report, institution comparison, tracker and My Path ladder. Rules for these: prioritise legibility, show the source and the "as-of" state, and use emerald/amber semantics for verified vs. estimated. No decorative effects inside data tables.

## Voice in the UI
Supportive, precise, honest. Never invent data or promise outcomes. Say plainly when something is an estimate, German-only, or needs checking with the canton or school. Swiss context is explicit: cantons, EFZ/EBA, Matura, FH/Uni, permeability.

## Do's and Don'ts

### Do
- Build every component for **both** themes and test both.
- Reuse `.btn-*` and `.card-premium*` before writing new styles.
- Keep violet as the only brand hue; express emphasis through brightness and glow.
- Respect `prefers-reduced-motion` for anything that moves.
- Keep data UIs calm: effects live on marketing and hero surfaces.
- Design for German-length strings and 375px width.

### Don't
- Don't introduce new accent hues (blue, teal, orange CTAs) or a second brand colour.
- Don't stack signature effects: no shimmer + beam + shine on the same element or card.
- Don't use drop-shadow-heavy "material" elevation on dark; use glow.
- Don't use stock photography or generic 3D blobs; the phoenix and particles are the imagery.
- Don't show fabricated or placeholder data as if it were real.
- Don't use `font-black` or text below 12px for readable copy.
