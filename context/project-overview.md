# Eng Path

## Overview

Eng Path is a personal English learning platform built for TOEFL preparation. The system delivers a structured curriculum across four CEFR levels (A1–B2), with each level containing thirty thematic units that combine grammar instruction, reading, listening, writing, speaking, and review exercises. Each unit teaches a real-world or academic topic that doubles as TOEFL writing and speaking material. The user follows a guided learning path, builds a personal flashcard deck for vocabulary review, and receives AI-generated feedback on writing and speaking responses.

## Goals

1. Provide a complete, pre-generated English learning curriculum spanning A1 to B2.
2. Anchor every unit in a real-world or academic topic that improves general knowledge while building TOEFL-relevant skills.
3. Teach grammar progressively, with each unit's reading and listening reinforcing a specific grammar point.
4. Let the user build and review a personal vocabulary deck using spaced repetition.
5. Provide AI-evaluated feedback on writing and speaking responses with actionable improvement suggestions.
6. Track progress across all 120 units and surface meaningful learning analytics.

## Core User Flow

1. User signs in using github.
2. User selects a CEFR level from the home screen.
3. User opens a unit and reviews the topic, knowledge focus, and TOEFL angle.
4. User completes the grammar module: explanation, examples, and twenty exercises.
5. User reviews the unit's vocabulary in a flashcard-style preview before reading.
6. User reads the AI-generated passage and answers comprehension questions.
7. User listens to the AI-generated dialogue and answers comprehension questions.
8. User completes the writing prompt and receives AI feedback within seconds.
9. User completes the ten-question speaking task with timed responses and receives AI feedback.
10. User completes the unit's review exercises covering vocabulary, grammar, and comprehension.
11. User adds new vocabulary to a personal flashcard deck for spaced-repetition review.
12. User reviews due flashcards on a dedicated daily review page.
13. User tracks progress on a dashboard showing overall completion and per-skill performance.

## Features

### Authentication and Access Control

- Github authentication via Convex Auth.
- Route protection on all learning content pages.

### Curriculum Navigation

- Home page displaying all four CEFR levels with progress indicators.
- Level page displaying thirty units in sequence with locked and unlocked states.
- Unit landing page presenting the topic, knowledge focus, TOEFL angle, and six learning modules.
- Strict module ordering: Grammar → Reading → Listening → Writing → Speaking → Review.
- Unit and module gating that requires sequential completion.

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
- Seventy-percent score gate to unlock the reading module.

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

- AI-generated TOEFL-style writing prompt aligned with the unit's TOEFL angle.
- Live word counter and minimum-word threshold for submission.
- Suggested vocabulary chips drawn from the unit's word list.
- AI evaluation via Groq Llama 3.3
- Persistent submission history.

### Speaking Module

- Ten sequential speaking questions per unit.
- Forty-five-second think timer followed by sixty-second recording window per question.
- Browser-based MediaRecorder audio capture with auto-stop.
- Audio uploaded to Convex storage on completion.
- Background AI evaluation using Groq Whisper for transcription and Groq Llama 3.3 for scoring.
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

- One-time content generation pipeline using deepseek for text and Google Cloud TTS for audio.
- Vocabulary assignment via offline AI-assisted clustering of the Oxford word list onto the 120 topics.
- Per-unit content generation covering grammar exercises, reading passages, listening dialogues, writing prompts, speaking questions, and review exercises.
- Database seeding script that uploads all generated content and audio assets to Convex.

## Scope

### In Scope

- Authentication using github
- Curriculum browsing across four levels and 120 units
- Six-module learning flow per unit with strict ordering
- AI-generated reading passages, listening dialogues, exercises, and prompts
- Cloud-based text-to-speech audio for listening and vocabulary pronunciation, sourced from Oxford, with a mapped audio file for each word.
- AI-evaluated writing and speaking submissions with structured feedback
- Personal vocabulary flashcard system with spaced repetition
- Progress tracking and analytics dashboard
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

1. A signed-in user can browse all four levels and 120 units with accurate progress indicators.
2. A user can complete a full unit end-to-end with all six modules functioning correctly.
3. Vocabulary previews display before every reading module with the unit's topic-specific words.
4. AI feedback on writing and speaking submissions returns within ten seconds.
5. Flashcards added during a unit appear in the personal review queue with correct spaced-repetition scheduling.
6. Audio for listening dialogues plays reliably from cloud storage.
7. The dashboard displays accurate aggregate progress and skill-level scores.
8. The platform runs on free-tier services with zero monthly cost under personal usage.
9. The interface adheres to the minimalist design principles across all screens and remains usable on mobile.
