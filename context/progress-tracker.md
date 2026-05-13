# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 2: Backend (Database & Auth) → Phase 3: Curriculum Seed + Core Queries

## Current Goal

- Seed curriculum content and implement core Convex queries for units, vocabulary, and user progress.

## Completed

- **Design system (spec/01-design-system.md)**

  - shadcn/ui installed and configured (`components.json`, style: base-nova)
  - All required shadcn components added: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea, Sonner, RadioGroup, Label, Tooltip, Skeleton, Sidebar, Breadcrumb, Separator, Badge, Avatar, Progress
  - `lucide-react` already present in dependencies
  - `lib/utils.ts` with `cn()` helper already present and correct
  - `app/globals.css` updated with full design system token set:
    - All CSS custom properties defined in `:root` (`--bg-*`, `--text-*`, `--accent-*`, `--border-*`, `--state-*`)
    - shadcn standard tokens mapped (`--color-background`, `--color-primary`, etc.) in `@theme inline`
    - Design system semantic utilities defined via `@layer utilities` (`text-primary`, `text-muted`, `border-default`, `bg-base`, `bg-accent-dim`, etc.)
    - Sidebar CSS variables and Tailwind color tokens added
  - `app/layout.tsx` updated: added Lora font (`--font-lora`), updated title/description, font variable applied to `<html>`

- **Database schema (context/schema-review.md)**
  - Created `convex/schema.ts` with 13 tables implementing the full Eng Path data model
  - Fixed critical issues: added `tokenIdentifier` for Convex Auth, replaced JSON string exercise data with discriminated unions, split exercises into separate queryable tables
  - Created new tables: `grammarExercises` (20 per unit, discriminated union types), `reviewExercises` (12-15 per unit, discriminated union types)
  - Applied best practices: typed unions for CEFR levels, array-based speaker model, required audio storage IDs, status indexes for pending feedback

- **Authentication (spec/02-auth.md)**

  - `convex/auth.ts` — `convexAuth` with GitHub provider (was already in place)
  - `convex/http.ts` — HTTP router wiring `auth.addHttpRoutes(http)` for OAuth callbacks
  - `components/providers.tsx` — `ConvexClientProvider` (client component wrapping `ConvexAuthNextjsProvider`)
  - `app/layout.tsx` — wrapped with `ConvexAuthNextjsServerProvider` (server) and `ConvexClientProvider` (client)
  - `app/(auth)/sign-in/page.tsx` — sign-in page with "Continue with GitHub" button using `useAuthActions`
  - `proxy.ts` — route protection via `convexAuthNextjsMiddleware`; all routes protected except `/sign-in`; matcher updated to include `/api/auth` so sign-in actions are proxied to Convex
  - `convex/auth.config.ts` — created with `CONVEX_SITE_URL` as JWT issuer and `"convex"` as applicationID; required for `ctx.auth.getUserIdentity()` to work
  - `convex/schema.ts` — spread `authTables` from `@convex-dev/auth/server`; `users` table rewritten to extend auth fields (`name`, `image`, `email`, `emailVerificationTime`, `phone`, `phoneVerificationTime`, `isAnonymous`) plus app-specific `createdAt`; removed `tokenIdentifier`, `githubId`, and old indexes
  - `app/(auth)/login/page.tsx` — empty stub replaced with redirect to `/sign-in`
  - Fixed pre-existing `asChild` type errors in `app/page.tsx` (base-ui uses `render` prop instead)
  - `npm run build` passes; GitHub OAuth flow verified end-to-end (user stored in Convex dashboard)

## In Progress

- None.

## Next Up

- Implement the speaking evaluation Convex action (`convex/speaking/evaluate.ts`):
  - Pre-LLM word count gate (< 10 words → all zeros, no LLM call)
  - Fluency cap: < 25 words → fluency capped at 2 after LLM scoring
  - Groq API call (llama-3.3-70b-versatile, temp 0.1, JSON only)
  - Zod validation of LLM response before persisting
  - One retry on Groq failure, fallback to error state
  - Persists `scores`, `totalScore`, `feedback`, `suggestion`, `wordCount` per response
- Curriculum seed script and core Convex queries (units, vocabulary, user progress).

## Open Questions

- None at this phase.

## Architecture Decisions

- `globals.css` uses `@theme inline` (Tailwind v4) for color tokens. shadcn token names (`--color-primary`, `--color-muted`, etc.) drive shadcn component behavior; design system semantic names override auto-generated utilities via `@layer utilities` to resolve naming conflicts (e.g. `text-primary` = `#1f2937`, not brand green).
- `--color-primary` = sage green (#8fad88) so shadcn button `bg-primary` renders correctly. `text-primary` is then overridden in `@layer utilities` to the dark body text color.
- `--color-secondary` = salmon (#ffa07a) so shadcn button `bg-secondary` renders correctly per design spec.

## Session Notes

- **2026-05-12**: Schema review complete. Created `convex/schema.ts` with all best practices applied. Fixed 8 critical/important issues: added tokenIdentifier, replaced JSON exercise data with discriminated unions, split exercises into separate tables, added status indexes, fixed index naming, and more. See context/schema-review.md for details.
- **2026-05-13**: Authentication complete (spec/02-auth.md). GitHub OAuth via Convex Auth. `proxy.ts` protects all routes except `/sign-in`. `convex/auth.config.ts` added (JWT issuer = `CONVEX_SITE_URL`). Schema updated to spread `authTables`; `users` table realigned to auth library shape. `npm run build` passes. GitHub OAuth flow verified end-to-end. Phase 2 done.
- **2026-05-13**: `speakingSubmissions` schema updated to match speaking evaluation spec. Replaced `score: number` with `scores: { fluency, coherence, vocabulary, grammar }` (each 0–5), `totalScore` (0–20 sum), `wordCount`, and `suggestion` per response. `overallScore` represents average across all 10 responses.
- Do not modify files in `components/ui/` — they are generated by shadcn CLI.
- `DialogTrigger` and `TooltipTrigger` use `render` prop (not `asChild`) — these components use `@base-ui/react`, not Radix.
