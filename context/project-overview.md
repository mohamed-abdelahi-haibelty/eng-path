# Eng Path

## Overview

Eng Path is a bilingual language learning platform for English (TOEFL preparation) and French (DELF/DALF preparation). The root landing page is a language picker; learning routes live under `/en/...` and `/fr/...` with UI strings delivered via `next-intl`. The system delivers a structured curriculum across four CEFR levels (A1–B2) per language, with each level containing thirty thematic units — 120 English units and 120 French units.

English units follow a six-module sequence: Grammar → Reading → Listening → Writing → Speaking → Review. French units follow an eight-module sequence: Grammar → Conjugaison → Orthographe → Reading → Listening → Writing → Speaking → Review, with two French-specific modules that are not present in the English curriculum.

Each unit teaches a real-world or academic topic. The user follows a strictly ordered module path, builds a personal vocabulary flashcard deck scoped per language, and receives AI-generated feedback on writing and speaking responses using language-appropriate rubrics (TOEFL for English, DELF/DALF for French).

## Goals

1. Provide a complete, pre-generated English curriculum spanning A1 to B2 (120 units).
2. Provide a complete, pre-generated French curriculum spanning A1 to B2 (120 units).
3. Anchor every unit in a real-world or academic topic that improves general knowledge while building exam-relevant skills (TOEFL for English, DELF/DALF for French).
4. Teach grammar progressively, with each unit's reading and listening reinforcing a specific grammar point.
5. Teach French-specific language skills: verb conjugation per tense and orthography rules, in dedicated per-unit modules.
6. Let the user build and review a personal vocabulary deck per language using spaced repetition.
7. Provide AI-evaluated feedback on writing and speaking responses with actionable improvement suggestions, using language-appropriate rubrics.
8. Track progress across all 240 units and surface meaningful learning analytics.

## Core User Flow

1. User signs in using github.
2. User selects a language (English or French) from the root picker page.
3. User selects a CEFR level from the language dashboard.
4. User opens a unit and reviews the topic, knowledge focus, and exam angle (TOEFL or DELF/DALF).
5. User completes the grammar module: explanation, examples, and twenty exercises.
6. **French only** — User completes the conjugaison module: conjugation table for the unit's target verb and tense, then exercises.
7. **French only** — User completes the orthographe module: orthography rule explanation and exercises.
8. User reviews the unit's vocabulary in a flashcard-style carousel before reading.
9. User reads the AI-generated passage and answers comprehension questions.
10. User listens to the AI-generated dialogue and answers comprehension questions.
11. User completes the writing prompt and receives AI feedback within seconds.
12. User completes the ten-question speaking task with timed responses and receives AI feedback.
13. User completes the unit's review exercises covering vocabulary, grammar, and comprehension.
14. User adds new vocabulary to a personal flashcard deck (per-language) for spaced-repetition review.
15. User reviews due flashcards on a dedicated daily review page.
16. User tracks progress on a per-language dashboard showing overall completion and per-skill performance.

## Features

### Authentication and Access Control

- Github authentication via Convex Auth.
- Route protection on all learning content pages.

### Language Selection and Routing

- Root landing page (`/`) is a bilingual language picker — typographic split between English and French, no flag tiles.
- Learning routes are prefixed by locale: `/en/...` for English, `/fr/...` for French.
- UI strings are fully localised via `next-intl` with message namespaces per page and module.
- The `NEXT_LOCALE` cookie drives `<html lang>` on the root layout for screen-reader accuracy.
- Flashcard decks, progress, and vocabulary are scoped per language.

### Curriculum Navigation

- Per-language dashboard displaying all four CEFR levels with progress indicators.
- Level page displaying thirty units in sequence with locked and unlocked states.
- Unit landing page presenting the topic, knowledge focus, exam angle, and the full module list for the language.
- Strict module ordering — English: Grammar → Reading → Listening → Writing → Speaking → Review (6 modules). French: Grammar → Conjugaison → Orthographe → Reading → Listening → Writing → Speaking → Review (8 modules).
- Unit and module gating that requires sequential completion.
- Grammar must score ≥ 70% to unlock Reading (EN) or Conjugaison (FR). Conjugaison must score ≥ 70% to unlock Orthographe. Orthographe must score ≥ 70% to unlock Reading (FR).

### Vocabulary System

- Topic-derived vocabulary specific to each unit, sourced from the Oxford 3000/5000 word lists.
- Vocabulary preview carousel before each reading module showing word, IPA, audio.
- "Add to Flashcards" action available on every vocabulary appearance throughout the app.
- Personal flashcard deck with FSRS-based spaced repetition scheduling.
- Daily review queue, card flip interface, and four-tier rating system (Again, Hard, Good, Easy).
- Flashcard statistics page with totals, state breakdown, streak tracking, and ninety-day heatmap.

### Grammar Module

- Markdown-rendered grammar explanations of the unit's target grammar point.
- Five worked example sentences using the unit's vocabulary.
- Twenty practice exercises across five types: fill-in-the-blank, multiple-choice, sentence transformation, error correction, and build-a-sentence.
- Immediate per-exercise feedback with explanation.
- Seventy-percent score gate. English: unlocks Reading. French: unlocks Conjugaison.

### Conjugaison Module (French only)

- One target verb and tense per unit (e.g. présent indicatif of *être*, passé composé of *aller*).
- Full conjugation table across six pronouns with irregular-forms notes.
- Exercises across four types: fill-conjugation, choose-correct-form, transform-tense, error-correction.
- Seventy-percent score gate to unlock the Orthographe module.

