# Listening Module — Implementation Specification

## Overview

The Listening Module is the third module in the unit learning flow (Grammar → Reading → **Listening** → Writing → Speaking → Review). It presents the user with an AI-generated two-speaker dialogue as audio only — no transcript is shown. The user may listen a maximum of two times, then proceeds to five comprehension questions. After submitting answers the result is shown immediately and the score is persisted to the database.

- The page is divided into two sequential **phases** that never coexist on screen:
  **Audio Player Phase** User clicks "Go to Questions" button (only enabled after ≥ 1 listen)
  **Questions Phase** User clicks "Submit Answers" button (only enabled when all 5 questions answered)

## Phase 1 — Audio Player Phase

- implement the convex function that fetches the audio from convex storage
- Never return the dialogue transcript text.

#### Waveform/Orb Button (primary interaction)

Render a large circular pulsing orb button centred on the screen, inspired by chatgpt voice-mode UIs:

- **Playing state**:

  - No pause or stop button is rendered; the audio cannot be interrupted.
  - Label below: elapsed timer `"0:23 / 1:45"` (current position / total duration).
  - The button itself is **non-interactive** while audio is playing (cursor default, pointer events none).

- **Completed state** (audio finished, listens remaining > 0):

  - Label below: `"Listen Again"` (if 1 listen used) or nothing interactive (if 2 listens used).

- **Exhausted state** (2 listens used):
  - Label: `"Max listens reached"`.
  - Button is non-interactive.

#### "Go to Questions" Button

- Always visible in Phase 1.
- Disabled until the user has completed at least one full listen (audio plays to end or is fully elapsed).
- Enabled after the first listen completes.
- Clicking transitions to Phase 2 (Questions Phase). Phase 1 is unmounted; audio is stopped and cannot be resumed.

## Phase 2 — Questions Phase

- implement convex function that fetches questions

## Submission and Results

### Client-Side Scoring

On submit, compute the score immediately on the client — do not round-trip to the server for this
Then store the score in the database
Implement the convex function that persist data in convex
