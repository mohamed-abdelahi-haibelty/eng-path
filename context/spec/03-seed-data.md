# Seed Data — Curriculum Content into Convex

All curriculum content is pre-generated offline and seeded into Convex once. The runtime app only reads it.

## Data Directory Structure

```
data/
  topics.json              # 120 unit definitions (one per level×unit)
  vocabulary.json          # ~3000–5000 Oxford 3000/5000 words, assigned to units
  speaking-tasks.json      # 10 speaking questions
  writing-prompts.json     # prompt + word limits + rubric + suggested vocab
  grammar                  # explanation markdown + examples

data/audio/
  A1-01.mp3
  A1-02.mp3
  ...                       # 120 dialogue audio files (Google Cloud TTS generated)

context/spec/
  speaking-evaluation.md  #speaking rubrics

content/
  a1/
    a1-unit-01-daily-routines.json
      grammar-exercises # 20 exercises
      reading         # passage + 5 comprehension questions
      listening        # dialogue + 5 comprehension questions
      review          # 12–15 review exercises
  a1-unit-02-.../
    ...
  a2/ ... 30 files
  b1/ ... 30 files
  b2/ ... 30 files
```

## JSON File Formats

### `data/topics.json`

An array of 120 objects. Every field required.

```json
[
  {
    "level": "A1",
    "unit": 1,
    "topic": "Daily Routines",
    "knowledge_focus": "How habits shape productivity",
    "toefl_angle": "Should schools have fixed daily schedules?",
    "grammar_point": "Present Simple (affirmative)"
  }
]
```

`unit` is 1–30 within each level.

### `data/vocabulary.json`

```json
{
  "A1": {
    "1": {
      "topic": "Daily Routines",
      "words": [
        {
          "word": "home",
          "cefr_level": "A1",
          "part_of_speech": "adverb",
          "audio_url": "https://www.oxfordlearnersdictionaries.com/media/english/us_pron/h/hom/home_/home__us_1.mp3",
          "phonetics": "/həʊm/"
        },
      ]
    },
  },
  "A2" : {...},
  "B1" : {...},
  "B2" : {...}
}
```

### `content/{level}/{unit-[unit-number]-[topic]}.json`

