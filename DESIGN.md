---
name: Eng Path
description: A personal English learning platform for TOEFL prep — indigo-accented, Nunito-warm, choreographed for the motivated learner.
colors:
  indigo-accent: "#4f46e5"
  indigo-accent-dark: "#3730a3"
  indigo-accent-dim: "rgba(79, 70, 229, 0.12)"
  bg-base: "#f5f4ff"
  bg-surface: "#ffffff"
  bg-elevated: "#faf9ff"
  bg-subtle: "#edeaff"
  border-default: "#e2e0f5"
  border-subtle: "#d4d2ea"
  text-primary: "#1e1b4b"
  text-secondary: "#4a4870"
  text-muted: "#7c7aa8"
  text-faint: "#c5c3d8"
  state-error: "#ef4444"
  state-success: "#22c55e"
  state-warning: "#f59e0b"
typography:
  display:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0em"
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-accent-dark}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "10px 24px"
  button-secondary:
    backgroundColor: "{colors.bg-subtle}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.lg}"
---

# Design System: Eng Path

## 1. Overview

**Creative North Star: "The Scholar's Playground"**

Eng Path lives at the intersection of academic rigor and genuine delight. The visual system is built around a deep indigo accent — focused, intentional, slightly scholarly — laid over a near-white canvas that breathes with an invisible indigo tint. Nunito's rounded terminals bring warmth without sacrificing legibility. Nothing here is decorative for its own sake; every playful touch earns its place by making the act of learning feel rewarding.

Motion is the third dimension of this system. State changes don't just happen — they respond. Completion milestones celebrate. Progress bars spring into place. The choreography is deliberate and restrained in quantity but expressive in character: a spring overshoot on a card appearing on screen says "you did something that mattered" without a single word.

This system explicitly rejects the visual language of institutional learning tools (Moodle, Canvas), generic SaaS dashboards (Intercom, HubSpot), and utility-first flashcard apps (Anki). It is not a school portal. It is not a CRM. It is a focused creative workspace with a quiet personality and a deep respect for the learner's time and attention.

**Key Characteristics:**
- Indigo-tinted neutral canvas — barely there, always cohesive
- Single accent used sparingly: ≤10% of any screen surface
- Nunito at all weights — from 400 body to 800 display
- Thick bottom border depth (no box shadows)
- Choreographed motion: spring entrances, celebration on completion
- `prefers-reduced-motion` respected throughout

## 2. Colors: The Indigo Canvas

The palette is restrained: one saturated indigo accent, everything else a near-neutral tinted with that same hue. Cohesion over variety. The indigo appears only on interactive elements and progress indicators — its rarity is the point.

### Primary
- **Focused Indigo** (`#4f46e5` / oklch(51% 0.262 277)): The sole accent. Used on primary buttons, active states, progress fills, and focus rings. Never used as a background on full-width surfaces.
- **Indigo Deep** (`#3730a3`): The dark counterpart. Used for the bottom-border depth effect on primary buttons, pressed states, and strong borders.
- **Indigo Dim** (`rgba(79, 70, 229, 0.12)`): 12% opacity indigo. Used for hover backgrounds on interactive cards, active nav items, and accent chip backgrounds.

### Neutral
- **Canvas** (`#f5f4ff`): Page background. Off-white with a ghost of indigo — only noticeable when next to pure white.
- **Surface** (`#ffffff`): Card backgrounds, input fields, modals.
- **Elevated** (`#faf9ff`): Slightly off-white for nested or raised surfaces.
- **Subtle** (`#edeaff`): Hover states, code blocks, tag backgrounds.
- **Border Default** (`#e2e0f5`): Standard 1px borders on cards, inputs, dividers.
- **Border Subtle** (`#d4d2ea`): The 4px bottom border on cards and buttons — provides depth.
- **Text Primary** (`#1e1b4b`): All main text. Indigo-950 — dark enough to read, warm enough to feel human.
- **Text Secondary** (`#4a4870`): Supporting text, labels, descriptions.
- **Text Muted** (`#7c7aa8`): Timestamps, metadata, helper text.
- **Text Faint** (`#c5c3d8`): Placeholders, disabled states.

### Semantic
- **Error** (`#ef4444`): Destructive actions, validation errors.
- **Success** (`#22c55e`): Completion states, correct answers.
- **Warning** (`#f59e0b`): Caution states, approaching limits.

