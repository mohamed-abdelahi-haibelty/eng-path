# UI Context

## Theme

Light only. No dark mode. The visual language is "The Scholar's Playground" — an indigo-tinted neutral canvas with Nunito's rounded warmth and choreographed spring motion. Inspired by Duolingo's celebratory energy filtered through a Notion-level calm.

**No linear gradients anywhere in the UI. Ever.**
**No box shadows anywhere in the UI.** Depth comes exclusively from the thick bottom border.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes.

## Color Tokens

| Role                  | CSS Variable              | Hex value                   |
| --------------------- | ------------------------- | --------------------------- |
| Page background       | `--bg-base`               | `#f5f4ff`                   |
| Surface               | `--bg-surface`            | `#ffffff`                   |
| Elevated surface      | `--bg-elevated`           | `#faf9ff`                   |
| Subtle surface        | `--bg-subtle`             | `#edeaff`                   |
| Default border        | `--border-default`        | `#e2e0f5`                   |
| Subtle border         | `--border-subtle`         | `#d4d2ea`                   |
| Primary text          | `--text-primary`          | `#1e1b4b`                   |
| Secondary text        | `--text-secondary`        | `#4a4870`                   |
| Muted text            | `--text-muted`            | `#7c7aa8`                   |
| Faint text            | `--text-faint`            | `#c5c3d8`                   |
| Brand accent          | `--accent-primary`        | `#4f46e5` (focused indigo)  |
| Brand accent dark     | `--accent-primary-dark`   | `#3730a3`                   |
| Brand dim             | `--accent-primary-dim`    | `rgba(79, 70, 229, 0.12)`   |
| Card background       | `--bg-card`               | `#ffffff`                   |
| Card foreground       | `--text-card`             | `#1e1b4b`                   |
| Error                 | `--state-error`           | `#ef4444`                   |
| Success               | `--state-success`         | `#22c55e`                   |
| Warning               | `--state-warning`         | `#f59e0b`                   |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `bg-card`, `text-primary`, `text-muted`, `border-default`, `text-brand`, `bg-accent-dim`, etc.

## Typography

| Role         | Font        | CSS Variable        | Notes                          |
| ------------ | ----------- | ------------------- | ------------------------------ |
| All UI text  | Nunito      | `--font-nunito`     | Weights 400, 500, 600, 700, 800|
| Code / mono  | Geist Mono  | `--font-geist-mono` | IPA, scores, code blocks       |

`Nunito` is loaded via `next/font/google` with weights 400–800 for all UI and reading content. There is **no serif typeface** in this system — Lora has been removed. `Geist Mono` is used exclusively for IPA transcriptions, exercise score numerals, and code blocks. The base `body` uses Nunito with `antialiased`.

### Type Scale

| Role      | Weight | Size                        | Line height | Tracking    |
| --------- | ------ | --------------------------- | ----------- | ----------- |
| Display   | 800    | `clamp(2rem, 5vw, 3.5rem)` | 1.1         | -0.02em     |
| Headline  | 700    | `clamp(1.5rem, 3vw, 2rem)` | 1.2         | -0.015em    |
| Title     | 600    | `1.125rem`                  | 1.4         | -0.01em     |
| Body      | 400    | `1rem`                      | 1.75        | 0           |
| Label     | 700    | `0.8125rem`                 | 1.4         | 0.01em      |
| Mono      | 400    | `0.9375rem`                 | 1.6         | 0           |

For reading passages (Reading module), use Body at `1.125rem` with `max-width: 68ch`.

## Border Radius

Generous and consistent across components.

| Context          | Class         | Value   |
| ---------------- | ------------- | ------- |
| Inline / tags    | `rounded-lg`  | `8px`   |
| Buttons / inputs | `rounded-xl`  | `20px`  |
| Cards / panels   | `rounded-2xl` | `24px`  |
| Modal / overlay  | `rounded-3xl` | `32px`  |

