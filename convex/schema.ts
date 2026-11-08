import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Language field for tables that existed before French was added.
// Optional so that existing English rows (seeded without a language value)
// continue to pass schema validation. New inserts always set "en" or "fr".
// After running `npm run seed` the English rows will have language: "en".
const languageOpt = v.optional(v.union(v.literal("en"), v.literal("fr")));

export default defineSchema({
  ...authTables,

  // ─── USERS ────────────────────────────────────────────────────────────────
  // Extends authTables.users with app-specific fields.
  users: defineTable({
    // Required by @convex-dev/auth:
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App-specific:
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // ─── CURRICULUM ───────────────────────────────────────────────────────────

  /**
   * One row per unit (120 English + 120 French = 240 total). Static, seeded once.
   * Slug example: "a1-unit-01-daily-routines" / "fr-a1-unit-01-routines-quotidiennes"
   */
  units: defineTable({
    language: languageOpt,
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    unitNumber: v.number(), // 1–30
    slug: v.string(),
    topic: v.string(),
    knowledgeFocus: v.string(),
    toeflAngle: v.string(),
    grammarPoint: v.string(),
  })
    .index("by_level", ["level"])
    .index("by_slug", ["slug"])
    .index("by_language_and_level", ["language", "level"]),

  /**
   * Grammar explanation + reference. One row per unit.
   * Exercises are stored in a separate `grammarExercises` table.
   */
  grammarModules: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    explanationMarkdown: v.string(),
    examples: v.array(v.string()),
  }).index("by_unit", ["unitId"]),

  /**
   * Individual grammar exercise. Discriminated union by type.
   * One row per exercise (20 per unit × 120 units = 2400 total per language).
   */
  grammarExercises: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    id: v.string(), // "G1"–"G20"
    instruction: v.string(),
    exercise: v.union(
      v.object({
        type: v.literal("fill_in_the_blank"),
        sentence: v.string(),
        options: v.optional(v.array(v.string())),
        answer: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("multiple_choice"),
        sentence: v.optional(v.string()),
        options: v.object({
          a: v.string(),
          b: v.string(),
          c: v.string(),
          d: v.string(),
        }),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("sentence_transformation"),
        original: v.string(),
        prompt: v.optional(v.string()),
        answer: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("error_correction"),
        incorrect: v.string(),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("build_a_sentence"),
        scrambled: v.array(v.string()),
        answer: v.string(),
        explanation: v.string(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  /**
   * Reading passage + 5 questions. One row per unit.
   */
  readingModules: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    title: v.string(),
    passage: v.string(),
    wordCount: v.number(),
    questions: v.array(
      v.object({
        id: v.string(),
        question: v.string(),
        options: v.object({
          a: v.string(),
          b: v.string(),
          c: v.string(),
          d: v.string(),
        }),
        correct: v.string(),
        explanation: v.string(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  /**
   * Listening dialogue + 5 questions + Convex storage ID for audio.
   */
  listeningModules: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    title: v.string(),
    speakers: v.array(
      v.object({
        key: v.string(),
        name: v.string(),
      })
    ),
    dialogue: v.array(
      v.object({
        turn: v.number(),
        speaker: v.string(),
        line: v.string(),
      })
    ),
    audioStorageId: v.id("_storage"), // Required: all audio lives in File Storage
    questions: v.array(
      v.object({
        id: v.string(),
        question: v.string(),
        options: v.object({
          a: v.string(),
          b: v.string(),
          c: v.string(),
          d: v.string(),
        }),
        correct: v.string(),
        explanation: v.string(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  /**
   * Writing prompt + rubric. One row per unit.
   */
  writingModules: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    prompt: v.string(),
    minWords: v.number(),
    maxWords: v.number(),
    rubric: v.object({
      taskResponse: v.string(),
      coherence: v.string(),
      vocabulary: v.string(),
      grammar: v.string(),
    }),
    suggestedVocab: v.array(v.string()),
  }).index("by_unit", ["unitId"]),

  /**
   * 10 speaking questions. One row per unit.
   */
  speakingModules: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    questions: v.array(
      v.object({
        order: v.number(),
        category: v.string(),
        question: v.string(),
        thinkSeconds: v.number(),
        speakSeconds: v.number(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  /**
   * Review exercises (12–15 mixed). Stored in separate table.
   */
  reviewExercises: defineTable({
    unitId: v.id("units"),
    language: languageOpt,
    id: v.string(), // "RV1"–"RV13"
    instruction: v.string(),
    exercise: v.union(
      v.object({
        type: v.literal("vocabulary_choice"),
        sentence: v.string(),
        options: v.array(v.string()),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("vocabulary_definition"),
        word: v.optional(v.string()),
        options: v.array(v.string()),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("odd_one_out"),
        words: v.array(v.string()),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("fill_in_the_blank"),
        sentence: v.string(),
        options: v.optional(v.array(v.string())),
        answer: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("error_correction"),
        incorrect: v.string(),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("comprehension_recall"),
        source: v.union(v.literal("reading"), v.literal("listening")),
        question: v.string(),
        options: v.array(v.string()),
        correct: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("true_or_false"),
        statement: v.string(),
        answer: v.boolean(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("sentence_transformation"),
        original: v.string(),
        prompt: v.optional(v.string()),
        answer: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("multiple_choice_grammar"),
        sentence: v.optional(v.string()),
        options: v.object({
          a: v.string(),
          b: v.string(),
          c: v.string(),
          d: v.string(),
        }),
        correct: v.string(),
        explanation: v.string(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  // ─── VOCABULARY ──────────────────────────────────────────────────────────

  /**
   * One row per unique word+language+level+pos combination.
   * Sourced from vocabulary.json and per-unit content files.
   */
  vocabulary: defineTable({
    language: languageOpt,
    word: v.string(),
    cefrLevel: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    partOfSpeech: v.string(),
    phonetics: v.string(),
    audioUrl: v.string(), // Oxford CDN URL (en) or "" for French
    unitId: v.optional(v.id("units")), // which unit introduced it
    topic: v.optional(v.string()),
    arabicTranslation: v.optional(v.string()), // populated lazily on first reading page visit
  })
    .index("by_level", ["cefrLevel"])
    .index("by_unit", ["unitId"])
    .index("by_word", ["word"]),

  // ─── USER PROGRESS ────────────────────────────────────────────────────────

  /**
   * Tracks which modules a user has completed and their scores.
   * One row per user × unit.
   * language is optional to preserve existing English rows seeded before this
   * field was added. New inserts always set "en" or "fr".
   */
  unitProgress: defineTable({
    userId: v.id("users"),
    unitId: v.id("units"),
    language: languageOpt,
    // Module completion flags
    grammarCompleted: v.boolean(),
    grammarScore: v.optional(v.number()), // 0–100
    // French-only modules (optional so English unitProgress rows still validate)
    conjugaisonCompleted: v.optional(v.boolean()),
    conjugaisonScore: v.optional(v.number()),
    orthographeCompleted: v.optional(v.boolean()),
    orthographeScore: v.optional(v.number()),
    readingCompleted: v.boolean(),
    readingScore: v.optional(v.number()),
    listeningCompleted: v.boolean(),
    listeningScore: v.optional(v.number()),
    listeningListensUsed: v.number(), // max 2 (enforced in mutation logic)
    writingCompleted: v.boolean(),
    speakingCompleted: v.boolean(),
    reviewCompleted: v.boolean(),
    reviewScore: v.optional(v.number()),
    // Derived
    unitCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_userId_and_unitId", ["userId", "unitId"])
    .index("by_language_and_userId", ["language", "userId"]),

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────

  /**
   * Writing submissions with AI feedback.
   */
  writingSubmissions: defineTable({
    userId: v.id("users"),
    unitId: v.id("units"),
    language: languageOpt,
    text: v.string(),
    wordCount: v.number(),
    score: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        taskResponse: v.number(),
        coherence: v.number(),
        vocabulary: v.number(),
        grammar: v.number(),
      })
    ),
    strengths: v.optional(v.array(v.string())),
    weaknesses: v.optional(v.array(v.string())),
    modelRewrite: v.optional(v.string()),
    submittedAt: v.number(),
    feedbackStatus: v.union(
      v.literal("pending"),
      v.literal("done"),
      v.literal("error")
    ),
  })
    .index("by_userId_and_unitId", ["userId", "unitId"])
    .index("by_user", ["userId"])
    .index("by_status", ["feedbackStatus"]),

  /**
   * Speaking submissions — one row per full speaking session (10 questions).
   * Each response is scored on 4 criteria (fluency, coherence, vocabulary,
   * grammar), each 0–5, totalling 20 per response.
   */
  speakingSubmissions: defineTable({
    userId: v.id("users"),
    unitId: v.id("units"),
    language: languageOpt,
    responses: v.array(
      v.object({
        order: v.number(),
        question: v.string(),
        audioStorageId: v.id("_storage"),
        transcript: v.optional(v.string()),
        wordCount: v.optional(v.number()), // from pre-LLM word count gate
        scores: v.optional(
          v.object({
            fluency: v.number(), // 0–5
            coherence: v.number(), // 0–5
            vocabulary: v.number(), // 0–5
            grammar: v.number(), // 0–5
          })
        ),
        totalScore: v.optional(v.number()), // sum of 4 criteria, 0–20
        feedback: v.optional(v.string()),
        suggestion: v.optional(v.string()), // undefined when fluency score is 0
        evaluationStatus: v.union(
          v.literal("pending"),
          v.literal("done"),
          v.literal("error")
        ),
      })
    ),
    overallScore: v.optional(v.number()), // average totalScore across responses
    overallEvaluationStatus: v.union(
      v.literal("pending"),
      v.literal("done"),
      v.literal("error")
    ),
    submittedAt: v.number(),
  })
    .index("by_userId_and_unitId", ["userId", "unitId"])
    .index("by_user", ["userId"])
    .index("by_status", ["overallEvaluationStatus"]),

  // ─── FLASHCARDS ──────────────────────────────────────────────────────────

  /**
   * Personal deck — one row per user × vocabulary word added.
   * FSRS scheduling fields stored here.
   */
  flashcards: defineTable({
    userId: v.id("users"),
    vocabularyId: v.id("vocabulary"),
    // FSRS core fields
    stability: v.number(), // S
    difficulty: v.number(), // D (1–10)
    elapsedDays: v.number(),
    scheduledDays: v.number(),
    reps: v.number(),
    lapses: v.number(),
    state: v.union(
      v.literal("new"),
      v.literal("learning"),
      v.literal("review"),
      v.literal("relearning")
    ),
    due: v.number(), // Unix ms timestamp
    lastReview: v.optional(v.number()),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_userId_and_due", ["userId", "due"])
    .index("by_userId_and_vocabularyId", ["userId", "vocabularyId"]),

  /**
   * Individual review log per card rating (for analytics + FSRS history).
   */
  flashcardReviews: defineTable({
    userId: v.id("users"),
    flashcardId: v.id("flashcards"),
    rating: v.union(
      v.literal("again"),
      v.literal("hard"),
      v.literal("good"),
      v.literal("easy")
    ),
    reviewedAt: v.number(),
    elapsedDays: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_card", ["flashcardId"]),

  // ─── FRENCH-SPECIFIC MODULES ──────────────────────────────────────────────

  /**
   * French verb conjugation module. One row per unit (French only).
   * Teaches a target verb+tense with a full conjugation table and exercises.
   */
  conjugaisonModules: defineTable({
    unitId: v.id("units"),
    language: v.literal("fr"),
    verb: v.string(),
    tense: v.string(),
    conjugationTable: v.array(
      v.object({
        pronoun: v.string(),
        form: v.string(),
      })
    ),
    irregularNotes: v.optional(v.string()),
    exercises: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("fill_conjugation"),
          v.literal("choose_correct_form"),
          v.literal("transform_tense"),
          v.literal("error_correction")
        ),
        instruction: v.string(),
        question: v.string(),
        options: v.optional(v.array(v.string())),
        answer: v.string(),
        explanation: v.string(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  /**
   * French spelling / orthography module. One row per unit (French only).
   * Covers accents, gender agreement, silent letters, homophones, etc.
   */
  orthographeModules: defineTable({
    unitId: v.id("units"),
    language: v.literal("fr"),
    rule: v.string(),
    explanationMarkdown: v.string(),
    examples: v.array(v.string()),
    exercises: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("correct_the_spelling"),
          v.literal("choose_correct_spelling"),
          v.literal("fill_accent"),
          v.literal("gender_agreement")
        ),
        instruction: v.string(),
        question: v.string(),
        options: v.optional(v.array(v.string())),
        answer: v.string(),
        explanation: v.string(),
      })
    ),
  }).index("by_unit", ["unitId"]),

  // ─── PHRASE BANK ──────────────────────────────────────────────────────────

  /**
   * User-saved sentences per language. Enriched asynchronously by AI.
   * FSRS fields track spaced-repetition review schedule.
   */
  savedSentences: defineTable({
    userId: v.id("users"),
    language: v.union(v.literal("en"), v.literal("fr")),
    text: v.string(),
    source: v.union(
      v.literal("reading"),
      v.literal("speaking"),
      v.literal("writing"),
      v.literal("listening"),
      v.literal("manual")
    ),
    note: v.optional(v.string()),
    // AI enrichment
    aiStatus: v.union(
      v.literal("pending"),
      v.literal("done"),
      v.literal("error")
    ),
    keyExpression: v.optional(v.string()),
    grammarNote: v.optional(v.string()),
    paraphrases: v.optional(v.array(v.string())),
    usageContexts: v.optional(v.array(v.string())),
    cefrLevel: v.optional(v.string()),
    blankWord: v.optional(v.string()),
    // FSRS scheduling fields (same set as flashcards)
    stability: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    elapsedDays: v.optional(v.number()),
    scheduledDays: v.optional(v.number()),
    reps: v.optional(v.number()),
    lapses: v.optional(v.number()),
    state: v.optional(
      v.union(
        v.literal("new"),
        v.literal("learning"),
        v.literal("review"),
        v.literal("relearning")
      )
    ),
    due: v.optional(v.number()),
    lastReview: v.optional(v.number()),
    savedAt: v.number(),
  })
    .index("by_user_and_language", ["userId", "language"])
    .index("by_user_language_and_due", ["userId", "language", "due"]),
});
