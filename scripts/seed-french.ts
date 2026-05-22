/**
 * Seeds French curriculum content into Convex.
 *
 *   npx tsx --env-file=.env.local scripts/seed-french.ts
 *
 * Idempotent: clears all French rows (language="fr") before inserting.
 * Does NOT touch English curriculum data.
 *
 * Source files:
 *   data/generated/fr/{a1,a2,b1,b2}/unit-{01-30}.json  — content per unit
 *   data/audio/fr/{Level}-{NN}.mp3                      — listening audio
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type Level = "A1" | "A2" | "B1" | "B2";

const LEVELS: Level[] = ["A1", "A2", "B1", "B2"];

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const FRENCH_CONTENT_DIR = path.join(DATA_DIR, "generated", "fr");
const FRENCH_AUDIO_DIR = path.join(DATA_DIR, "audio", "fr");

const FRENCH_TABLES = [
  "conjugaisonModules",
  "orthographeModules",
  "listeningModules",
  "vocabulary",
  "grammarModules",
  "grammarExercises",
  "readingModules",
  "writingModules",
  "speakingModules",
  "reviewExercises",
  "units",
] as const;

const VOCAB_BATCH_SIZE = 200;

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface FrenchMeta {
  level: Level;
  unit: number;
  topic: string;
  knowledge_focus: string;
  delf_angle: string;
  grammar_point: string;
}

type FrenchGrammarExercisePayload =
  | {
      type: "fill_in_the_blank";
      sentence: string;
      options?: string[];
      answer: string;
      explanation: string;
    }
  | {
      type: "multiple_choice";
      sentence?: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }
  | {
      type: "sentence_transformation";
      original: string;
      prompt?: string;
      answer: string;
      explanation: string;
    }
  | {
      type: "error_correction";
      incorrect: string;
      correct: string;
      explanation: string;
    }
  | {
      type: "build_a_sentence";
      scrambled: string[];
      answer: string;
      explanation: string;
    };

interface FrenchGrammarExercise {
  id: string;
  instruction: string;
  exercise: FrenchGrammarExercisePayload;
}

interface FrenchGrammar {
  explanationMarkdown: string;
  examples: string[];
  exercises?: FrenchGrammarExercise[];
}

interface FrenchConjugaisonExercise {
  id: string;
  type: "fill_conjugation" | "choose_correct_form" | "transform_tense" | "error_correction";
  instruction: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

interface FrenchConjugaison {
  verb: string;
  tense: string;
  conjugationTable: { pronoun: string; form: string }[];
  irregularNotes: string | null;
  exercises: FrenchConjugaisonExercise[];
}

interface FrenchOrthographeExercise {
  id: string;
  type: "correct_the_spelling" | "choose_correct_spelling" | "fill_accent" | "gender_agreement";
  instruction: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

interface FrenchOrthographe {
  rule: string;
  explanationMarkdown: string;
  examples: string[];
  exercises: FrenchOrthographeExercise[];
}

interface FrenchVocabEntry {
  word: string;
  cefrLevel: Level;
  partOfSpeech: string;
  gender: string | null;
  phonetics: string;
  arabicTranslation: string;
  exampleSentence: string;
}

interface FrenchVocabulary {
  vocabulary: FrenchVocabEntry[];
}

interface FrenchQuestion {
  id: string;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct: string;
  explanation: string;
}

interface FrenchReading {
  title: string;
  passage: string;
  wordCount: number;
  questions: FrenchQuestion[];
}

interface FrenchDialogueTurn {
  turn: number;
  speaker: string;
  line: string;
}

interface FrenchSpeaker {
  key: string;
  name: string;
}

interface FrenchListening {
  title: string;
  speakers: FrenchSpeaker[];
  dialogue: FrenchDialogueTurn[];
  questions: FrenchQuestion[];
}

interface FrenchWriting {
  prompt: string;
  minWords: number;
  maxWords: number;
  rubric: {
    taskResponse: string;
    coherence: string;
    vocabulary: string;
    grammar: string;
  };
  suggestedVocab: string[];
}

interface FrenchSpeakingQuestion {
  order: number;
  category: string;
  question: string;
  thinkSeconds: number;
  speakSeconds: number;
}

interface FrenchSpeaking {
  questions: FrenchSpeakingQuestion[];
}

interface FrenchReviewExercise {
  id: string;
  instruction: string;
  exercise: Record<string, unknown>;
}

interface FrenchReview {
  exercises: FrenchReviewExercise[];
}

interface FrenchContentFile {
  meta: FrenchMeta;
  grammar: FrenchGrammar;
  conjugaison: FrenchConjugaison;
  orthographe: FrenchOrthographe;
  vocabulary: FrenchVocabulary;
  reading: FrenchReading;
  listening: FrenchListening;
  writing: FrenchWriting;
  speaking: FrenchSpeaking;
  review: FrenchReview;
}

interface ContentEntry {
  level: Level;
  unitNumber: number;
  slug: string;
  content: FrenchContentFile;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): Promise<T> {
  return readFile(filePath, "utf-8").then((s) => JSON.parse(s) as T);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 5,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ArgumentValidationError")) throw err;
      if (attempt === maxAttempts) break;
      const delay = 500 * 2 ** (attempt - 1);
      console.warn(`  ↻ ${label} (attempt ${attempt}) failed: ${message}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** Strip null values from an object so Convex validators see undefined instead. */
function stripNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null),
  ) as T;
}

// ─── CONTENT LOADING ─────────────────────────────────────────────────────────

async function loadContentEntries(): Promise<ContentEntry[]> {
  const entries: ContentEntry[] = [];
  for (const level of LEVELS) {
    const levelDir = path.join(FRENCH_CONTENT_DIR, level.toLowerCase());
    const files = await readdir(levelDir);
    for (const filename of files.filter((f) => f.endsWith(".json"))) {
      const fullPath = path.join(levelDir, filename);
      const content = await readJson<FrenchContentFile>(fullPath);
      // Slug: fr-a1-unit-01-les-routines-quotidiennes
      const topicSlug = content.meta.topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      const slug = `fr-${level.toLowerCase()}-unit-${pad2(content.meta.unit)}-${topicSlug}`;
      entries.push({ level, unitNumber: content.meta.unit, slug, content });
    }
  }
  entries.sort((a, b) => {
    if (a.level !== b.level) return LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level);
    return a.unitNumber - b.unitNumber;
  });
  return entries;
}

// ─── CLEAR ────────────────────────────────────────────────────────────────────

async function clearFrenchTable(
  client: ConvexHttpClient,
  table: (typeof FRENCH_TABLES)[number],
) {
  let totalDeleted = 0;
  while (true) {
    const result = await client.mutation(api.seed.clear.clearFrenchBatch, {
      table,
      language: "fr",
      batchSize: 128,
    });
    totalDeleted += result.deleted;
    if (!result.hasMore) break;
  }
  return totalDeleted;
}

async function clearAllFrenchData(client: ConvexHttpClient) {
  for (const table of FRENCH_TABLES) {
    const deleted = await clearFrenchTable(client, table);
    console.log(`  cleared ${table}: ${deleted}`);
  }
}

// ─── AUDIO UPLOAD ─────────────────────────────────────────────────────────────

async function uploadAudio(
  client: ConvexHttpClient,
  filePath: string,
): Promise<Id<"_storage">> {
  const url = await client.mutation(api.seed.storage.generateUploadUrl, {});
  const bytes = await readFile(filePath);
  const blob = new Blob([new Uint8Array(bytes)], { type: "audio/mpeg" });
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: blob,
  });
  if (!response.ok) {
    throw new Error(
      `Audio upload failed (${response.status}): ${await response.text()}`,
    );
  }
  const { storageId } = (await response.json()) as { storageId: string };
  return storageId as Id<"_storage">;
}

// ─── EXERCISE TRANSFORMS ──────────────────────────────────────────────────────

/** Remove null option arrays from conjugaison/orthographe exercises. */
function cleanConjugaisonExercise(ex: FrenchConjugaisonExercise) {
  const cleaned: Record<string, unknown> = {
    id: ex.id,
    type: ex.type,
    instruction: ex.instruction,
    question: ex.question,
    answer: ex.answer,
    explanation: ex.explanation,
  };
  if (ex.options !== null && ex.options !== undefined) {
    cleaned.options = ex.options;
  }
  return cleaned as {
    id: string;
    type: "fill_conjugation" | "choose_correct_form" | "transform_tense" | "error_correction";
    instruction: string;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  };
}

