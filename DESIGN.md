---
name: Eng Path
description: A personal English learning platform for TOEFL prep — warm cream canvas, warm orange primary, sage teal accents, Nunito warmth. Notion-calm, content-first.
colors:
  background: "oklch(0.988 0.002 80)"       # #FFFEFC — Notion page bg (warm white)
  foreground: "oklch(0.2 0.01 80)"          # #1A1A17 — Notion primary text
  card: "oklch(1 0 0)"                      # #FFFFFF — inline card/block bg
  card-foreground: "oklch(0.2 0.01 80)"
  primary: "oklch(0.17 0.008 80)"           # #1F1E1C — Notion near-black action color
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.946 0.004 80)"        # #F1F0EE — Notion hover / subtle bg
  secondary-foreground: "oklch(0.2 0.01 80)"
  muted: "oklch(0.962 0.003 80)"            # #F7F6F4 — soft gray-beige surface
  muted-foreground: "oklch(0.55 0.01 80)"   # #9B9A97 — Notion placeholder text
  accent: "oklch(0.575 0.19 253)"           # #2383E2 — Notion blue
  accent-foreground: "oklch(1 0 0)"
  destructive: "oklch(0.56 0.22 27)"        # #E03E3E — Notion red
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.9 0.004 80)"             # #E9E8E4 — Notion light divider
  input: "oklch(0.9 0.004 80)"              # same as border
  ring: "oklch(0.575 0.19 253)"             # Notion blue focus ring
  state-success: "oklch(0.716 0.199 145)"
  state-warning: "oklch(0.769 0.188 75)"
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
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "var(--primary)"
    textColor: "var(--primary-foreground)"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  button-secondary:
    backgroundColor: "var(--secondary)"
    textColor: "var(--secondary-foreground)"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "var(--muted-foreground)"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
  card:
    backgroundColor: "var(--card)"
    border: "1px solid var(--border)"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System: Eng Path

## 1. Overview

**Creative North Star: "Notion-Calm Scholar"**

Eng Path is built on a warm cream canvas, clean white card surfaces, and a purposefully minimal visual language. The aesthetic draws from Notion: content-first, readable, unhurried. A warm cream page holds white cards separated by subtle warm-gray borders. Orange is the single action color — used sparingly, never decoratively. Sage teal serves focus rings and secondary indicators. Nunito's rounded warmth carries all text.

Every decision serves the act of learning. No thick borders, no shadows, no color-coded badges, no decorative fills. What remains is content, hierarchy, and quiet warmth.

**Key Characteristics:**
- Warm cream canvas (`--background`) with white card surfaces (`--card`)
- Subtle warm-gray borders (`--border`) — visible without demanding attention
- Orange primary (`--primary`) as the sole action color — used sparingly on buttons and progress only
- Sage teal accent (`--accent`) for focus rings and secondary indicators
- Nunito at all weights — from 400 body to 800 display
- Flat elevation: no shadows, no thick borders, tonal surface contrast only
- `prefers-reduced-motion` respected throughout

## 2. Colors: The Warm Canvas

All values live in `globals.css` as OKLCH custom properties. Use CSS variables — never hardcode hex values.

### Primary Action
- **Notion Near-Black** (`--primary` / `oklch(0.17 0.008 80)`): The sole CTA color. Primary buttons, active progress fills, and selected states only. Notion's `#1F1E1C` — warm near-black, never pure black.
- **Primary Foreground** (`--primary-foreground` / `oklch(1 0 0)`): White text on near-black backgrounds.

### Accent
- **Notion Blue** (`--accent` / `oklch(0.575 0.19 253)`): Focus rings, secondary highlights, interactive indicators. Notion's `#2383E2` — calm and precise.
- **Accent Foreground** (`--accent-foreground` / `oklch(1 0 0)`): White text on blue backgrounds.

