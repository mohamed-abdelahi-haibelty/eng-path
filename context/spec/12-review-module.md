# Review Module — Feature Specification

## Overview

The Review Module is the sixth and final module in the unit learning flow (Grammar → Reading → Listening → Writing → Speaking → **Review**). It presents 12–15 mixed exercises covering vocabulary, grammar, and comprehension from the unit. All exercises are visible on a single scrollable page. The user answers all of them and submits once. Feedback and correct answers are revealed only after submission. The final score is saved to the database and the unit is marked complete.

---

## Data Fetching

Implement a Convex query that fetches all review exercises for the unit: exercise id, instruction, and the exercise payload. The exercise payload varies by type — all nine types defined in the schema must be handled.

Also fetch the existing unit progress record for the user and unit on page load. If `reviewCompleted` is already `true`, show the results view directly with the previously saved score.

---

## Exercise Types

The following nine exercise types must be rendered correctly. Each type has a different interaction pattern:

- **fill_in_the_blank** — sentence with a blank; the user types or selects the missing word. If `options` is present, render as a choice. If absent, render as a free-text input.
- **multiple_choice_grammar** — a grammar question with four labeled options (a, b, c, d).
- **vocabulary_choice** — a sentence with a blank; the user picks the correct word from a list of options.
- **vocabulary_definition** — the user picks the correct definition or word from a list of options.
- **odd_one_out** — a list of words; the user picks the one that does not belong.
- **error_correction** — an incorrect sentence is shown; the user identifies or selects the corrected version. Since the corrected form is stored in the schema, render this as a choice between the incorrect version and plausible alternatives, or show it as a text input where the user rewrites the sentence.
- **comprehension_recall** — a multiple-choice question sourced from either the reading or listening module content.
- **true_or_false** — a statement; the user selects true or false.
- **sentence_transformation** — an original sentence is shown with an optional prompt; the user types the transformed version.

---

## Answering

- All exercises are visible at once on the page in the order they are stored.
- The user answers each exercise independently. Answers are held in local state — nothing is saved to the database until the user submits.
- The user can answer in any order and change any answer before submitting.
- Free-text inputs (`fill_in_the_blank` without options, `sentence_transformation`) accept typed answers.
- The submit button is only enabled once every exercise has been answered.
- Show the user how many exercises remain unanswered as they work through the page (e.g. "3 of 14 unanswered").

---

## Submission and Scoring

- Scoring is computed on the client immediately on submit — no server round trip needed for this.
- For each exercise, compare the user's answer against the correct answer stored in the exercise payload:
  - Multiple choice, vocabulary, odd-one-out, comprehension, true/false: exact match against the `correct` field.
  - Free-text types (`fill_in_the_blank` without options, `sentence_transformation`, `error_correction` as text input): case-insensitive, trimmed match against the `answer` or `correct` field.
- Score = number of correct answers / total exercises × 100, rounded to the nearest integer.
- Implement a Convex mutation that saves the score to the database:
  - Sets `reviewCompleted: true` and `reviewScore` on the unit progress record.
  - Sets `unitCompleted: true` and `completedAt: Date.now()` on the unit progress record, since review is the final module.

---

## Results View

Shown immediately after submission on the same page — no navigation, just the page updating in place.

- Display the overall score (e.g. "11 / 14 correct" and the percentage).
- For every exercise, reveal:
  - Whether the user's answer was correct or incorrect.
  - The correct answer.
  - The explanation stored in the exercise payload.
- All exercises remain visible in the same scrollable layout with their result state overlaid.
- Provide navigation to the unit landing page or the next unit once the score is saved.
