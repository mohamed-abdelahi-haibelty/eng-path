# UI Context

## Theme

Light and dark modes supported. The visual language is Notion-calm: warm cream page background, white card surfaces, subtle warm-gray borders that define without dominating. Orange for primary actions only. Sage teal for focus rings and accents. Nunito's rounded warmth carries all text. Content-first — UI chrome is infrastructure.

**No linear gradients anywhere in the UI. Ever.**
**No box shadows anywhere in the UI.**
**No thick bottom borders on cards or buttons.**

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes.

## Color Tokens

### Light Mode

| Role                   | CSS Variable               | OKLCH value                                      |
| ---------------------- | -------------------------- | ------------------------------------------------ |
| Page background        | `--background`             | `oklch(0.988 0.002 80)` — #FFFEFC warm white     |
| Foreground text        | `--foreground`             | `oklch(0.2 0.01 80)` — #1A1A17 warm dark         |
| Card surface           | `--card`                   | `oklch(1 0 0)` — white                           |
| Card text              | `--card-foreground`        | `oklch(0.2 0.01 80)`                             |
| Popover surface        | `--popover`                | `oklch(1 0 0)` — white                           |
| Popover text           | `--popover-foreground`     | `oklch(0.2 0.01 80)`                             |
| Primary action         | `--primary`                | `oklch(0.17 0.008 80)` — #1F1E1C Notion near-black |
| Primary foreground     | `--primary-foreground`     | `oklch(1 0 0)` — white                           |
| Secondary surface      | `--secondary`              | `oklch(0.946 0.004 80)` — #F1F0EE light warm gray |
| Secondary foreground   | `--secondary-foreground`   | `oklch(0.2 0.01 80)`                             |
| Muted surface          | `--muted`                  | `oklch(0.962 0.003 80)` — #F7F6F4 soft gray-beige |
| Muted text             | `--muted-foreground`       | `oklch(0.55 0.01 80)` — #9B9A97 Notion placeholder |
| Accent highlight       | `--accent`                 | `oklch(0.575 0.19 253)` — #2383E2 Notion blue    |
| Accent foreground      | `--accent-foreground`      | `oklch(1 0 0)` — white                           |
| Destructive            | `--destructive`            | `oklch(0.56 0.22 27)` — #E03E3E Notion red       |
| Destructive foreground | `--destructive-foreground` | `oklch(1 0 0)` — white                           |
| Border / input outline | `--border`                 | `oklch(0.9 0.004 80)` — #E9E8E4 subtle warm gray |
| Input border           | `--input`                  | `oklch(0.9 0.004 80)` — #E9E8E4 subtle warm gray |
| Focus ring             | `--ring`                   | `oklch(0.575 0.19 253)` — Notion blue            |

#### Sidebar (light)

| Role                         | CSS Variable                    | OKLCH value                                       |
| ---------------------------- | ------------------------------- | ------------------------------------------------- |
| Sidebar background           | `--sidebar`                     | `oklch(0.96 0.004 80)` — #F7F7F5 warm off-white   |
| Sidebar text                 | `--sidebar-foreground`          | `oklch(0.2 0.01 80)`                              |
| Sidebar primary              | `--sidebar-primary`             | `oklch(0.17 0.008 80)` — near-black               |
| Sidebar primary foreground   | `--sidebar-primary-foreground`  | `oklch(1 0 0)` — white                            |
| Sidebar accent               | `--sidebar-accent`              | `oklch(0.924 0.005 80)` — hover state             |
| Sidebar accent foreground    | `--sidebar-accent-foreground`   | `oklch(0.2 0.01 80)`                              |
| Sidebar border               | `--sidebar-border`              | `oklch(0.9 0.004 80)` — subtle warm gray          |
| Sidebar ring                 | `--sidebar-ring`                | `oklch(0.575 0.19 253)` — Notion blue             |

### Dark Mode

| Role                   | CSS Variable               | OKLCH value                                         |
| ---------------------- | -------------------------- | --------------------------------------------------- |
| Page background        | `--background`             | `oklch(0.158 0.006 80)` — #191919 Notion dark       |
| Foreground text        | `--foreground`             | `oklch(0.93 0.008 80)` — #FFFFFFCF near-white warm  |
| Card surface           | `--card`                   | `oklch(0.198 0.008 80)` — #202020 block/card bg     |
| Popover surface        | `--popover`                | `oklch(0.228 0.008 80)` — #252525 dropdown/popover  |
| Primary action         | `--primary`                | `oklch(0.91 0.008 80)` — off-white dark primary     |
| Primary foreground     | `--primary-foreground`     | `oklch(0.158 0.006 80)`                             |
| Secondary surface      | `--secondary`              | `oklch(0.238 0.008 80)` — #2F2F2F hover surface     |
| Muted surface          | `--muted`                  | `oklch(0.258 0.008 80)` — #373737                   |
| Muted text             | `--muted-foreground`       | `oklch(0.6 0.01 80)` — #999999 dark placeholder     |
| Accent highlight       | `--accent`                 | `oklch(0.625 0.19 253)` — Notion blue brightened    |
| Border / input outline | `--border`                 | `oklch(0.32 0.008 80)` — #373737 dark divider       |
| Input border           | `--input`                  | `oklch(0.29 0.008 80)`                              |
| Focus ring             | `--ring`                   | `oklch(0.625 0.19 253)` — Notion blue               |

