# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or function.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts and `type` for unions, intersections, and primitives.
- Prefer Zod schemas at AI response boundaries — never trust unparsed AI output.
- Use Convex's `v` validators on every query, mutation, and action argument.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, real-time state, or browser APIs (audio recording, drag-and-drop, flashcard flip).
- Keep page components thin — push data fetching and logic into Convex queries.
- Use the Convex React client (`useQuery`, `useMutation`, `useAction`) inside client components for reactive data.
- For server components, use the Convex server client to fetch initial data when hydration speed matters.

## Convex

- Every Convex function file lives in `convex/` under the appropriate subdirectory: `queries/`, `mutations/`, `actions/`, or `lib/`.
- Queries are pure reads. Mutations are atomic writes. Actions handle external I/O and long-running work.
- All functions must declare their argument validators using `v.*` from `convex/values`.
- Auth checks run at the top of every function that touches user data: call `ctx.auth.getUserIdentity()` and reject if missing.
- Resource ownership checks must compare the authenticated user ID against the resource's owner field before any read or write.
- Internal helpers between Convex functions go through `internalMutation`, `internalQuery`, or `internalAction` — never call public functions internally.
- Schema changes go in `convex/schema.ts` and are applied via `npx convex dev`.

## Styling

- Use CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-base`, `bg-surface`, `text-primary`, `text-muted`, `border-default`, `text-brand`, `bg-accent-dim`, etc.
- Maintain the border radius scale: `rounded-lg` for tags, `rounded-xl` for buttons and inputs, `rounded-2xl` for cards, `rounded-3xl` for modals.
- No linear gradients anywhere in the UI.
- Use `Lora` (`font-serif`) only for reading passages and long-form learning content. All other UI uses Geist Sans.
- Use `Geist Mono` (`font-mono`) only for IPA transcriptions, code blocks, and score numerals.

## AI Integration

- All AI providers used at runtime must be cloud-based and offer a free or freemium tier sufficient for personal use.
- No models run locally. No Whisper, no edge-tts, no on-device inference.
- AI calls happen only in Convex actions at runtime.
- All AI calls are wrapped in retry logic with exponential backoff at the boundary.
- All AI responses are parsed and validated against a Zod schema before being persisted.
- AI prompts are stored as named constants in `convex/lib/prompts/` (runtime) — not inlined in business logic.
- Prompts include explicit JSON output instructions; structured output is required.
- API keys are accessed only through Convex environment variables in actions, never exposed to client code.

## Audio Handling

- Audio capture in the browser uses the `MediaRecorder` API in client components only.
- Recording state must guard against permission denials and surface clear UI feedback.
- Uploaded audio is sent to Convex File Storage via the `useUploadFile` hook or a generated upload URL from a mutation.
- If an upload fails, the recording is buffered in IndexedDB and retried on reconnect.
- Audio playback uses native `<audio>` elements styled to match the design system.
- Audio file URLs are generated through Convex's storage API and never exposed as raw blob URLs.

## Flashcard and Spaced Repetition

- All FSRS logic is encapsulated in `convex/lib/fsrs.ts` — never inline FSRS computations in components or function handlers.
- Reviews mutate flashcard state atomically: update the `flashcards` row and insert a `flashcardReviews` row in a single Convex mutation.
- The due-card query must always filter by the authenticated user ID and `due <= now()`.

## File Organization

- `app/` — Next.js routes and pages.
- `app/(learning)/` — route group for the learning flow (units, modules, flashcards, dashboard).
- `app/api/` — route handlers only when Convex functions are not appropriate (e.g., webhook receivers).
- `components/` — UI composition only; no business logic.
- `components/ui/` — shadcn/ui foundation components. Do not modify.
- `convex/` — Convex backend code.
- `convex/queries/` — reactive read functions.
- `convex/mutations/` — atomic write functions.
- `convex/actions/` — long-running operations and external API calls.
- `convex/lib/` — shared backend helpers (FSRS, prompts, validators).
- `lib/` — shared client-side utilities and hooks.
- `scripts/curriculum-generator/` — offline content generation pipeline. Not bundled with the app.
- `data/` and `content/` — generated curriculum JSON files seeded into Convex.
- Name files after the responsibility they contain, not the technology.

## Naming

- Components in PascalCase: `FlashcardReview.tsx`, `GrammarExerciseRunner.tsx`.
- Route segments in kebab-case: `app/units/[unitId]/grammar/page.tsx`.
- Convex function files in camelCase: `convex/mutations/addFlashcard.ts`, `convex/actions/evaluateWriting.ts`.
- Convex table names in camelCase plural: `users`, `units`, `vocabulary`, `flashcards`, `unitProgress`.
- Convex table fields in camelCase: `unitNumber`, `audioFileId`, `dueAt`.