function cleanOrthographeExercise(ex: FrenchOrthographeExercise) {
  const cleaned: Record<string, unknown> = {
    id: ex.id,
    type: ex.type,
    instruction: ex.instruction,
    question: ex.question,
    answer: ex.answer,
    explanation: ex.explanation,
  };
  if (ex.options !== null && ex.options !== undefined) {
    cleaned.options = ex.options;
  }
  return cleaned as {
    id: string;
    type: "correct_the_spelling" | "choose_correct_spelling" | "fill_accent" | "gender_agreement";
    instruction: string;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  };
}

/**
 * Cleans a French review exercise's inner `exercise` object.
 * Strips top-level null fields that would fail optional validators.
 */
function cleanReviewExercise(ex: FrenchReviewExercise): {
  id: string;
  instruction: string;
  exercise: Record<string, unknown>;
} {
  return {
    id: ex.id,
    instruction: ex.instruction ?? "",
    exercise: stripNulls(ex.exercise as Record<string, unknown>),
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Run with: npx tsx --env-file=.env.local scripts/seed-french.ts",
    );
  }
  const client = new ConvexHttpClient(convexUrl);

  console.log(`Seeding French content → ${convexUrl}\n`);

  // ── 1. Load content files ─────────────────────────────────────────────────
  console.log("[1/4] Loading French content files…");
  const entries = await loadContentEntries();
  console.log(`  ${entries.length} content files loaded`);
  if (entries.length === 0) throw new Error("No French content files found.");

  // ── 2. Clear French data ──────────────────────────────────────────────────
  console.log("\n[2/4] Clearing existing French data…");
  await clearAllFrenchData(client);

  // ── 3. Seed units and modules ─────────────────────────────────────────────
  console.log("\n[3/4] Seeding French units and modules…");

  const unitInserts = entries.map((e) => ({
    language: "fr" as const,
    level: e.level,
    unitNumber: e.unitNumber,
    slug: e.slug,
    topic: e.content.meta.topic,
    knowledgeFocus: e.content.meta.knowledge_focus,
    toeflAngle: e.content.meta.delf_angle,
    grammarPoint: e.content.meta.grammar_point,
  }));

  const unitRows = await client.mutation(api.seed.units.seedUnits, {
    units: unitInserts,
  });

  const slugToUnitId = new Map<string, Id<"units">>();
  for (const row of unitRows) {
    slugToUnitId.set(row.slug, row.id as Id<"units">);
  }
  console.log(`  inserted ${unitRows.length} units`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const unitId = slugToUnitId.get(entry.slug);
    if (!unitId) throw new Error(`Missing unitId for ${entry.slug}`);
    const { content } = entry;

    // Grammar module (explanation + examples + optional 20 exercises)
    await withRetry(
      () =>
        client.mutation(api.seed.grammar.seedGrammarModule, {
          unitId,
          language: "fr",
          explanationMarkdown: content.grammar.explanationMarkdown,
          examples: content.grammar.examples,
          exercises: content.grammar.exercises,
        }),
      `${entry.slug} grammar`,
    );

    // Conjugaison module
    await withRetry(
      () =>
        client.mutation(api.seed.conjugaison.seedConjugaison, {
          unitId,
          verb: content.conjugaison.verb,
          tense: content.conjugaison.tense,
          conjugationTable: content.conjugaison.conjugationTable,
          irregularNotes: content.conjugaison.irregularNotes ?? undefined,
          exercises: content.conjugaison.exercises.map(cleanConjugaisonExercise),
        }),
      `${entry.slug} conjugaison`,
    );

    // Orthographe module
    await withRetry(
      () =>
        client.mutation(api.seed.orthographe.seedOrthographe, {
          unitId,
          rule: content.orthographe.rule,
          explanationMarkdown: content.orthographe.explanationMarkdown,
          examples: content.orthographe.examples,
          exercises: content.orthographe.exercises.map(cleanOrthographeExercise),
        }),
      `${entry.slug} orthographe`,
    );

    // Reading
    await withRetry(
      () =>
        client.mutation(api.seed.reading.seedReading, {
          unitId,
          language: "fr",
          title: content.reading.title,
          passage: content.reading.passage,
          wordCount: content.reading.wordCount,
          questions: content.reading.questions,
        }),
      `${entry.slug} reading`,
    );

    // Listening — upload audio first
    const audioFilename = `${entry.level}-${pad2(entry.unitNumber)}.mp3`;
    const audioPath = path.join(FRENCH_AUDIO_DIR, audioFilename);
    const audioStorageId = await withRetry(
      () => uploadAudio(client, audioPath),
      `${entry.slug} audio`,
    );
    await withRetry(
      () =>
        client.mutation(api.seed.listening.seedListening, {
          unitId,
          language: "fr",
          title: content.listening.title,
          speakers: content.listening.speakers,
          dialogue: content.listening.dialogue,
          audioStorageId,
          questions: content.listening.questions,
        }),
      `${entry.slug} listening`,
    );

    // Writing
    await withRetry(
      () =>
        client.mutation(api.seed.writing.seedWriting, {
          unitId,
          language: "fr",
          prompt: content.writing.prompt,
          minWords: content.writing.minWords,
          maxWords: content.writing.maxWords,
          rubric: content.writing.rubric,
          suggestedVocab: content.writing.suggestedVocab,
        }),
      `${entry.slug} writing`,
    );

    // Speaking
    await withRetry(
      () =>
        client.mutation(api.seed.speaking.seedSpeaking, {
          unitId,
          language: "fr",
          questions: content.speaking.questions,
        }),
      `${entry.slug} speaking`,
    );

    // Review exercises (already structured — just strip nulls)
    const reviewExercises = content.review.exercises ?? [];
    if (reviewExercises.length === 0) {
      console.warn(`  ⚠ ${entry.slug}: no review exercises`);
    } else {
      await withRetry(
        () =>
          client.mutation(api.seed.review.seedReview, {
            unitId,
            language: "fr",
            exercises: reviewExercises.map(cleanReviewExercise) as Parameters<
              typeof client.mutation<typeof api.seed.review.seedReview>
            >[1]["exercises"],
          }),
        `${entry.slug} review`,
      );
    }

    console.log(`  ${entry.slug} ✓  (${i + 1}/${entries.length})`);
  }

  // ── 4. Seed vocabulary ────────────────────────────────────────────────────
  console.log("\n[4/4] Seeding French vocabulary…");

  const slugToUnitIdFinal = new Map<string, Id<"units">>();
  for (const row of unitRows) {
    slugToUnitIdFinal.set(row.slug, row.id as Id<"units">);
  }

  type VocabInsert = {
    language: "fr";
    word: string;
    cefrLevel: Level;
    partOfSpeech: string;
    phonetics: string;
    audioUrl: string;
    unitId?: Id<"units">;
    arabicTranslation?: string;
  };

  const allWords: VocabInsert[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const unitId = slugToUnitIdFinal.get(entry.slug);
    for (const w of entry.content.vocabulary.vocabulary) {
      const cefrLevel = (["A1", "A2", "B1", "B2"] as Level[]).includes(
        w.cefrLevel as Level,
      )
        ? (w.cefrLevel as Level)
        : "B2";
      allWords.push({
        language: "fr",
        word: w.word,
        cefrLevel,
        partOfSpeech: w.partOfSpeech,
        phonetics: w.phonetics ?? "",
        audioUrl: "",
        unitId,
        arabicTranslation: w.arabicTranslation ?? undefined,
      });
    }
  }

  let inserted = 0;
  for (let i = 0; i < allWords.length; i += VOCAB_BATCH_SIZE) {
    const batch = allWords.slice(i, i + VOCAB_BATCH_SIZE);
    await withRetry(
      () => client.mutation(api.seed.vocabulary.seedVocabularyBatch, { words: batch }),
      `vocab batch ${Math.floor(i / VOCAB_BATCH_SIZE) + 1}`,
    );
    inserted += batch.length;
    process.stdout.write(`  ${inserted}/${allWords.length} words seeded\r`);
  }
  console.log("");

  console.log(
    `\n✓ French seed complete. ${unitRows.length} units, ${allWords.length} vocabulary words.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