````json
{
 "meta": {
    "level": "A1",
    "unit": 1,
    "topic": "Daily Routines",
    "knowledge_focus": "How habits shape productivity",
    "toefl_angle": "Should schools have fixed daily schedules?",
    "grammar_point": "Present Simple (affirmative)"
  },
  "reading": {
    "title": "The Power of Daily Routines",
    "passage": "Every successful person has one thing in common: a strong **routine**. The way you **wake** up each **morning** shapes the rest of your **day**. Research shows that....",
    "word_count": 368,
    "questions": [
      {
        "id": "R1",
        "question": "What do many productive people do first in their morning routine?",
        "options": {
          "a": "Cook breakfast",
          "b": "Take a shower",
          "c": "Go for a run",
          "d": "Read the news"
        },
        "correct": "b",
        "explanation": "The passage states: 'Many productive people always start their day with a shower.'"
      },....]
  },
  "listening": {
    "title": "A Morning Chat About Routines",
    "speakers": {
      "A": "Alex (curious)",
      "B": "Ben (knowledgeable)"
    },
    "dialogue": [
      {
        "turn": 1,
        "speaker": "A",
        "line": "Hey Ben, you always look so energetic in the morning. What's your secret?"
      },
      {
        "turn": 2,
        "speaker": "B",
        "line": "I follow a strict routine every day. It really makes a huge difference."
      },...]
  }
  "grammar_exercises": [
    {
      "id": "G1",
      "type": "fill_in_the_blank",
      "instruction": "Complete the sentence with the correct Present Simple form of the verb in brackets.",
      "sentence": "She ________ (wake) up at seven every morning.",
      "answer": "wakes",
      "explanation": "Third-person singular (she/he/it) adds -s to the base verb: wake → wakes."
    },

    {
      "id": "G6",
      "type": "multiple_choice",
      "instruction": "Choose the correct Present Simple form.",
      "sentence": "He ________ a morning run every day.",
      "options": {
        "a": "go for",
        "b": "goes for",
        "c": "going for",
        "d": "gone for"
      },
      "correct": "b",
      "explanation": "'He' is third-person singular. 'Go' becomes 'goes' → 'goes for a run.'"
    },
    {
      "id": "G11",
      "type": "sentence_transformation",
      "instruction": "Rewrite the sentence using the subject given and the Present Simple.",
      "original": "It is her habit to run every morning.",
      "prompt": "She ________.",
      "answer": "She runs every morning.",
      "explanation": "Drop the noun phrase 'It is her habit to' and convert the infinitive 'run' to the Present Simple third-person singular: 'runs.'"
    },
    {
      "id": "G15",
      "type": "error_correction",
      "instruction": "Find and correct the error in the sentence.",
      "incorrect": "She always wake up at six in the morning.",
      "correct": "She always wakes up at six in the morning.",
      "explanation": "Third-person singular (she) requires -s on the verb: wake → wakes."
    },
    {
      "id": "G18",
      "type": "build_a_sentence",
      "instruction": "Put the words in the correct order to make a Present Simple sentence.",
      "scrambled": ["usually", "I", "at", "home", "dinner", "cook"],
      "answer": "I usually cook dinner at home.",
      "explanation": "Frequency adverbs like 'usually' go after the subject (I) and before the main verb (cook)."
    },
  ],
  "review_exercises": [
    {
      "id": "RV1",
      "type": "vocabulary_choice",
      "instruction": "Choose the word that best completes the sentence.",
      "sentence": "She takes a ________ every morning to feel fresh and awake.",
      "options": {
        "a": "dinner",
        "b": "shower",
        "c": "brush",
        "d": "schedule"
      },
      "correct": "b",
      "explanation": "A 'shower' is a device used for washing the body — common in morning routines."
    },
    {
      "id": "RV3",
      "type": "odd_one_out",
      "instruction": "Which word does NOT belong in the same group?",
      "options": {
        "a": "morning",
        "b": "evening",
        "c": "night",
        "d": "habit"
      },
      "correct": "d",
      "explanation": "Morning, evening, and night are all times of day. 'Habit' is a behavior pattern, not a time."
    },
    {
      "id": "RV4",
      "type": "fill_in_the_blank",
      "instruction": "Complete the sentence with the correct word.",
      "sentence": "He always goes to ________ before midnight so he gets enough sleep.",
      "answer": "bed",
      "explanation": "'Go to bed' is a fixed phrase meaning to lie down and sleep."
    },
    {
      "id": "RV5",
      "type": "error_correction",
      "instruction": "Find and correct the grammar error.",
      "incorrect": "My sister always cook breakfast for the family.",
      "correct": "My sister always cooks breakfast for the family.",
      "explanation": "Third-person singular (my sister = she) requires -s on the verb: cook → cooks."
    },
    {
      "id": "RV6",
      "type": "comprehension_recall",
      "source": "reading",
      "question": "According to the reading passage, what do people who eat in the early hours report?",
      "options": {
        "a": "More hunger during the day",
        "b": "Better focus throughout the day",
        "c": "More sleep at night",
        "d": "Less energy in the evening"
      },
      "correct": "b",
      "explanation": "The passage states: 'Those who eat in the early hours... report better focus.'"
    },
    {
      "id": "RV8",
      "type": "true_or_false",
      "instruction": "Read the statement and decide if it is True or False.",
      "statement": "The word 'early' can be used as both an adjective and an adverb.",
      "answer": true,
      "explanation": "Adjective: 'the early hours' (modifies a noun). Adverb: 'waking early' (modifies a verb)."
    },
    {
      "id": "RV10",
      "type": "vocabulary_definition",
      "instruction": "Choose the correct definition for the word 'cook' used as a noun.",
      "options": {
        "a": "The act of preparing food with heat",
        "b": "A person who prepares food",
        "c": "A type of meal eaten at midday",
        "d": "A kitchen tool used for stirring"
      },
      "correct": "b",
      "explanation": "As a noun, 'a cook' is a person whose job or skill is preparing food. As a verb, 'to cook' means to prepare food."
    },
    {
      "id": "RV11",
      "type": "multiple_choice_grammar",
      "instruction": "Choose the grammatically correct sentence.",
      "options": {
        "a": "He always goes for a run in the morning.",
        "b": "He always go for a run in the morning.",
        "c": "He always going for a run in the morning.",
        "d": "He always gone for a run in the morning."
      },
      "correct": "a",
      "explanation": "'He' is third-person singular. In the Present Simple, 'go' becomes 'goes.' Frequency adverb 'always' goes before the main verb."
    },
    {
      "id": "RV13",
      "type": "sentence_transformation",
      "instruction": "Rewrite the sentence replacing 'I' with 'Maria' and making all necessary changes.",
      "original": "I wake up early and cook breakfast every day.",
      "answer": "Maria wakes up early and cooks breakfast every day.",
      "explanation": "Replace first-person verbs with third-person singular forms: wake → wakes, cook → cooks."
    }
  ]
}



### `data/writing-prompts.json`

```json
{
  "writing_prompts": [
    {
      "level": "A1",
      "unit_number": 1,
      "topic": "Daily Routines",
      "prompt": "Describe your typical weekday morning. What do you do, when do you do it, and which part of the morning do you enjoy most?",
      "min_words": 80,
      "max_words": 120,
      "rubric": {
        "task_response": "Strong: clearly describes a morning routine with specific times and activities. Weak: response is vague, off-topic, or lists only one activity.",
        "coherence": "Strong: ideas follow a logical chronological order using basic connectors. Weak: jumps between unrelated points without sequence words.",
        "vocabulary": "Strong: uses time expressions and routine verbs appropriately. Weak: very limited word range with frequent repetition of the same basic verbs.",
        "grammar": "Strong: consistent and accurate use of Present Simple for routines. Weak: frequent tense errors or sentence fragments."
      },
      "suggested_vocab": ["wake up", "have breakfast", "usually", "always", "before", "after", "in the morning", "get ready", "brush my teeth", "go to school"]
    },]}
````

### `data/speaking-tasks.json`

```json
{
  "speaking_tasks": [
    {
      "level": "A1",
      "unit_number": 1,
      "topic": "Daily Routines",
      "questions": [
        {
          "order": 1,
          "category": "personal",
          "question": "What time do you usually wake up on weekdays?",
          "think_seconds": 45,
          "speak_seconds": 60
        },]}
}



## Seed Script — `scripts/seed.ts`

A standalone Node.js script. Run with `tsx`, not bundled with the app.

```

npx tsx --env-file=.env.local scripts/seed.ts

```



### Idempotency

Running the seed script more than once must be safe. The script clears all curriculum tables at the start. Vocabulary words that reference units will be re-resolved on each run. Audio files are re-uploaded.
```