**The One Accent Rule.** `#4f46e5` is the only saturated hue in this palette. If you feel the urge to add a second accent, remove decoration instead.

**The No-Pure-Black Rule.** Never use `#000000` or `#ffffff` in isolation. Every neutral in this system is tinted. `#1e1b4b` is the darkest text; `#ffffff` surfaces exist only in contrast against `#f5f4ff`.

## 3. Typography: Nunito Throughout

**Primary Font:** Nunito (400, 500, 600, 700, 800 weights)
**Mono Font:** Geist Mono (IPA transcriptions, score numerals, code)

**Character:** Nunito's rounded terminals make it feel approachable and friendly at any weight. At 800 it commands attention without aggression; at 400 it disappears into comfortable reading. Paired with Geist Mono for technical precision in IPA and scores, the combination reads as "a smart tool built by someone who cares."

### Hierarchy
- **Display** (800 weight, clamp(2rem → 3.5rem), line-height 1.1, tracking -0.02em): Level headings, hero text on landing. Appears maximum once per page.
- **Headline** (700 weight, clamp(1.5rem → 2rem), line-height 1.2, tracking -0.015em): Unit titles, page headers, section openers.
- **Title** (600 weight, 1.125rem, line-height 1.4, tracking -0.01em): Module card headings, sidebar items, dialog titles.
- **Body** (400 weight, 1rem, line-height 1.75): All prose. For reading passages, use 1.125rem with max-width 68ch to optimize comprehension.
- **Label** (700 weight, 0.8125rem, line-height 1.4, tracking 0.01em): Badges, navigation items, button text, form labels. Bold at small size for legibility.
- **Mono** (Geist Mono, 400 weight, 0.9375rem): IPA phonetics, exercise scores (e.g. "14/20"), code.

**The No-Serif Rule.** There is no serif typeface in this system. Lora is removed. Nunito at body size with generous line-height is sufficient for reading passages. Adding a second typeface for reading modules adds complexity without improving comprehension meaningfully.

**The Weight Ladder Rule.** Never use 400 weight for interactive labels (buttons, nav, chips) — minimum 700. Never use 800 weight for more than one element per viewport.

## 4. Elevation

This system is **flat by default**. Depth is conveyed through a single mechanism: a `4px` bottom border in `{colors.border-subtle}` on interactive surfaces. This gives cards and buttons a tactile, pressable quality without a shadow in sight.

No `box-shadow` anywhere in the UI. No `drop-shadow`. No backdrop blur outside of modals.

**The Thick Bottom Rule.** Every card and every button uses `border-bottom: 4px solid {colors.border-subtle}` at rest. On active/pressed state, this collapses to `1px` and the element translates down by `3px`, simulating a physical press.

### Shadow Vocabulary
None. This system has no shadows. If something needs to "float" (modal, popover, dropdown), use `{colors.bg-surface}` on `{colors.bg-base}` with a `1px border {colors.border-default}` border. The contrast between surfaces provides separation without shadow.

**The No-Shadow Rule.** If you reach for `box-shadow`, stop. Use tonal separation (surface vs. base vs. subtle) or the thick bottom border instead.

## 5. Components

### Buttons

Tactile and confident. Every button has a physical press metaphor — the thick bottom border collapses on `:active` and the element drops `3px`, matching the border collapse. Motion: `transition: transform 100ms ease, border-bottom-width 100ms ease`.

- **Shape:** Generously rounded (20px / `rounded-xl`)
- **Primary:** Focused Indigo (`#4f46e5`) background, white text, `font-weight: 700`, `border-b-4` in Indigo Deep (`#3730a3`). Active: `translate-y-[3px]` + `border-b-[1px]`.
- **Secondary:** Subtle (`#edeaff`) background, Text Primary text, `border-b-4` in Border Default. Same press behavior.
- **Outline:** 1px Border Default border, transparent background, Text Primary text. Hover: `bg-subtle`.
- **Ghost:** No border, no background, Text Secondary text. Hover: `bg-subtle`. No press effect.
- **Destructive:** Error red (`#ef4444`) background, white text, `border-b-4` in `#dc2626`.

### Cards / Containers

