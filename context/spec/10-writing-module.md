# Writing Module — Implementation Specification

## Overview

The Writing Module is the fourth module in the unit learning flow (Grammar → Reading → Listening → **Writing** → Speaking → Review). It presents the user with a TOEFL-style writing prompt derived from the unit's topic and TOEFL angle. The user reads the prompt, writes a response on a paper-style editor, submits for AI evaluation, and receives structured feedback with a score. The score is persisted to the database, and the user may then proceed to the Speaking module.

The page is divided into two sequential **phases** that never coexist on screen:

- **Writing Phase** — User reads the prompt and composes a response, then clicks "Submit".
- **Feedback Phase** — AI evaluation is displayed with score, strengths, weaknesses, and a model rewrite. A "Next: Speaking" button becomes available.

## Data Fetching

Implement a Convex query that fetches the writing module for the current unit:

- Return: `prompt`, `minWords`, `maxWords`, `rubric`, `suggestedVocab`.
- Also fetch the most recent `writingSubmission` for the current user × unit (if any), so a returning user sees their previous feedback instead of a blank editor.

## Phase 1 — Writing Phase

- Display the full prompt text
- show Minimum words and Maximum words
- render the Suggested Vocabulary

**Paper Editor**

This is the primary interaction surface. It must feel like writing on a physical sheet of paper, not filling in a form field.

- Render a page that looks like a sheet of paper.
- Apply a handwriting-style like excalidraw style
- Word Counter Format: `"142 / 250 words"` — current word count / `maxWords`.
- On submit click: transition to a loading state. The paper and prompt remain visible but the editor becomes non-interactive

## Phase 2 — Feedback Phase

Shown after AI evaluation completes (feedback status transitions from `"pending"` to `"done"` or `"error"`).
The paper editor is replaced by the feedback view. The prompt card remains visible at the top for reference.

- Display Score.
- show the four rubric dimension scores: Task Response, Coherence, Vocabulary, Grammar

### Strengths

- Section label: `"What You Did Well"`.

### Weaknesses

- Section label: `"Areas to Improve"`.

### Model Rewrite

- Section label: `"Model Answer"`.
- Render the modelRewrite string in the same paper-style surface used for writing, but read-only.
- Allow coping the model answer paper.

### Error State

If `feedbackStatus === "error"`:

- Show error exemple: `"Evaluation failed. Your response was saved — please try submitting again."`.
- Show a `"Retry"` button that re-triggers the AI evaluation action for the existing submission.

## AI Evaluation

### Provider

Use `@google/genai` with model `gemini-3.1-pro-preview`.

### Prompt

Send a single user turn. The system instruction and user content are combined as shown below.

You are an expert English language examiner specializing in TOEFL and academic writing assessment. You evaluate learner writing with precision, fairness, and actionable feedback calibrated to the learner's CEFR level.

You will receive:

1. A writing prompt
2. The evaluation rubric (four criteria)
3. The learner's CEFR level
4. The learner's response

Your task is to evaluate the response and return a JSON object — no markdown, no preamble, only raw JSON.

---

WRITING PROMPT:
{prompt}

---

RUBRIC:

- Task Response: {rubric.taskResponse}
- Coherence and Cohesion: {rubric.coherence}
- Lexical Resource (Vocabulary): {rubric.vocabulary}
- Grammatical Range and Accuracy: {rubric.grammar}

---

LEARNER CEFR LEVEL: {unit.level}

Calibrate your scores, feedback language, and model rewrite to be appropriate for a {unit.level} learner. A score of 80/100 at {unit.level} means strong performance for that level, not near-native proficiency. The model rewrite should be achievable and readable by a {unit.level} learner — do not write it at C1/C2 level. Your feedback language in strengths and weaknesses should also be simple and encouraging enough for a {unit.level} learner to understand and act on.

---

LEARNER RESPONSE:
{submittedText}

---

Return ONLY this JSON structure:

{
"overallScore": <integer 0–100>,
"dimensions": {
"taskResponse": <integer 0–25>,
"coherence": <integer 0–25>,
"vocabulary": <integer 0–25>,
"grammar": <integer 0–25>
},
"strengths": [
"<specific strength 1>",
"<specific strength 2>",
"<specific strength 3>"
],
"weaknesses": [
"<specific weakness 1>",
"<specific weakness 2>",
"<specific weakness 3>"
],
"modelRewrite": "<a polished version of the learner's response that addresses their weaknesses while preserving their intended meaning. Written at a register and complexity level appropriate for {unit.level} — not simplified to the point of being unnatural, but not above the learner's reach either. Length should be similar to the original. Must be a full prose response to the prompt, not a list of corrections.>"
}

Scoring rules:

- overallScore = sum of all four dimension scores (each 0–25).
- Score relative to {unit.level} expectations, not against native or C2 standards.
- Award dimension scores honestly. A response with major grammar errors should score below 15 on grammar even at A1, but the threshold for "major" should reflect {unit.level} norms.
- strengths and weaknesses must each contain exactly 3 items.
- Each strength/weakness must be a complete, actionable sentence written in language a {unit.level} learner can understand — avoid metalinguistic jargon unless it is standard at that level.
- modelRewrite must be a full prose response to the same prompt — not a list of corrections, not annotated, not commented.
- Do not include any text outside the JSON object.
