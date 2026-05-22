# Speaking Module — Feature Specification

## Overview

The Speaking Module is the fifth module in the unit learning flow (Grammar → Reading → Listening → Writing → **Speaking** → Review). The user works through ten sequential speaking questions. Each question follows a fixed two-phase rhythm: a Think Phase followed by a Record Phase. After all ten questions are recorded the user submits. Each audio is transcribed via Groq Whisper then evaluated via Gemini. The overall session score is stored in the database and the user may proceed to the Review module.

## Page Stages

The page moves through four stages in strict order. Only one stage is visible at a time.

1. **Instructions** — shown before anything begins.
2. **Questions** — ten questions answered one at a time.
3. **Processing** — recordings uploaded and evaluation running.
4. **Results** — transcripts, scores, and feedback displayed.

On page load, if a completed submission already exists for this user and unit, skip directly to the Results stage.

---

## Stage 1 — Instructions

- Explain to the user what the module involves before they begin:
  - There are 10 speaking questions.
  - Each question has a thinking period they must wait through before recording starts.
  - Recording opens automatically after thinking time ends.
  - Recording stops automatically after 60 seconds or the user can stop it early.
  - After all 10 questions, they submit for AI evaluation.
- Inform the user that the browser will request microphone access on the first question.
- The user must explicitly confirm they are ready before the questions begin.

---

## Stage 2 — Questions

Implement a Convex query that fetches the speaking questions for the unit: order, category, question text, think duration in seconds, speak duration in seconds.

Questions are presented one at a time in order. The user cannot jump ahead or go back.

Show the user their current position (e.g. question 3 of 10).

### Think Phase

- Duration: `thinkSeconds` from the question record (45 seconds).
- The question text and category are visible.
- A countdown timer runs for the full duration.
- The user cannot start recording during this phase. No mechanism to skip or shorten it exists.
- When the countdown reaches zero, the Record Phase begins automatically.

### Record Phase

- Duration: `speakSeconds` from the question record (60 seconds).
- The microphone opens automatically when this phase begins. Do not request microphone access before this point.
- If the user has not yet granted microphone permission, the browser permission prompt fires now.
- If permission is denied, show an error and block further progress until resolved.
- A live elapsed timer is visible during recording.
- Recording stops automatically when the 60-second limit is reached.
- The user may also stop recording early at any point.
- Audio is captured using the browser MediaRecorder API (`audio/webm;codecs=opus`, fallback `audio/webm`).
- The recorded audio blob is held in memory. It is not uploaded yet.

### Between Questions

After each recording stops:

- The user can replay their recording before moving on.
- For questions 1–9: the user confirms and moves to the next question.
- For question 10: the user confirms and moves to the Processing stage, which triggers upload and submission.

---

## Stage 3 — Processing

### Upload

For each of the 10 recorded blobs, in sequence:

- Request a Convex upload URL.
- Upload the blob to that URL.
- Collect the resulting storage ID.

### Submission

Implement a Convex mutation that creates a speaking submission record containing:

- All 10 responses, each with: question order, question text, audio storage ID.
- Each response starts with evaluation status `pending`.
- Overall evaluation status starts as `pending`.

After the submission record is created, immediately schedule the background evaluation action.

### Processing UI

- Show the user that evaluation is in progress.
- Show a live count of how many responses have been evaluated so far vs the total (e.g. "4 of 10 evaluated"). This updates reactively as individual responses complete.
- No navigation away is available during this stage.

---

## Stage 4 — Results

Show once overall evaluation status is `done` or `error`.

- Display the overall score out of 200 (sum of all 10 response scores, each out of 20), and its percentage equivalent.
- Display average scores per dimension (Fluency, Coherence, Vocabulary, Grammar) across all responses.
- For each of the 10 questions, show:
  - The question text.
  - The per-dimension scores and total score out of 20.
  - The Whisper transcript of the user's response.
  - The AI feedback (2–3 sentences).
  - The AI suggestion for a stronger answer (if available).
- If any individual response failed evaluation, indicate that clearly for that response.
- Provide navigation to the next module (Review).

---

## Background Evaluation Action

Runs after submission is created. Processes all 10 responses sequentially.

### Per Response

**Transcription — Groq Whisper**

- Download the audio from Convex storage using a time-limited URL.
- Send the audio to Groq Whisper:
  - Endpoint: `POST https://api.groq.com/openai/v1/audio/transcriptions`
  - Model: `whisper-large-v3`
  - Language: `en`
  - Response format: `text`
  - Temperature: `0.0`
  - Prompt: `"This is a spoken English language response to a TOEFL-style speaking question."`
  - Auth: `Authorization: Bearer ${process.env.GROQ_API_KEY}`
- The response is a plain text string — the transcript.

**Word Count Gate**

Before calling Gemini, count words in the transcript (`trim().split(/\s+/).filter(Boolean)`).

- If word count < 10: skip Gemini. Save scores of all zeros, feedback `"Response is too short to evaluate."`, suggestion `null`.
- If word count < 25: after Gemini scoring, cap the fluency score at 2 regardless of what Gemini returned.

**Evaluation — Gemini**

- Use `@google/genai` with model `gemini-3-flash-preview`.
- API key from `process.env.GEMINI_API_KEY` only.
- Set `responseMimeType: "application/json"` and temperature `0.1`.

Prompt:

```
You are a TOEFL speaking evaluator. You will receive a question and a spoken response transcript. Score the response using exactly the rubric provided.

Return only a JSON object. Do not add any text outside the JSON.

Rubric:
Fluency (0-5): completeness and continuity of the response. Do not infer pauses. Judge only content volume and repetition.
Coherence (0-5): how directly and logically the response answers the question.
Vocabulary (0-5): range and accuracy of word choice.
Grammar (0-5): structural accuracy. Minor errors are acceptable at 3+.

Required output format:
{
  "fluency": <0-5>,
  "coherence": <0-5>,
  "vocabulary": <0-5>,
  "grammar": <0-5>,
  "feedback": "<2-3 sentences. What the response did well and what to improve. Be specific, not generic.>",
  "suggestion": "<One concrete rewrite or example of a stronger answer to the same question. 2-3 sentences max. null if fluency score is 0.>"
}

Question: {question}

Transcript: {transcript}

Word count: {wordCount}
Time limit: 60 seconds
```

**Post-Gemini Processing**

- Apply fluency cap if word count < 25: `fluency = Math.min(fluency, 2)`.
- Compute `totalScore = fluency + coherence + vocabulary + grammar` (out of 20).
- Validate the response with Zod before saving. If validation fails, retry once. If the retry also fails, mark that response as `error` and continue to the next.

**Save Per-Response Result**

Implement a Convex internal mutation that updates the response entry in the submission record with: transcript, word count, scores, total score, feedback, suggestion, and evaluation status `done`.

### After All 10 Responses

Implement a Convex internal mutation that:

- Computes `overallScore` as the sum of all 10 `totalScore` values.
- Sets `overallEvaluationStatus` to `done` (or `error` if more than half of responses failed).
- Marks `speakingCompleted: true` on the unit progress record for this user and unit.