### Surfaces
- **Background** (`--background` / `oklch(0.988 0.002 80)`): Page canvas. Notion's near-white warm — `#FFFEFC`, brown-warm hue.
- **Card** (`--card` / `oklch(1 0 0)`): Card and modal surfaces. Pure white against the warm canvas.
- **Secondary** (`--secondary` / `oklch(0.946 0.004 80)`): Hover fills, tag backgrounds, secondary button backgrounds.
- **Muted** (`--muted` / `oklch(0.962 0.003 80)`): Lightest surface tier — input fills, code blocks.

### Text
- **Foreground** (`--foreground` / `oklch(0.2 0.01 80)`): All primary text. Warm dark brown — readable, slightly earthy, like Notion's primary text.
- **Muted Foreground** (`--muted-foreground` / `oklch(0.55 0.01 80)`): Secondary text, metadata, descriptions. Notion's `#9B9A97` equivalent — warm mid-gray.

### Borders
- **Border / Input** (`--border`, `--input` / `oklch(0.9 0.004 80)`): Subtle warm gray. Defines surfaces without visual weight. Not black — never black.

### Semantic
- **Destructive** (`--destructive` / `oklch(0.56 0.22 27)`): Destructive actions, validation errors.
- **Success** (`oklch(0.716 0.199 145)`): Completion states, correct answers.
- **Warning** (`oklch(0.769 0.188 75)`): Caution states, approaching limits.

### Dark Mode
Dark mode preserves warmth. Backgrounds are deep brown-black (`oklch(0.16 0.008 106.5)`), not cold gray. Orange primary brightens slightly. Borders remain subtle warm dark gray (`oklch(0.35 0.01 106.5)`). All semantics stay the same.

**The Two-Color Rule.** Near-black (`--primary`) and Notion blue (`--accent`) define all interactive moments. Black for action; blue for focus. Do not introduce additional hues.

## 3. Typography: Nunito Throughout

**Primary Font:** Nunito (400, 500, 600, 700, 800 weights)
**Mono Font:** Geist Mono (IPA transcriptions, score numerals, code)

### Hierarchy
- **Display** (800 weight, clamp(2rem → 3.5rem), line-height 1.1, tracking -0.02em): Level headings, hero text. Maximum once per page.
- **Headline** (700 weight, clamp(1.5rem → 2rem), line-height 1.2, tracking -0.015em): Unit titles, page headers, section openers.
- **Title** (600 weight, 1.125rem, line-height 1.4, tracking -0.01em): Card headings, sidebar items, dialog titles.
- **Body** (400 weight, 1rem, line-height 1.75): All prose. Reading passages: 1.125rem, max-width 68ch.
- **Label** (700 weight, 0.8125rem, line-height 1.4, tracking 0.01em): Badges, nav items, button text, form labels.
- **Mono** (Geist Mono, 400 weight, 0.9375rem): IPA phonetics, exercise scores, code.

**The No-Serif Rule.** No serif typeface. Nunito handles all text roles including reading passages.

**The Weight Ladder Rule.** Minimum 700 for interactive labels. Never use 800 for more than one element per viewport.

## 4. Elevation

This system is **flat by default**. There are no shadows, no thick bottom borders. Depth comes from one source: tonal surface contrast between the warm cream background and the white card surface. The 1px border in `--border` (warm gray) defines edges cleanly without visual weight.

No `box-shadow` anywhere. No `drop-shadow`. No `backdrop-blur` outside of modals.

For modal/popover surfaces: use `--card` on `--background` with `1px solid var(--border)`. Surface contrast does the work.

## 5. Components

### Buttons

Flat and simple. No thick bottom borders. No press-translate effects. Transitions on hover via `opacity` or `background-color`.

- **Shape:** `rounded-lg` (8px)
- **Primary:** `var(--primary)` background, `var(--primary-foreground)` text, `font-semibold`. Hover: `opacity-90`.
- **Secondary:** `var(--secondary)` background, `var(--secondary-foreground)` text. Hover: `bg-muted`.
- **Outline:** `1px border-border`, transparent background, `var(--foreground)` text. Hover: `bg-muted`.
- **Ghost:** No border, no background, `var(--muted-foreground)` text. Hover: `bg-muted`.
- **Destructive:** `var(--destructive)` background, `var(--destructive-foreground)` text. Hover: `opacity-90`.