### Orthographe Module (French only)

- One orthography rule per unit (accents, gender agreement, homophones, silent letters, liaison).
- Markdown explanation with worked examples.
- Exercises across four types: correct-the-spelling, choose-correct-spelling, fill-accent, gender-agreement.
- Seventy-percent score gate to unlock the Reading module.

### Reading Module

- AI-generated passage tailored to the unit topic, vocabulary, and grammar point.
- Clean, distraction-free reading interface with serif typography.
- Five comprehension multiple-choice questions with explanations.
- Score persistence linked to unit progress.

### Listening Module

- AI-generated two-speaker dialogue rendered as a high-quality audio.
- Audio player with play, pause controls.
- Maximum two listens before answering questions.
- Five comprehension multiple-choice questions.

### Writing Module

- AI-generated writing prompt aligned with the unit's exam angle (TOEFL-style for English, DELF/DALF-style for French).
- Live word counter and minimum-word threshold for submission.
- Suggested vocabulary chips drawn from the unit's word list.
- AI evaluation via Gemini (`gemini-3-flash-preview`), branched on unit language — English uses the TOEFL rubric; French uses the DELF/DALF rubric.
- Persistent submission history.

### Speaking Module

- Ten sequential speaking questions per unit.
- Twenty-second think timer followed by a recording window per question.
- Browser-based MediaRecorder audio capture (`audio/webm;codecs=opus`) with auto-stop.
- Audio uploaded to Convex storage on completion.
- Background AI evaluation: Groq Whisper for transcription (language hint set per unit language), Gemini for scoring using the appropriate rubric.
- Results page displaying transcripts, scores, and feedback for all ten responses.

### Review Exercises Module

- Twelve to fifteen mixed exercises per unit covering vocabulary recall, grammar application, and comprehension review.
- Auto-graded with explanations.
- Final score saved to unit progress.

### Progress Dashboard

- Overall percentage completion across all 120 units.
- Per-level breakdown with progress bars.
- Average scores per skill type (reading, listening, writing, speaking).
- Recent activity feed listing the last completed modules.
- Flashcard streak counter.

### Curriculum Generation Pipeline

- One-time offline content generation using DeepSeek for text and Google Cloud TTS for audio.
- English vocabulary sourced from the Oxford 3000/5000 word lists, clustered per topic.
- French vocabulary pre-classified into A1/A2/B1/B2 in `data/french-vocab-{level}.json`; per-unit assignment in `data/french-vocab-{level}-by-unit.json`.
- Per-unit content generation covers grammar, reading, listening, writing, speaking, and review for both languages. French units additionally generate conjugaison and orthographe modules.
- Generated unit JSON files live at `data/generated/{en,fr}/{a1–b2}/unit-{01–30}.json`.
- English seed: `npm run seed` — idempotent, clears then reseeds all `language="en"` rows.
- French seed: `npm run seed:fr` — idempotent, clears then reseeds all `language="fr"` rows; audio files uploaded to Convex File Storage.
- All curriculum tables carry a `language: "en" | "fr"` field; conjugaison and orthographe tables are French-only (`language: v.literal("fr")`).

## Scope

### In Scope

- Authentication using github
- Bilingual platform: English (TOEFL) and French (DELF/DALF) curricula
- Language picker at root; locale-prefixed learning routes (`/en/...`, `/fr/...`)
- Fully localised UI via `next-intl` for both languages
- Curriculum browsing across four levels and 120 units per language (240 total)
- Six-module learning flow per English unit (Grammar → Reading → Listening → Writing → Speaking → Review)
- Eight-module learning flow per French unit (Grammar → Conjugaison → Orthographe → Reading → Listening → Writing → Speaking → Review)
- AI-generated reading passages, listening dialogues, exercises, and prompts
- Cloud-based text-to-speech audio for listening and vocabulary pronunciation
- AI-evaluated writing and speaking submissions using language-appropriate rubrics
- Personal vocabulary flashcard system with spaced repetition, scoped per language
- Progress tracking and analytics dashboard per language
- Pre-generated curriculum stored in the database
- Mobile-responsive web interface with a warm neutral design — cream backgrounds, black ink borders, orange primary actions, and sage teal accents. Light and dark modes supported.
- Persistent storage for user progress, submissions, and flashcard state

### Out Of Scope

- Native mobile applications
- Live tutoring or real-time AI conversation
- Payment systems or subscription tiers
- Public sharing of progress or content
- User-generated curriculum content
- Offline mode and content download
- Versioned curriculum history
- Browser extension or desktop client

## Success Criteria

1. A signed-in user can pick a language and browse all four levels and 120 units per language with accurate progress indicators.
2. A user can complete a full English unit end-to-end across all six modules.
3. A user can complete a full French unit end-to-end across all eight modules including conjugaison and orthographe.
4. Vocabulary previews display before every reading module with the unit's topic-specific words.
5. AI feedback on writing and speaking submissions uses the correct language rubric (TOEFL or DELF/DALF) and returns within ten seconds.
6. Flashcards added during a unit appear in the per-language review queue with correct spaced-repetition scheduling.
7. Audio for listening dialogues plays reliably from Convex File Storage.
8. The dashboard displays accurate aggregate progress and skill-level scores per language.
9. The platform runs on free-tier services with zero monthly cost under personal usage.
10. The interface adheres to the minimalist design principles across all screens and remains usable on mobile.
