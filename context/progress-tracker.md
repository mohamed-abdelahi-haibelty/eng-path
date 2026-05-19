# Progress Tracker

## Current Phase

Phase 3: Curriculum Seed + Core Queries

## Current Goal

Implement remaining Convex queries for vocabulary and user progress on top of the seeded curriculum.

## Completed

- **Design System** — shadcn/ui + Tailwind v4; shared primitives: `BackLink`, `Eyebrow`, `Button`; skeleton components in `components/skeletons/`; `lib/levels.ts`, `lib/modules.ts`, `lib/errors.ts`; `hooks/use-network-aware-query.ts`.

- **Database Schema** — `convex/schema.ts` with 13 tables + `authTables`; discriminated union exercises; CEFR-typed levels; array-based speaker model.

- **Authentication** — GitHub OAuth via Convex Auth; `proxy.ts` route protection; `convex/auth.config.ts` JWT issuer = `CONVEX_SITE_URL`; always use `getAuthUserId(ctx)` — never cast `identity.subject`.

- **Curriculum Seed** — `npm run seed` (idempotent); 120 units, ~5040 vocab words; slug convention `{level}-unit-{NN}-{kebab-topic}`; `speakingSubmissions` supports per-response scores (fluency/coherence/vocabulary/grammar 0–5).

- **Home Page** — `convex/queries/home.ts` (`homeData` query: user info, per-level completion, continue-shortcut unit, due flashcard count); level cards in a 2×2 responsive grid.

- **Level Page** — `convex/queries/units.ts` (`unitsByLevel`: 30 units ordered by number, joins per-unit progress, returns `completedModules/totalModules=6`); sticky header, unit rows with progress bars, skeleton + error states.

- **Unit Page** — `convex/queries/unit.ts` (`unitBySlug`: unit + progress, module lock states, grammar score ≥70% gate); 3-col responsive module grid; `components/ModuleCard.tsx`.

- **Grammar Page** — `convex/queries/grammar.ts` + `convex/mutations/grammar.ts` (`submitGrammarScore`, upserts `unitProgress`, gates on score ≥70%); Notion-style client page with Markdown explanation, 20 exercises (5 types), single submit, per-question feedback, score badge, Try Again reset; on pass the CTA navigates directly to the Reading module (`/reading`) instead of back to the unit.

- **Global Error Handling** — `lib/errors.ts`: `ErrorCode`, `AppError`, `AppException` (extends `ConvexError`), `normalizeError`; `lib/fetch.ts`: `safeFetch` with 10s timeout; `hooks/use-action.ts`; UI components `ErrorMessage` + `ErrorBanner`; `app/error.tsx` + `app/not-found.tsx`; all pages and Convex functions wired to the convention.

- **Design System Extraction** — Removed ~120 lines of duplication; all pages now share `BackLink`, `Eyebrow`, `Button`, `useNetworkAwareQuery`, `getLevelMeta`; stale `UnitPageSkeleton.tsx` deleted.

- **Reading Page** — `convex/queries/reading.ts` (`readingBySlug`); `convex/queries/vocabulary.ts` (`vocabularyByUnit`, internal `_untranslatedByUnit`); `convex/mutations/reading.ts` (`submitReadingScore` ≥60% gate, `addToFlashcards` upsert, internal `storeArabicTranslationsBatch`); `convex/actions/vocabulary.ts` (`prefetchUnitTranslations` — fires on grammar page mount via `useEffect`, skips if all words already translated, sends one batched Langbly Translate v2 request for all untranslated words, stores via `storeArabicTranslationsBatch`; `actions/reading.ts` deleted — no per-word fallback); schema: `arabicTranslation?: string` on `vocabulary`; `FlashCard` renders translation directly from DB prop — no API call on flip; client page at `app/(learning)/levels/[level]/[unit]/reading/page.tsx` — vocab carousel with CSS flip animation, react-markdown passage, 5-question MCQ with per-answer feedback; `components/skeletons/reading-skeleton.tsx`.

- **Listening Page** — `convex/queries/listening.ts` (`listeningBySlug`: returns unit, questions only (no dialogue/transcript), `ctx.storage.getUrl(audioStorageId)` for temp audio URL, progress including `listeningListensUsed`); `convex/mutations/listening.ts` (`submitListeningScore` ≥60% gate upserts `unitProgress`; `recordListen` increments `listeningListensUsed` max 2, idempotent at max); client page at `app/(learning)/levels/[level]/[unit]/listening/page.tsx` — two sequential phases: Phase 1 (audio player with pulsing orb button); Phase 2 (5-question MCQ, reuses `QuestionCard` from reading, same submit/score/retry pattern, pass ≥60% CTA navigates to unit); `_components/AudioOrb.tsx` — 160px warm-gray circle, CSS keyframe expanding rings + breathe animation in playing state, RotateCcw in completed state, dimmed Headphones in exhausted state, timer `0:23 / 1:45` format + 1px progress track below orb during playback; orb tracks local listen count starting from `initialListensUsed`, calls `onComplete` on each `audio.ended` event; `components/skeletons/listening-skeleton.tsx` (includes header placeholder to prevent layout shift); orb keyframes live in `globals.css` (`.orb-breathe` / `.orb-pulse` with `prefers-reduced-motion` support).

## In Progress

_(nothing active)_

## Next Up

1. **Writing Page** — AI evaluation via Groq; `writingSubmissions` with feedback status polling.
3. **Speaking evaluation** — `convex/speaking/evaluate.ts`: Groq API (llama-3.3-70b-versatile, temp 0.1, JSON), pre-LLM gates (< 10 words → zeros, < 25 words → fluency ≤ 2), Zod validation, 1 retry, persists scores + feedback.
4. **Core queries** — `convex/queries/progress.ts` (per-user progress + unlock gating).

## Architecture Decisions

- `globals.css` uses `@theme inline` (Tailwind v4).
- `DialogTrigger` / `TooltipTrigger` / `Button` use `render` prop (`@base-ui/react`, not Radix).
- Do not modify files in `components/ui/` — generated by shadcn CLI.
- Use `getAuthUserId(ctx)` from `"@convex-dev/auth/server"` for the authenticated `Id<"users">`. Never cast `identity.subject`.
