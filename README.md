# Eng Path

An English and French learning application built with Next.js 16, React 19, TypeScript, and Convex. It combines structured learning modules, AI feedback on writing and speaking, progress tracking, and personal flashcards with FSRS spaced repetition.

## Live demo

[Try Eng Path](https://grasp-lng.vercel.app). Choose **Try the demo** for a separate guest account, or sign in with GitHub. Guest accounts cannot access other learners' progress, submissions, or flashcards. Use fictional practice responses; writing and audio may be processed by external AI providers.

## Features

- English and French routes and interface translations using `next-intl`.
- Grammar, reading, listening, writing, speaking, and review modules; French-specific conjugation and orthography modules.
- GitHub sign-in through Convex Auth and user-scoped learning records.
- Browser audio recording with background transcription and evaluation.
- Personal vocabulary and saved sentences, with spaced-repetition review.
- Offline curriculum generation and seed scripts, separate from runtime learning.

## How it is built

Next.js owns navigation and the interactive learning interface. Convex owns the schema, reactive queries, mutations, authentication, file storage, and scheduled work. External AI calls run in backend actions; API credentials stay outside the browser bundle. Audio lives in file storage, with references stored in learning records.

The curriculum is generated offline rather than regenerated for each learner. Runtime writing feedback uses Gemini; speaking evaluation uses Groq transcription and DeepSeek feedback. FSRS schedules flashcard reviews instead of using a fixed review interval. The source includes the prompts and integration code so these decisions can be inspected directly.

This project was developed with AI assistance. Generated contributions still require human review and validation; the repository does not claim independent security certification or validated exam-scoring accuracy.

| Directory | Responsibility |
| --- | --- |
| `app/`, `components/`, `hooks/` | Routes, learning interfaces, and interaction logic |
| `convex/queries/`, `convex/mutations/` | Reactive reads and user-scoped writes |
| `convex/actions/` | AI evaluation, transcription, and enrichment |
| `convex/schema.ts` | Curriculum and learner data model |
| `convex/seed/`, `scripts/` | Maintenance, seeding, and offline generation |
| `i18n/`, `messages/` | Locale routing and translations |
| `tests/` | Maintenance authorization regression checks |

## Local development

Requires Node.js 22+, npm, and your own Convex development project.

```bash
npm ci
cp .env.example .env.local
npx convex dev
```

Use the development deployment URL written by Convex in `.env.local`. Configure Convex Auth and a GitHub OAuth application for your own deployment before testing sign-in. Runtime provider keys belong in that deployment's private environment settings. The frontend needs the public Convex URL; it must never receive provider keys or the seed admin key.

Once the backend is configured, use `npm run dev` to run both the frontend and Convex watcher, or `npm run dev:frontend` to run just Next.js. Open `http://localhost:3000`.

**Curriculum files are not bundled.** The private `data/` and `content/` directories, generated audio, and learner records are intentionally excluded. A fresh checkout provides the application source, not a populated learning service. The seed scripts require compatible local curriculum inputs; they cannot populate a clean deployment from this repository alone.

## Maintenance and checks

Seed functions require a private `SEED_ADMIN_KEY` of at least 32 characters. Generate one with `openssl rand -hex 32` and configure the same value in your local environment and your own Convex deployment. Seeding clears curriculum records; use a disposable development deployment. Never expose this key through `NEXT_PUBLIC_*` variables.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The included tests cover maintenance access controls, not the complete learning flow. End-to-end authentication, provider calls, audio, and seeding require a configured development backend and are separate checks.

Private credentials, deployment keys, account exports, recordings, and generated datasets do not belong in Git. No source license has been selected.