### Cards / Containers

- **Corner Style:** `rounded-xl` (12px)
- **Background:** `var(--card)` (white)
- **Elevation:** No shadow. `1px solid var(--border)` all around.
- **Internal Padding:** 20px
- **Interactive cards:** `hover:bg-muted/50` with `transition-colors duration-150`. No translate effect.

### Inputs / Fields

- **Style:** `var(--card)` background, `1px solid var(--input)` border (warm gray), `rounded-lg`.
- **Focus:** `border-color: var(--ring)` (sage teal) + `outline: 2px solid var(--ring)`.
- **Error:** `border-color: var(--destructive)` + destructive-dim ring.
- **Disabled:** `background: var(--muted)`, `color: var(--muted-foreground)`, `cursor: not-allowed`.

### Navigation

- **Style:** Sidebar or top bar on `var(--sidebar)`. Nav items: `var(--muted-foreground)` at rest, `var(--foreground)` on hover.
- **Typography:** Label weight (700, 0.8125rem).
- **Active indicator:** Left 3px bar in `var(--sidebar-primary)` (orange) on sidebar items.
- **Mobile:** Collapses to bottom nav or hamburger with slide-in drawer.

### Badges and Labels

No tinted badges. No soft colored pills. No same-hue background + text pairs.

Three permitted forms:
1. **Muted text label** — `text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground`: for CEFR codes and category identifiers in cards.
2. **Bordered label** — `border border-border rounded text-foreground text-xs font-semibold px-2 py-0.5`: for short identifiers that need visual distinction.
3. **Solid badge** — `bg-foreground text-card rounded px-1.5 py-0.5 text-xs font-semibold`: for high-priority status indicators only (e.g., "New", "Due").

### Module Progress Card (Signature Component)

- **Layout:** Horizontal card, icon left, title + status right, progress bar at bottom.
- **Progress bar:** `height: 4px`, `border-radius: 2px`. Fill animates on mount.
- **Completion state:** Checkmark icon in success green.
- **Locked state:** 60% opacity, `cursor: not-allowed`.

### Flashcard (Signature Component)

- **At rest:** White card, 1px border, vocabulary word in Title weight centered.
- **Flip:** CSS `perspective` + `rotateY(180deg)` on click/tap. Duration: 400ms, `ease-in-out`. Reduced motion: crossfade.
- **Rating buttons:** Four inline buttons after flip. `--destructive` (Again), Warning (Hard), Success (Good), `--primary` (Easy).

## 6. Do's and Don'ts

### Do:
- **Do** use `var(--primary)` (orange) only on buttons, progress fills, and selected states.
- **Do** use `1px solid var(--border)` (warm gray) on all cards, inputs, and containers.
- **Do** use Nunito 700–800 for display and headline roles. Body at 400.
- **Do** animate progress bars on mount with spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Do** use `prefers-reduced-motion` to replace animations with instant crossfades.
- **Do** keep reading passages at max-width 68ch with 1.75 line-height.
- **Do** use Geist Mono for IPA transcriptions, exercise scores, and code.
- **Do** make interactive cards clickable as a whole (card = link) rather than adding action buttons inside them.

### Don't:
- **Don't** use tinted badges (`bg-primary/10 text-primary`). Use muted-text labels or bordered labels instead.
- **Don't** use same-hue background + text combinations on any badge or pill.
- **Don't** use `box-shadow` anywhere. Surface contrast + 1px borders handle elevation.
- **Don't** use linear gradients on any surface.
- **Don't** use thick bottom borders on cards (`border-b-4`).
- **Don't** introduce a third accent color. Orange for action, teal for focus.
- **Don't** use Lora or any serif typeface.
- **Don't** use raw hex values in component files. All colors from CSS custom properties.
- **Don't** make this feel like an LMS, a generic SaaS, or Anki. It should feel like a focused, warm, Notion-calm workspace.
