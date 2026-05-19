# Reading Module — Implementation Spec

## Overview

This file is the implementation target for the Reading module page the page ui should be notion like style.

The page has three sections:

1. **Vocabulary Preview** — flashcard carousel reviewing the unit's vocabulary before reading
2. **Reading Passage** — markdown-rendered passage
3. **Comprehension Questions** — 5 multiple-choice questions; submit to get score; score persisted to backend

## Schema Changes Required

In `convex/schema.ts`, add one optional field to the `vocabulary` table:

```ts
arabicTranslation: v.optional(v.string()),
```

This field is `null` initially and gets populated the first time any user visits the reading page for that unit (via a Convex action). It is global — shared across all users — since the translation of a word does not change per user.

## Convex Backend

- implement reading module function that returns the doc for the unit (title, passage, wordCount, questions)
- implement function that Returns all `vocabulary` docs where `unitId` matches, sorted alphabetically by `word`
- each doc includes `arabicTranslation` (may be `undefined` if not yet fetched)
- implement a function that saves reading score.
- implement a function that add vocabulary to flashcard
- implement function thar store arabic translation

#### `prefetchUnitVocabTranslations`

1. Fetch all `vocabulary` docs for the unit
2. Filter to only those where `arabicTranslation === undefined` (not yet translated)
3. If all already translated → return early (nothing to do)
4. Batch the words that need translation (max 50 per request, per API limit)
5. For each batch, call the Langbly Translate v2 API:
   ```
   POST https://api.langbly.com/language/translate/v2
   Headers:
      X-API-Key: <LANGBLY_API_KEY>   ← stored in env.local var
     Content-Type: application/json
   Body:
     {
       "q": ["word1", "word2", ...],   // array of word strings
       "source": "en",
       "target": "ar",
       "format": "text",
       "context": "English vocabulary word for language learning"
     }
   ```
6. Parse response: `data.translations[i].translatedText`

## Vocabulary Flashcard — Detailed Behaviour

- **Front side** shows:
  - The English word
  - IPA phonetics string from the `vocabulary` doc
  - A small audio button — clicking plays the `audioUrl` (Oxford CDN link)
  - A click-to-flip
  - Part of speech (e.g. "noun", "verb")
- **Back side** shows (after flip):
  - Arabic translation — if `arabicTranslation` is defined in the doc, show it; if still `undefined` (prefetch in progress), show a small spinner
  - "Add to Flashcards" button

## Reading Passage — Detailed Behaviour

- Rendered with `react-markdown` + `remark-gfm`

## Comprehension Questions — Detailed Behaviour

- 5 questions
- Each question has 4 options
- User selects one option per question
- On submit:
  - Validate client-side: compare each selectedOption against correct answer
  - Compute score: number of correct answers (0–5), converted to percentage (0–100) for storage
  - Update UI: for each question with feedback and display the `explanation` text
  - Save the score in the database
  - Show score summary and "Continue to Listening" button
