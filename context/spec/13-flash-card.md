# Flashcard Pages — Feature Specification

## Overview

The flashcard system spans two separate pages: a **Review Page** for daily card review and a **Statistics Page** for tracking progress. Cards are personal to the authenticated user. Scheduling is handled by the FSRS algorithm via the `ts-fsrs` library. Users add cards throughout the app whenever they encounter vocabulary — the review and stats pages are where they manage and track that deck.

---

## Page 1 — Daily Review

### Data Fetching

Implement a Convex query that fetches all flashcards for the current user where `due <= Date.now()`. For each due card, also return the associated vocabulary record: word, phonetics, audio URL, part of speech, Arabic translation, and the unit it belongs to.

### Empty State

If no cards are due, inform the user their review is complete for the day and show when the next card is due (the earliest `due` timestamp across all their cards).

If the user has no cards at all, inform them they have not added any flashcards yet and point them toward the learning modules where they can add vocabulary.

### Review Session

Cards are presented one at a time in the order returned by the query.

**Card Front**

Show the word, Part of speech. and play its pronunciation audio automatically when the card appears. The audio URL comes from the Oxford CDN stored on the vocabulary record. The user can replay the audio manually. The user flips the card when they are ready.

**Card Back**

Show after the user flips:

- The Arabic translation.

**Rating**

After flipping, the user rates how well they recalled the word using four options:

- **Again** — did not remember.
- **Hard** — remembered with difficulty.
- **Good** — remembered correctly.
- **Easy** — remembered easily.

On rating:

- Implement a Convex mutation that updates the flashcard's FSRS state using `ts-fsrs`. Pass the current card state and the selected rating into the `ts-fsrs` scheduler to compute the next `due` date, new `stability`, `difficulty`, `scheduledDays`, `elapsedDays`, `reps`, `lapses`, and `state`.
- In the same mutation, insert a row into `flashcardReviews` with the rating, `reviewedAt: Date.now()`, and elapsed days.
- Move to the next due card immediately after the mutation completes.

**Session Progress**

Show the user how many cards remain in the current session (e.g. "7 remaining").

**Session Complete**

When all due cards have been rated, show a completion screen with the number of cards reviewed in this session and when the next review is due.

---

## Page 2 — Statistics

### Data Fetching

Implement a Convex query that returns the following for the current user:

- Total number of flashcards in the deck.
- Count of cards per FSRS state: `new`, `learning`, `review`, `relearning`.
- Total number of reviews ever completed (count of `flashcardReviews` rows).
- Number of cards due today (`due <= end of today`).
- Review history for the past 90 days: for each day, the number of reviews completed. Derived from `flashcardReviews.reviewedAt`.
- Current streak: number of consecutive days up to and including today where at least one review was completed.

### What to Display

- Total cards in deck.
- Breakdown by card state: new, learning, review, relearning — shown as counts.
- Cards due today.
- Total reviews completed (all time).
- Current daily streak in days.
- A 90-day review heatmap: one cell per day, intensity representing number of reviews completed that day. Days with zero reviews are shown as empty. The heatmap covers the last 90 days ending on today.
