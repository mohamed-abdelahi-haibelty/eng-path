import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

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
   * One row per unit (120 total). Static, seeded once.
   * Slug example: "a1-unit-01-daily-routines"
   */
  units: defineTable({
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    unitNumber: v.number(), // 1–30
    slug: v.string(), // "a1-unit-01-daily-routines"
    topic: v.string(),
    knowledgeFocus: v.string(),
    toeflAngle: v.string(),
    grammarPoint: v.string(),
  })
    .index("by_level", ["level"])
    .index("by_slug", ["slug"]),

  /**
   * Grammar explanation + reference. One row per unit.
   * Exercises are stored in a separate `grammarExercises` table.
   */
  grammarModules: defineTable({
    unitId: v.id("units"),
    explanationMarkdown: v.string(),
    examples: v.array(v.string()),
  }).index("by_unit", ["unitId"]),

  /**
   * Individual grammar exercise. Discriminated union by type.
   * One row per exercise (20 per unit × 120 units = 2400 total).
   */
  grammarExercises: defineTable({
    unitId: v.id("units"),
    id: v.string(), // "G1"–"G20"
    instruction: v.string(),
    exercise: v.union(
      v.object({
        type: v.literal("fill_in_the_blank"),
        sentence: v.string(),
        answer: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("multiple_choice"),
        sentence: v.string(),
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
        prompt: v.string(),
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
        word: v.string(),
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
        options: v.array(v.string()),
        correct: v.string(),
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
        prompt: v.string(),
        answer: v.string(),
        explanation: v.string(),
      }),
      v.object({
        type: v.literal("multiple_choice_grammar"),
        sentence: v.string(),
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
   * One row per unique word+level+pos combination.
   * Sourced from vocabulary.json and per-unit content files.
   */
  vocabulary: defineTable({
    word: v.string(),
    cefrLevel: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    partOfSpeech: v.string(),
    phonetics: v.string(),
    audioUrl: v.string(), // Oxford CDN URL
    unitId: v.optional(v.id("units")), // which unit introduced it
    topic: v.optional(v.string()),
  })
    .index("by_level", ["cefrLevel"])
    .index("by_unit", ["unitId"])
    .index("by_word", ["word"]),

  // ─── USER PROGRESS ────────────────────────────────────────────────────────

  /**
   * Tracks which modules a user has completed and their scores.
   * One row per user × unit.
   */
  unitProgress: defineTable({
    userId: v.id("users"),
    unitId: v.id("units"),
    // Module completion flags
    grammarCompleted: v.boolean(),
    grammarScore: v.optional(v.number()), // 0–100
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
    .index("by_userId_and_unitId", ["userId", "unitId"]),

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────

  /**
   * Writing submissions with AI feedback.
   */
  writingSubmissions: defineTable({
    userId: v.id("users"),
    unitId: v.id("units"),
    text: v.string(),
    wordCount: v.number(),
    score: v.optional(v.number()),
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
        suggestion: v.optional(v.string()), // null when fluency score is 0
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
});
