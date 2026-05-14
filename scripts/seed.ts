/**
 * Seeds the curriculum content into Convex.
 *
 *   npx tsx --env-file=.env.local scripts/seed.ts
 *
 * The script is idempotent: it clears all curriculum tables before inserting,
 * re-uploads audio files, and re-derives slug -> unitId mappings on every run.
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
const CONTENT_DIR = path.join(ROOT, "content");
const AUDIO_DIR = path.join(DATA_DIR, "audio");

const CURRICULUM_TABLES = [
  "units",
  "grammarModules",
  "grammarExercises",
  "readingModules",
  "listeningModules",
  "writingModules",
  "speakingModules",
  "reviewExercises",
  "vocabulary",
] as const;
type CurriculumTable = (typeof CURRICULUM_TABLES)[number];

const VOCAB_BATCH_SIZE = 200;

async function sleep(ms: number) {
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
      // Validation errors are not retryable
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ArgumentValidationError")) {
        throw err;
      }
      if (attempt === maxAttempts) break;
      const delay = 500 * 2 ** (attempt - 1);
      console.warn(`  ↻ ${label} (attempt ${attempt}) failed: ${message}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

interface TopicRow {
  level: Level;
  unit: number;
  topic: string;
  knowledge_focus: string;
  toefl_angle: string;
  grammar_point: string;
}

interface VocabularyWord {
  word: string;
  cefr_level: Level;
  part_of_speech: string;
  audio_url: string;
  phonetics: string;
}

interface VocabularyFile {
  [level: string]: {
    [unit: string]: {
      topic: string;
      words: VocabularyWord[];
    };
  };
}

interface GrammarExplanation {
  level: Level;
  unit_number: number;
  grammar_point: string;
  explanation_markdown: string;
  examples: string[];
}

interface WritingPrompt {
  level: Level;
  unit_number: number;
  topic: string;
  prompt: string;
  min_words: number;
  max_words: number;
  rubric: {
    task_response: string;
    coherence: string;
    vocabulary: string;
    grammar: string;
  };
  suggested_vocab: string[];
}

interface SpeakingTask {
  level: Level;
  unit_number: number;
  topic: string;
  questions: {
    order: number;
    category: string;
    question: string;
    think_seconds: number;
    speak_seconds: number;
  }[];
}

interface ContentFile {
  meta: {
    level: Level;
    unit: number;
    topic: string;
    knowledge_focus: string;
    toefl_angle: string;
    grammar_point: string;
  };
  reading: {
    title: string;
    passage: string;
    word_count: number;
    questions: {
      id: string;
      question: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }[];
  };
  listening: {
    title: string;
    speakers: Record<string, string>;
    dialogue: { turn: number; speaker: string; line: string }[];
    questions: {
      id: string;
      question: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }[];
  };
  grammar_exercises: GrammarExerciseJson[];
  review_exercises: ReviewExerciseJson[];
}

type GrammarExerciseJson =
  | {
      id: string;
      type: "fill_in_the_blank";
      instruction: string;
      sentence: string;
      options?: string[];
      answer?: string;
      correct?: string;
      explanation: string;
    }
  | {
      id: string;
      type: "multiple_choice";
      instruction: string;
      sentence?: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "sentence_transformation";
      instruction: string;
      original: string;
      prompt?: string;
      answer: string;
      explanation: string;
    }
  | {
      id: string;
      type: "error_correction";
      instruction: string;
      incorrect: string;
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "build_a_sentence";
      instruction: string;
      scrambled: string[];
      answer: string;
      explanation: string;
    };

type ReviewExerciseJson =
  | {
      id: string;
      type: "vocabulary_choice";
      instruction: string;
      sentence: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "vocabulary_definition";
      instruction: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "odd_one_out";
      instruction: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "fill_in_the_blank";
      instruction: string;
      sentence: string;
      options?: string[];
      answer: string;
      explanation: string;
    }
  | {
      id: string;
      type: "error_correction";
      instruction: string;
      incorrect: string;
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "comprehension_recall";
      instruction?: string;
      source: "reading" | "listening";
      question: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    }
  | {
      id: string;
      type: "true_or_false";
      instruction: string;
      statement: string;
      answer: boolean;
      explanation: string;
    }
  | {
      id: string;
      type: "sentence_transformation";
      instruction: string;
      original: string;
      prompt?: string;
      answer: string;
      explanation: string;
    }
  | {
      id: string;
      type: "multiple_choice_grammar";
      instruction: string;
      options: { a: string; b: string; c: string; d: string };
      correct: string;
      explanation: string;
    };

interface ContentEntry {
  level: Level;
  unitNumber: number;
  filename: string;
  slug: string;
  content: ContentFile;
}

function readJson<T>(filePath: string): Promise<T> {
  return readFile(filePath, "utf-8").then((s) => JSON.parse(s) as T);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function fourOptionsToArray(opts: {
  a: string;
  b: string;
  c: string;
  d: string;
}): string[] {
  return [opts.a, opts.b, opts.c, opts.d];
}

function extractWordFromInstruction(instruction: string): string | undefined {
  // Matches: word 'cook', word "cook", word 'cook' used as a noun
  const match = instruction.match(/word\s+['"`]([^'"`]+)['"`]/i);
  return match?.[1];
}

async function loadContentEntries(): Promise<ContentEntry[]> {
  const entries: ContentEntry[] = [];
  for (const level of LEVELS) {
    const levelDir = path.join(CONTENT_DIR, level);
    const files = await readdir(levelDir);
    for (const filename of files.filter((f) => f.endsWith(".json"))) {
      const fullPath = path.join(levelDir, filename);
      const content = await readJson<ContentFile>(fullPath);
      const baseName = filename.replace(/\.json$/, "");
      const slug = `${level.toLowerCase()}-${baseName}`;
      entries.push({
        level,
        unitNumber: content.meta.unit,
        filename,
        slug,
        content,
      });
    }
  }
  // Stable order: level then unitNumber
  entries.sort((a, b) => {
    if (a.level !== b.level) return LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level);
    return a.unitNumber - b.unitNumber;
  });
  return entries;
}

async function clearTable(client: ConvexHttpClient, table: CurriculumTable) {
  let totalDeleted = 0;
  while (true) {
    const result = await client.mutation(api.seed.clear.clearTableBatch, {
      table,
      batchSize: 256,
    });
    totalDeleted += result.deleted;
    if (!result.hasMore) break;
  }
  return totalDeleted;
}

async function clearAllTables(client: ConvexHttpClient) {
  // Clear listeningModules first so audio storage IDs are removed before
  // anything else; order otherwise doesn't matter because there are no
  // referential foreign keys enforced at the DB layer.
  const ordered: CurriculumTable[] = [
    "listeningModules",
    "vocabulary",
    "grammarExercises",
    "reviewExercises",
    "grammarModules",
    "readingModules",
    "writingModules",
    "speakingModules",
    "units",
  ];
  for (const table of ordered) {
    const deleted = await clearTable(client, table);
    console.log(`  cleared ${table}: ${deleted}`);
  }
}

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

function transformGrammarExercise(ex: GrammarExerciseJson) {
  const { id, instruction } = ex;
  switch (ex.type) {
    case "fill_in_the_blank": {
      const opts = Array.isArray(ex.options) ? ex.options : undefined;
      return {
        id,
        instruction,
        exercise: {
          type: "fill_in_the_blank" as const,
          sentence: ex.sentence,
          options: opts,
          answer: ex.answer ?? ex.correct ?? "",
          explanation: ex.explanation,
        },
      };
    }
    case "multiple_choice":
      return {
        id,
        instruction,
        exercise: {
          type: "multiple_choice" as const,
          sentence: ex.sentence,
          options: ex.options,
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "sentence_transformation":
      return {
        id,
        instruction,
        exercise: {
          type: "sentence_transformation" as const,
          original: ex.original,
          prompt: ex.prompt,
          answer: ex.answer,
          explanation: ex.explanation,
        },
      };
    case "error_correction":
      return {
        id,
        instruction,
        exercise: {
          type: "error_correction" as const,
          incorrect: ex.incorrect,
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "build_a_sentence":
      return {
        id,
        instruction,
        exercise: {
          type: "build_a_sentence" as const,
          scrambled: ex.scrambled,
          answer: ex.answer,
          explanation: ex.explanation,
        },
      };
  }
}

function transformReviewExercise(ex: ReviewExerciseJson) {
  const id = ex.id;
  const instruction = ex.instruction ?? "";
  switch (ex.type) {
    case "vocabulary_choice":
      return {
        id,
        instruction,
        exercise: {
          type: "vocabulary_choice" as const,
          sentence: ex.sentence,
          options: fourOptionsToArray(ex.options),
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "vocabulary_definition":
      return {
        id,
        instruction,
        exercise: {
          type: "vocabulary_definition" as const,
          word: extractWordFromInstruction(instruction),
          options: fourOptionsToArray(ex.options),
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "odd_one_out":
      return {
        id,
        instruction,
        exercise: {
          type: "odd_one_out" as const,
          words: fourOptionsToArray(ex.options),
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "fill_in_the_blank": {
      const opts = Array.isArray(ex.options) ? ex.options : undefined;
      return {
        id,
        instruction,
        exercise: {
          type: "fill_in_the_blank" as const,
          sentence: ex.sentence,
          options: opts,
          answer: ex.answer,
          explanation: ex.explanation,
        },
      };
    }
    case "error_correction":
      return {
        id,
        instruction,
        exercise: {
          type: "error_correction" as const,
          incorrect: ex.incorrect,
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "comprehension_recall":
      return {
        id,
        instruction,
        exercise: {
          type: "comprehension_recall" as const,
          source: ex.source,
          question: ex.question,
          options: fourOptionsToArray(ex.options),
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
    case "true_or_false":
      return {
        id,
        instruction,
        exercise: {
          type: "true_or_false" as const,
          statement: ex.statement,
          answer: ex.answer,
          explanation: ex.explanation,
        },
      };
    case "sentence_transformation":
      return {
        id,
        instruction,
        exercise: {
          type: "sentence_transformation" as const,
          original: ex.original,
          prompt: ex.prompt,
          answer: ex.answer,
          explanation: ex.explanation,
        },
      };
    case "multiple_choice_grammar":
      return {
        id,
        instruction,
        exercise: {
          type: "multiple_choice_grammar" as const,
          options: ex.options,
          correct: ex.correct,
          explanation: ex.explanation,
        },
      };
  }
}

function speakersObjectToArray(speakers: Record<string, string>) {
  return Object.entries(speakers).map(([key, name]) => ({ key, name }));
}

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Run with: npx tsx --env-file=.env.local scripts/seed.ts",
    );
  }
  const client = new ConvexHttpClient(convexUrl);

  console.log(`Seeding ${convexUrl}\n`);

  console.log("[1/4] Loading source files…");
  const topics = await readJson<TopicRow[]>(path.join(DATA_DIR, "topics.json"));
  const vocabulary = await readJson<VocabularyFile>(
    path.join(DATA_DIR, "vocabulary.json"),
  );
  const speakingTasks = (
    await readJson<{ speaking_tasks: SpeakingTask[] }>(
      path.join(DATA_DIR, "speaking-tasks.json"),
    )
  ).speaking_tasks;
  const writingPrompts = (
    await readJson<{ writing_prompts: WritingPrompt[] }>(
      path.join(DATA_DIR, "writing-prompts.json"),
    )
  ).writing_prompts;

  const grammarByLevel: Record<Level, GrammarExplanation[]> = {
    A1: [],
    A2: [],
    B1: [],
    B2: [],
  };
  for (const level of LEVELS) {
    const file = await readJson<{
      grammar_explanations: GrammarExplanation[];
    }>(path.join(DATA_DIR, `grammar-${level}.json`));
    grammarByLevel[level] = file.grammar_explanations;
  }

  const contentEntries = await loadContentEntries();
  console.log(
    `  ${topics.length} topics, ${contentEntries.length} content files, ` +
      `${writingPrompts.length} writing prompts, ${speakingTasks.length} speaking tasks`,
  );

  console.log("\n[2/4] Clearing curriculum tables…");
  await clearAllTables(client);

  console.log("\n[3/4] Seeding units…");
  const unitInserts = contentEntries.map((entry) => ({
    level: entry.level,
    unitNumber: entry.unitNumber,
    slug: entry.slug,
    topic: entry.content.meta.topic,
    knowledgeFocus: entry.content.meta.knowledge_focus,
    toeflAngle: entry.content.meta.toefl_angle,
    grammarPoint: entry.content.meta.grammar_point,
  }));
  const unitRows = await client.mutation(api.seed.units.seedUnits, {
    units: unitInserts,
  });
  const slugToUnitId = new Map<string, Id<"units">>();
  const levelUnitToUnitId = new Map<string, Id<"units">>();
  for (let i = 0; i < unitRows.length; i++) {
    const row = unitRows[i];
    const entry = contentEntries[i];
    slugToUnitId.set(row.slug, row.id as Id<"units">);
    levelUnitToUnitId.set(
      `${entry.level}-${entry.unitNumber}`,
      row.id as Id<"units">,
    );
  }
  console.log(`  inserted ${unitRows.length} units`);

  console.log("\n[4/4] Seeding modules per unit…");
  const grammarIndex = new Map<string, GrammarExplanation>();
  for (const level of LEVELS) {
    for (const g of grammarByLevel[level]) {
      grammarIndex.set(`${level}-${g.unit_number}`, g);
    }
  }
  const writingIndex = new Map<string, WritingPrompt>(
    writingPrompts.map((w) => [`${w.level}-${w.unit_number}`, w]),
  );
  const speakingIndex = new Map<string, SpeakingTask>(
    speakingTasks.map((s) => [`${s.level}-${s.unit_number}`, s]),
  );

  for (const entry of contentEntries) {
    const unitId = slugToUnitId.get(entry.slug);
    if (!unitId) throw new Error(`Missing unitId for ${entry.slug}`);
    const key = `${entry.level}-${entry.unitNumber}`;

    // Grammar module + exercises
    const grammar = grammarIndex.get(key);
    if (!grammar) {
      console.warn(`  ⚠ ${entry.slug}: missing grammar explanation — skipping`);
    } else {
      const grammarExercises = entry.content.grammar_exercises ?? [];
      if (grammarExercises.length === 0) {
        console.warn(
          `  ⚠ ${entry.slug}: no grammar_exercises in content file`,
        );
      }
      await client.mutation(api.seed.grammar.seedGrammarModule, {
        unitId,
        explanationMarkdown: grammar.explanation_markdown,
        examples: grammar.examples,
        exercises: grammarExercises.map(transformGrammarExercise),
      });
    }

    // Reading
    const reading = entry.content.reading;
    await client.mutation(api.seed.reading.seedReading, {
      unitId,
      title: reading.title,
      passage: reading.passage,
      wordCount: reading.word_count,
      questions: reading.questions,
    });

    // Listening — upload audio first (skip if dialogue or questions missing)
    const listening = entry.content.listening;
    if (!listening?.dialogue || !listening?.questions) {
      console.warn(
        `  ⚠ ${entry.slug}: listening section incomplete — skipping`,
      );
    } else {
      const audioFilename = `${entry.level}-${pad2(entry.unitNumber)}.mp3`;
      const audioPath = path.join(AUDIO_DIR, audioFilename);
      const audioStorageId = await uploadAudio(client, audioPath);
      await client.mutation(api.seed.listening.seedListening, {
        unitId,
        title: listening.title,
        speakers: speakersObjectToArray(listening.speakers),
        dialogue: listening.dialogue,
        audioStorageId,
        questions: listening.questions,
      });
    }

    // Writing
    const writing = writingIndex.get(key);
    if (!writing) throw new Error(`Missing writing prompt for ${key}`);
    await client.mutation(api.seed.writing.seedWriting, {
      unitId,
      prompt: writing.prompt,
      minWords: writing.min_words,
      maxWords: writing.max_words,
      rubric: {
        taskResponse: writing.rubric.task_response,
        coherence: writing.rubric.coherence,
        vocabulary: writing.rubric.vocabulary,
        grammar: writing.rubric.grammar,
      },
      suggestedVocab: writing.suggested_vocab,
    });

    // Speaking
    const speaking = speakingIndex.get(key);
    if (!speaking) throw new Error(`Missing speaking task for ${key}`);
    await client.mutation(api.seed.speaking.seedSpeaking, {
      unitId,
      questions: speaking.questions.map((q) => ({
        order: q.order,
        category: q.category,
        question: q.question,
        thinkSeconds: q.think_seconds,
        speakSeconds: q.speak_seconds,
      })),
    });

    // Review exercises
    const reviewExercises = entry.content.review_exercises ?? [];
    if (reviewExercises.length === 0) {
      console.warn(`  ⚠ ${entry.slug}: no review_exercises in content file`);
    }
    await client.mutation(api.seed.review.seedReview, {
      unitId,
      exercises: reviewExercises.map(transformReviewExercise),
    });

    console.log(`  ${entry.slug} ✓`);
  }

  console.log("\nSeeding vocabulary…");
  // Flatten and tag with unitId
  type VocabInsert = {
    word: string;
    cefrLevel: Level;
    partOfSpeech: string;
    phonetics: string;
    audioUrl: string;
    unitId?: Id<"units">;
    topic?: string;
  };
  const allWords: VocabInsert[] = [];
  let clampedAboveB2 = 0;
  for (const level of LEVELS) {
    const levelBucket = vocabulary[level] ?? {};
    for (const unitKey of Object.keys(levelBucket)) {
      const unitNumber = Number(unitKey);
      const bucket = levelBucket[unitKey];
      const unitId = levelUnitToUnitId.get(`${level}-${unitNumber}`);
      for (const w of bucket.words) {
        // Vocabulary source occasionally tags words as C1+; the curriculum
        // is scoped to A1–B2, so clamp anything above B2 down to B2.
        const isSupported = LEVELS.includes(w.cefr_level as Level);
        if (!isSupported) clampedAboveB2++;
        const cefrLevel: Level = isSupported ? (w.cefr_level as Level) : "B2";
        allWords.push({
          word: w.word,
          cefrLevel,
          partOfSpeech: w.part_of_speech,
          phonetics: w.phonetics,
          audioUrl: w.audio_url,
          unitId,
          topic: bucket.topic,
        });
      }
    }
  }
  if (clampedAboveB2 > 0) {
    console.log(`  (clamped ${clampedAboveB2} above-B2 words to B2)`);
  }
  let inserted = 0;
  for (let i = 0; i < allWords.length; i += VOCAB_BATCH_SIZE) {
    const batch = allWords.slice(i, i + VOCAB_BATCH_SIZE);
    await withRetry(
      () =>
        client.mutation(api.seed.vocabulary.seedVocabularyBatch, {
          words: batch,
        }),
      `vocab batch ${i / VOCAB_BATCH_SIZE + 1}`,
    );
    inserted += batch.length;
    process.stdout.write(
      `  ${inserted}/${allWords.length} words seeded\r`,
    );
  }
  console.log("");
  console.log(`\n✓ Seed complete. ${unitRows.length} units, ${allWords.length} words.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