- **Corner Style:** 24px radius (`rounded-2xl`)
- **Background:** Surface (`#ffffff`)
- **Elevation:** No shadow. 1px Border Default top/left/right + 4px Border Subtle bottom.
- **Internal Padding:** 24px (`spacing.lg`)
- **Interactive cards** (unit cards, module cards): Add `transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)` on hover. Lift `translate-y-[-2px]`.

### Inputs / Fields

- **Style:** White background, 1px Border Default border, 20px radius. No fill tint.
- **Focus:** `border-color: {colors.indigo-accent}` + `box-shadow: 0 0 0 3px {colors.indigo-accent-dim}`. Ring, not glow.
- **Error:** `border-color: {colors.state-error}` + red dim ring.
- **Disabled:** `background: {colors.bg-elevated}`, `color: {colors.text-faint}`, `cursor: not-allowed`.

### Navigation

- **Style:** Sidebar or top bar on bg-base. Nav items: Text Secondary at rest, Text Primary on hover, Indigo Dim background on active.
- **Typography:** Label weight (700, 0.8125rem).
- **Active indicator:** Left 3px bar in Focused Indigo on sidebar items. Top border on tab-style nav.
- **Mobile:** Collapses to bottom nav or hamburger with slide-in drawer.

### Module Progress Card (Signature Component)

The six-module learning flow is the core UI pattern. Each module card shows: icon in module color, title, completion status, and a horizontal progress bar.

- **Layout:** Horizontal card, icon left, title + status right, progress bar at bottom.
- **Progress bar:** `height: 4px`, `border-radius: 2px`. Fill animates from 0 with a spring ease: `cubic-bezier(0.34, 1.56, 0.64, 1)` on mount.
- **Completion state:** Checkmark icon in Success green, card border shifts to `rgba(34, 197, 94, 0.3)`.
- **Locked state:** 60% opacity, `cursor: not-allowed`, icon grayed.

### Flashcard (Signature Component)

- **At rest:** Surface card, thick bottom border, unit vocab word in Headline weight centered.
- **Flip:** CSS `perspective` + `rotateY(180deg)` on click/tap. Duration: 400ms, `ease-in-out`. Respect `prefers-reduced-motion` by cross-fading instead.
- **Rating buttons (Again / Hard / Good / Easy):** Four buttons in a row after flip. Color coded: Error, Warning, Success, Indigo.

## 6. Do's and Don'ts

### Do:
- **Do** use `#4f46e5` only on interactive elements and progress indicators — never as a section background or decorative fill.
- **Do** use `border-b-4` (4px) in `#d4d2ea` on every card and button at rest, collapsing to `border-b` (1px) + `translate-y-[3px]` on `:active`.
- **Do** use Nunito 700–800 for display and headline roles. Body text is 400; never go below that.
- **Do** animate progress bars on mount with a spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`). The overshoot signals progress.
- **Do** use `prefers-reduced-motion` to replace all spring/choreographed animations with instant or 0ms crossfades.
- **Do** keep reading passage containers at max-width 68ch with 1.75 line-height. Comfort over density.
- **Do** use Geist Mono for IPA transcriptions, exercise scores, and any code display.
- **Do** celebrate module completions — a brief scale animation (`scale(1.05)` spring) on the checkmark icon is enough.

### Don't:
- **Don't** make this look like a generic SaaS template. No blue-and-white corporate palettes, no Intercom-style left nav in white with flat icons, no hero sections with gradient blobs.
- **Don't** make this feel like a dense LMS (Moodle, Canvas). No table-heavy layouts, no nested accordion trees, no multi-level breadcrumb navigation with 6 items.
- **Don't** make this feel like Anki. No utilitarian gray cards with flat sans-serif text at 12px. Even the flashcard interface should feel considered.
- **Don't** use `box-shadow` anywhere. If something needs elevation, use tonal surface contrast + the thick bottom border.
- **Don't** use linear gradients on any surface. Ever. Not even subtle ones.
- **Don't** add a second accent color. The One Accent Rule is load-bearing.
- **Don't** use Lora or any serif typeface. Nunito handles all text roles including long-form reading passages.
- **Don't** use weight below 400 or above 800. Nunito's sweet spot is 400–800.
- **Don't** use raw hex values in component files. All colors must come from CSS custom properties defined in `globals.css`.
