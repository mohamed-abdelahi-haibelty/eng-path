# Task: Build the Speaking Evaluation Convex Action

## Context

I am building an English learning platform called Eng Path. Users
record 60-second spoken responses to speaking questions. The browser
captures audio, Groq Whisper transcribes it, and then this evaluator
scores the transcript.

This is a Convex action written in TypeScript. It receives a transcript
string and returns a structured score object. It calls the Groq API
Whisper Large V3 for evaluation.

## What This Evaluator Actually Has Access To

- The transcript text (string)
- The original question (string)
- The word count (derived from transcript)
- The speaking time limit (always 60 seconds)

## What It Does NOT Have Access To

- Audio file
- Actual pauses or hesitations
- True words-per-minute
- Speech rate
- Tone or pronunciation

Do not reference, measure, or fake any signal that is not in the
transcript text. If it is not in the text, it does not exist for
this evaluator.

## Pre-LLM Word Count Gate (Run Before Calling Groq)

Before sending anything to the LLM, apply this hard rule in TypeScript:

```typescript
const words = transcript.trim().split(/\s+/).filter(Boolean);
const wordCount = words.length;

if (wordCount < 10) {
  return {
    scores: { fluency: 0, coherence: 0, vocabulary: 0, grammar: 0 },
    total: 0,
    feedback: "Response is too short to evaluate.",
    suggestion: null,
    wordCount,
  };
}

const fluentyCap = wordCount < 25 ? 2 : null; // applied after LLM scoring
```

This prevents garbage answers (a single word, "yes", 5 seconds of
silence) from receiving real scores.

## Rubric (4 Criteria, 5 Points Each, Total 20)

Pass this rubric to the LLM verbatim in the system prompt.

---

**Fluency (0–5)**
Measures output completeness and continuity based on text only.
Do not infer pauses or speech rate.

- 5: Complete response with sufficient detail for the time limit.
  Ideas flow without excessive repetition.
- 3: Partially developed. Some repetition or limited detail.
- 1: Very short or incomplete with minimal content.
- 0: No scorable content.

**Coherence (0–5)**
Measures how well the response answers the question and progresses logically.

- 5: Answers the question directly. Ideas are logically connected
  and easy to follow.
- 3: Addresses the question but ideas are loosely connected or
  partially off-topic.
- 1: Disorganized or largely off-topic.
- 0: Does not address the question at all.

**Vocabulary (0–5)**
Measures range and accuracy of word choice.

- 5: Appropriate vocabulary with variation. Words used correctly.
- 3: Limited range with repetition or minor misuse.
- 1: Very basic or noticeably incorrect word choice.
- 0: Incomprehensible word use.

**Grammar (0–5)**
Measures structural accuracy.

- 5: Mostly correct structures. Minor errors do not affect understanding.
- 3: Frequent errors but meaning is generally understandable.
- 1: Errors make understanding difficult.
- 0: Structure is not recognizable.

---

## LLM Call Specification

**Provider:** Groq API  
**Model:** `Whisper Large V3`  
**Temperature:** 0.1 (low — this is scoring, not creative generation)  
**Response format:** JSON only, no markdown, no explanation outside the object

**System prompt:**

```
You are a TOEFL speaking evaluator. You will receive a question and a
spoken response transcript. Score the response using exactly the rubric
provided.

Return only a JSON object. Do not add any text outside the JSON.

Rubric:
Fluency (0-5): completeness and continuity of the response. Do not
  infer pauses. Judge only content volume and repetition.
Coherence (0-5): how directly and logically the response answers the question.
Vocabulary (0-5): range and accuracy of word choice.
Grammar (0-5): structural accuracy. Minor errors are acceptable at 3+.

Required output format:
{
  "fluency": <0-5>,
  "coherence": <0-5>,
  "vocabulary": <0-5>,
  "grammar": <0-5>,
  "feedback": "<2-3 sentences. What the response did well and what
               to improve. Be specific, not generic.>",
  "suggestion": "<One concrete rewrite or example of a stronger answer
                 to the same question. 2-3 sentences max. null if
                 fluency score is 0.>"
}
```

**User message:**

```
Question: {question}

Transcript: {transcript}

Word count: {wordCount}
Time limit: 60 seconds
```

## Post-LLM Processing

After receiving the LLM response, apply the fluency cap in TypeScript:

```typescript
if (fluentyCap !== null) {
  scores.fluency = Math.min(scores.fluency, fluentyCap);
}

const total =
  scores.fluency + scores.coherence + scores.vocabulary + scores.grammar;
```

The total is out of 20. Store it as-is. The UI converts to percentage
if needed.

## Convex Action Requirements

- Reads the submission from the database to get transcript and question
- If transcript is missing or null, return an error state, do not crash
- Validates the LLM JSON response with Zod before trusting it
- Wraps the Groq call in try/catch with one retry on failure
- API key from `process.env.GROQ_API_KEY` only — never hardcoded

## What Not To Build

- Do not add pronunciation scoring
- Do not add pause detection
- Do not add speech rate calculation
- Do not add audio analysis of any kind
- Do not add a confidence score or reliability flag
- Do not reference anything not in the transcript text

## Acceptance Criteria

- A transcript under 10 words returns all zeros without calling the LLM
- A transcript under 25 words has fluency capped at 2 regardless of
  LLM score
- The LLM response is validated with Zod before being saved
- The action does not crash on malformed LLM output — it retries once
  then returns a fallback error state