## Motion Tokens

| Token             | CSS Variable        | Value                               | Use                                    |
| ----------------- | ------------------- | ----------------------------------- | -------------------------------------- |
| Spring easing     | `--ease-spring`     | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Entrances, progress fills, card hover |
| Standard out      | `--ease-out`        | `cubic-bezier(0.0, 0.0, 0.2, 1)`    | Exits, fades, press collapse          |
| Fast duration     | `--duration-fast`   | `100ms`                             | Button press state                    |
| Base duration     | `--duration-base`   | `250ms`                             | Most transitions                      |
| Slow duration     | `--duration-slow`   | `400ms`                             | Page entrances, flashcard flip        |

All motion must be wrapped in a `prefers-reduced-motion` check. The `globals.css` base layer sets `transition-duration: 0.01ms` and `animation-duration: 0.01ms` when reduced motion is requested.

## Iconography

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states and module headers. Icon color follows the parent text color unless it is a module-colored icon.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch. Customize shadcn component variants to map to the token system above.

## CEFR Level Color Coding

Each CEFR level has a dedicated accent used for badges, progress indicators, and level cards. All fills are solid — no gradients.

| Level | Label        | Badge fill  | Badge text  |
| ----- | ------------ | ----------- | ----------- |
| A1    | Beginner     | `#ede9fe`   | `#5b21b6`   |
| A2    | Elementary   | `#dbeafe`   | `#1e40af`   |
| B1    | Intermediate | `#d1fae5`   | `#065f46`   |
| B2    | Upper-Int    | `#fef3c7`   | `#92400e`   |

## Module Color Coding

Each of the six learning modules has a fixed accent pair used on module cards and progress indicators.

| Module    | Icon accent        | Dim background              |
| --------- | ------------------ | --------------------------- |
| Grammar   | `#6ee7b7` (teal)   | `rgba(110, 231, 183, 0.12)` |
| Reading   | `#93c5fd` (blue)   | `rgba(147, 197, 253, 0.12)` |
| Listening | `#818cf8` (indigo) | `rgba(129, 140, 248, 0.12)` |
| Writing   | `#f0abfc` (violet) | `rgba(240, 171, 252, 0.12)` |
| Speaking  | `#f472b6` (pink)   | `rgba(244, 114, 182, 0.12)` |
| Review    | `#fcd34d` (amber)  | `rgba(252, 211, 77, 0.12)`  |

## Cards and Surfaces

Cards use `--bg-card` (`#ffffff`) with a `1px` border in `--border-default` and a `4px` bottom border in `--border-subtle` for a tactile depth effect. Corners use `rounded-2xl`. No card should use a colored or tinted background unless it is a status/highlight card. **No box shadows** — depth is conveyed through the thick bottom border only.

Interactive cards (unit cards, module cards) apply a spring hover lift: `transform: translateY(-2px)` with `transition: transform var(--duration-base) var(--ease-spring)`.

## Buttons

- **Primary**: Background `--accent-primary` (`#4f46e5` indigo), white text (`#ffffff`), `rounded-xl`, `font-bold` (700), `border-b-4` in `--accent-primary-dark` (`#3730a3`) for depth. Active: `translate-y-[3px]` + `border-b-[1px]` press effect.
- **Secondary**: Background `--bg-subtle` (`#edeaff`), text `--text-primary`, `rounded-xl`, `font-bold`, `border-b-4` in `--border-default`. Active: press effect.
- **Outline**: Transparent background, `1px` border `--border-default`, text `--text-primary`. Hover: `bg-subtle`.
- **Ghost**: No border, no background. Text `--text-secondary`. Hover: `bg-subtle`. No press effect.
- **Destructive**: Background `--state-error`, white text.

All buttons use `rounded-xl`, consistent horizontal padding (`px-4` default, `px-6` prominent CTAs), and `h-9` / `h-10` height tiers.