Tailwind utility names map to these variables via `@theme inline`. Use `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, etc.

## Typography

| Role         | Font        | Notes                           |
| ------------ | ----------- | ------------------------------- |
| All UI text  | Nunito      | Weights 400, 500, 600, 700, 800 |
| Code / mono  | Geist Mono  | IPA, scores, code blocks        |

No serif typeface. `Geist Mono` for IPA, scores, and code only. Base `body` uses Nunito with `antialiased`.

### Type Scale

| Role      | Weight | Size                        | Line height | Tracking    |
| --------- | ------ | --------------------------- | ----------- | ----------- |
| Display   | 800    | `clamp(2rem, 5vw, 3.5rem)` | 1.1         | -0.02em     |
| Headline  | 700    | `clamp(1.5rem, 3vw, 2rem)` | 1.2         | -0.015em    |
| Title     | 600    | `1.125rem`                  | 1.4         | -0.01em     |
| Body      | 400    | `1rem`                      | 1.75        | 0           |
| Label     | 700    | `0.8125rem`                 | 1.4         | 0.01em      |
| Mono      | 400    | `0.9375rem`                 | 1.6         | 0           |

Reading passages (Reading module): Body at `1.125rem`, `max-width: 68ch`.

## Border Radius

| Context          | Class         | Approx. value |
| ---------------- | ------------- | ------------- |
| Inline / badges  | `rounded`     | 4px           |
| Inputs / small   | `rounded-md`  | 6px           |
| Buttons          | `rounded-lg`  | 8px           |
| Cards / panels   | `rounded-xl`  | 12px          |
| Large containers | `rounded-2xl` | 16px          |
| Modal / overlay  | `rounded-2xl` | 16px          |

## Motion Tokens

| Use                      | Value                                | Duration |
| ------------------------ | ------------------------------------ | -------- |
| Progress fill (spring)   | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 400ms    |
| Hover color transitions  | `ease-out`                           | 150ms    |
| Flashcard flip           | `ease-in-out`                        | 400ms    |
| Page / card entrances    | `ease-out`                           | 250ms    |

All motion must respect `prefers-reduced-motion` — replace with 0ms crossfades.

## Iconography

Lucide React. Stroke-based icons only. Sizes: `h-3.5 w-3.5` for small inline, `h-4 w-4` for standard inline, `h-5 w-5` for nav and buttons, `h-8 w-8` for feature icons. Icon color follows parent text color.

## Component Library

shadcn/ui on top of Tailwind. Components in `components/ui/`. Use shadcn CLI to add new components. Customize variants to map to the token system above.

## Cards and Surfaces

Cards use `bg-card` (white) with `border border-border` (1px warm gray). No thick bottom borders. No shadows. Corners: `rounded-xl`. Padding: `p-5` (20px).

**Interactive cards** (unit cards, level cards) are wrapped in a `<Link>` — the whole card is the click target. Hover state: `hover:bg-muted/50` with `transition-colors duration-150`. No translate effects.

**No semantic color on card surfaces.** No per-level or per-module colored backgrounds, tinted fills, or colored borders on card surfaces.

## Buttons

Flat, simple, Notion-aligned.

- **Primary**: `bg-primary text-primary-foreground rounded-lg font-semibold` (near-black bg, white text). Hover: `opacity-90`.
- **Secondary**: `bg-secondary text-secondary-foreground rounded-lg`. Hover: `bg-muted`.
- **Outline**: `border border-border bg-transparent text-foreground rounded-lg`. Hover: `bg-muted`.
- **Ghost**: No border, no background. `text-muted-foreground`. Hover: `bg-muted text-foreground`.
- **Destructive**: `bg-destructive text-destructive-foreground`. Hover: `opacity-90`.

Heights: `h-8` default, `h-7` small, `h-10` large.

## Badges and Labels

No tinted badges. No soft-colored pills. No same-hue background + text pairs.

Permitted patterns:
- **Muted text**: `text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground` — CEFR codes, categories
- **Bordered**: `border border-border rounded text-foreground text-xs font-semibold px-2 py-0.5` — short identifiers
- **Solid**: `bg-foreground text-card rounded px-1.5 py-0.5 text-xs font-semibold` — high-priority status only
