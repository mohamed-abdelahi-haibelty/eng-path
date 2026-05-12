# Architecture Context

## Stack

| Layer             | Technology                 | Role                                                           |
| ----------------- | -------------------------- | -------------------------------------------------------------- |
| Framework         | Next.js 16 + TypeScript    | Full-stack app with server/client boundaries                   |
| UI                | Tailwind + shadcn/ui       | Component composition and styling                              |
| Backend platform  | Convex                     | Database, auth, file storage, server functions, scheduled jobs |
| Auth              | Convex Auth                | Github Auth                                                    |
| Database          | Convex DB                  | Reactive document database for all metadata                    |
| File storage      | Convex File Storage        | Audio assets and user speaking recordings                      |
| Background work   | Convex Actions + Scheduler | Long-running AI evaluation calls and scheduled tasks           |
| Spaced repetition | ts-fsrs                    | Flashcard scheduling algorithm                                 |
| AI evaluation     | Groq (Llama 3.3 70B)       | Runtime writing and speaking feedback                          |
| Speech-to-text    | Groq Whisper Large v3      | Speaking response transcription                                |

All AI providers are cloud-based with free or freemium tiers. No models run locally.

## System Boundaries

- `app/` — Next.js routes and pages. Server components by default.
- `convex/` — Convex backend: schema, queries, mutations, actions, and auth configuration.
- `convex/queries/` — Read-only reactive queries.
- `convex/mutations/` — Atomic writes to the database.
- `convex/actions/` — Long-running operations and external API calls (AI evaluation).
- `convex/lib/` — Shared backend utilities including FSRS wrapper and Zod schemas.
- `components/` — UI composition: module pages, flashcard interfaces, exercise runners, and shared primitives.
- `components/ui/` — shadcn/ui foundation components.
- `lib/` — Shared client-side utilities and hooks.

## Storage Model

- **Convex DB**: user accounts, curriculum content (units, vocabulary, passages, dialogues, prompts, exercises), user progress, flashcard state, submission records.
- **Convex File Storage**: audio assets — listening dialogues, and user speaking recordings.
- File storage IDs are stored on Convex records as references (e.g., `audioFileId: v.id("_storage")`).
- Curriculum text content lives in the database as structured documents.
- Binary audio data lives only in Convex File Storage, never in the database.
- Convex generates time-limited URLs for audio playback through the storage API.

## Auth and Access Model

- The platform use github auth for authentication via convex auth.
- Every authenticated session is associated with a single Convex user document.
- All Convex mutations and queries that touch user data must call `ctx.auth.getUserIdentity()` and verify the resource belongs to the authenticated user.
- Curriculum content is read-only at runtime; only the offline seed script writes to curriculum tables.
- User progress, submissions, and flashcards are scoped to the authenticated user.

## Curriculum Content Model

- The curriculum consists of 120 units across four CEFR levels (A1–B2), thirty units per level.
- Each unit has a fixed topic, knowledge focus, TOEFL angle, and grammar point defined in `data/topics.json`.
- Each unit contains six modules: grammar, reading, listening, writing, speaking, and review.
- Vocabulary is topic-derived and unique across the curriculum — no word appears in two units.
- Curriculum content is pre-generated and seeded once. The runtime application only reads it.

## AI Generation Model

### Writing Evaluation (Runtime)

- Input: user-submitted text, the unit's writing prompt, and the evaluation rubric.
- Execution: a Convex action invoked from a mutation. The action calls the Groq API (Llama 3.3 70B) and writes the result back via an internal mutation.

### Speaking Evaluation (Runtime)

- Input: user audio recording stored in Convex File Storage, the unit's speaking question, and the evaluation rubric.
- Execution: a Convex action that downloads the audio from storage, transcribes via Groq Whisper, evaluates the transcript via Groq Llama 3.3, then writes the result back via an internal mutation.

## Module Progression Model

- Modules within a unit must be completed in order: Grammar → Reading → Listening → Writing → Speaking → Review.
- The grammar module requires a passing score (≥70%) before the reading module unlocks.
- Other modules unlock sequentially upon completion of the previous one.
- Units within a level are unlocked sequentially based on completion of the previous unit's full module set.
- Module progression state is computed from Convex queries and never trusted from the client.

## Flashcard Model

- Flashcards are personal to the authenticated user and reference vocabulary records in the curriculum.
- A user can add the same vocabulary item to flashcards only once. The mutation enforces this with a uniqueness check.
- Each flashcard carries the FSRS state (stability, difficulty, due date, repetitions, lapses, last review).
- The review queue is a Convex query that returns flashcards where `due <= now()`, scoped to the authenticated user.
- Reviews mutate the FSRS state via the `ts-fsrs` library inside a Convex mutation, and write a row to `flashcardReviews` for history in the same mutation.

## Invariants

1. Convex queries and mutations do not run long-lived AI work — writing and speaking evaluation belong in Convex actions.
2. Metadata and binary audio are stored in separate Convex layers (DB vs File Storage). Audio bytes never live in the database.
3. Auth and resource ownership are enforced inside every Convex function that touches user data.
4. Client components are used only where browser interactivity (audio recording, flashcard flip, exercise input) or real-time reactivity requires them.
5. Curriculum content is immutable at runtime. The application reads it but never modifies it outside the offline seed script.
6. Module progression rules are enforced inside Convex queries; the client only renders state computed by the backend.
7. Vocabulary is unique across all units. The curriculum generation pipeline must enforce this invariant before seeding.
8. AI provider API keys live in Convex environment variables only — never in client code or `NEXT_PUBLIC_*` variables.
