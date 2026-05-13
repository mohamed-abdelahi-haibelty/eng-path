# UI Context

## Theme

Light only. No dark mode. The visual language is a clean, friendly learning workspace — warm off-white backgrounds, layered paper-like surfaces, and earthy accent colors for interactive elements. Inspired by PostHog's aesthetic and a slight playful edge.

No linear gradients anywhere in the UI. Ever.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes.

| Role                  | CSS Variable              | Hex / Value                 |
| --------------------- | ------------------------- | --------------------------- |
| Page background       | `--bg-base`               | `#f4f4f0`                   |
| Surface               | `--bg-surface`            | `#ffffff`                   |
| Elevated surface      | `--bg-elevated`           | `#fafaf8`                   |
| Subtle surface        | `--bg-subtle`             | `#f0f0eb`                   |
| Default border        | `--border-default`        | `#e2e2db`                   |
| Subtle border         | `--border-subtle`         | `#d4d4cc`                   |
| Primary text          | `--text-primary`          | `#1f2937`                   |
| Secondary text        | `--text-secondary`        | `#4b5563`                   |
| Muted text            | `--text-muted`            | `#9ca3af`                   |
| Faint text            | `--text-faint`            | `#d1d5db`                   |
| Brand accent          | `--accent-primary`        | `#f7a5a5` (soft rose)       |
| Brand accent dark     | `--accent-primary-dark`   | `#d97878`                   |
| Brand dim             | `--accent-primary-dim`    | `rgba(247, 165, 165, 0.14)` |
| Secondary accent      | `--accent-secondary`      | `#8fad88` (sage green)      |
| Secondary accent dark | `--accent-secondary-dark` | `#6e8e67`                   |
| Secondary dim         | `--accent-secondary-dim`  | `rgba(143, 173, 136, 0.14)` |
| Card background       | `--bg-card`               | `#ffffff`                   |
| Card foreground       | `--text-card`             | `#1f2937`                   |
| Error                 | `--state-error`           | `#ef4444`                   |
| Success               | `--state-success`         | `#f7a5a5`                   |
| Warning               | `--state-warning`         | `#fbbf24`                   |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `bg-card`, `text-primary`, `text-muted`, `border-default`, `text-brand`, `bg-accent-dim`, `text-accent-secondary`, etc.

## Typography

| Role         | Font       | CSS Variable        |
| ------------ | ---------- | ------------------- |
| UI text      | Geist Sans | `--font-geist-sans` |
| Reading body | Lora       | `--font-lora`       |
| Code/mono    | Geist Mono | `--font-geist-mono` |

`Geist Sans` is loaded via `next/font/google` for all UI chrome. `Lora` (a serif) is used exclusively within reading passages and long-form content to improve readability and signal a "textbook" register. `Geist Mono` is used for IPA transcriptions, code blocks, and score numerals. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

Radius is consistent and generous, evoking a friendly but professional tool — not sharp, not bubbly.

| Context          | Class         |
| ---------------- | ------------- |
| Inline / tags    | `rounded-lg`  |
| Buttons / inputs | `rounded-xl`  |
| Cards / panels   | `rounded-2xl` |
| Modal / overlay  | `rounded-3xl` |

## Iconography

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states and module headers.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch. Customize shadcn component variants to map to the token system above.

## CEFR Level Color Coding

Each CEFR level has a dedicated accent used for badges, progress indicators, and level cards. All fills are solid — no gradients.

| Level | Label        | Badge fill | Badge text |
| ----- | ------------ | ---------- | ---------- |
| A1    | Beginner     | `#dbeafe`  | `#1d4ed8`  |
| A2    | Elementary   | `#dcfce7`  | `#15803d`  |
| B1    | Intermediate | `#fef9c3`  | `#a16207`  |
| B2    | Upper-Int    | `#ffedd5`  | `#c2410c`  |

## Module Color Coding

Each of the six learning modules has a fixed accent pair used on module cards and progress indicators.

| Module    | Icon accent        | Dim background              |
| --------- | ------------------ | --------------------------- |
| Grammar   | `#8fad88` (green)  | `rgba(143, 173, 136, 0.12)` |
| Reading   | `#60a5fa` (blue)   | `rgba(96, 165, 250, 0.12)`  |
| Listening | `#a78bfa` (violet) | `rgba(167, 139, 250, 0.12)` |
| Writing   | `#f7a5a5` (rose)   | `rgba(247, 165, 165, 0.12)` |
| Speaking  | `#f472b6` (pink)   | `rgba(244, 114, 182, 0.12)` |
| Review    | `#fbbf24` (amber)  | `rgba(251, 191, 36, 0.12)`  |

## Cards and Surfaces

Cards use `--bg-card` (`#ffffff`) with a `2px` border in `--border-default` and a `4px` bottom border in `--border-subtle` for a Duolingo-style depth effect. Corners use `rounded-2xl`. No card should use a colored or tinted background unless it is a status/highlight card. No box shadows — depth is conveyed through the thick bottom border only.

## Buttons

- **Primary**: Background `--accent-primary` (`#f7a5a5` rose), text dark (`#1f2937`), `rounded-xl`, `font-bold`, thick `border-b-4` in `--accent-primary-dark` for depth. Active: `translate-y-[3px]` press effect.
- **Secondary**: Background `--accent-secondary` (`#8fad88` sage green), text white, `rounded-xl`, `font-bold`, thick `border-b-4` in `--accent-secondary-dark` for depth. Active: press effect.
- **Outline**: Transparent background, `1px` border `--border-default`, text `--text-primary`. Hover: `bg-subtle`.
- **Ghost**: No border, no background. Text `--text-secondary`. Hover: `bg-subtle`.
- **Destructive**: Background `--state-error`, text white.

All buttons use `rounded-xl`, consistent horizontal padding (`px-4` for default, `px-6` for prominent CTAs), and `h-9` / `h-10` height tiers.
