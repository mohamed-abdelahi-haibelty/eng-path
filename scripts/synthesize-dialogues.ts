/**
 * synthesize-dialogues.ts
 *
 * Offline curriculum pipeline: converts each unit's listening dialogue
 * (content/units/{LEVEL}/unit-{NN}-{TOPIC}.json) into one MP3 per unit at
 * data/curriculum/generated/audio/dialogues/{LEVEL}-{NN}.mp3 using Google
 * Cloud Text-to-Speech Studio voices and SSML.
 *
 * Run with: npx tsx scripts/curriculum-generator/synthesize-dialogues.ts
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import textToSpeech from "@google-cloud/text-to-speech";
import type { protos } from "@google-cloud/text-to-speech";

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(process.cwd());
const INPUT_ROOT = path.join(PROJECT_ROOT, "content", "units");
const OUTPUT_ROOT = path.join(
  PROJECT_ROOT,
  "data",
  "curriculum",
  "generated",
  "audio",
  "dialogues",
);

const LANGUAGE_CODE = "en-US";

interface VoiceConfig {
  name: string;
  speakingRate: number;
  pitch: number; // semitones; 0 = natural
}

// Speaker A is male and slightly faster + higher-pitched for an energetic feel.
// Speaker B is female at the conversational TOEFL pace.
const VOICE_SPEAKER_A: VoiceConfig = {
  name: "en-US-Studio-Q", // Male Studio
  speakingRate: 1.25,
  pitch: 1.5,
};
const VOICE_SPEAKER_B: VoiceConfig = {
  name: "en-US-Studio-O", // Female Studio
  speakingRate: 1.15,
  pitch: 0,
};

const AUDIO_ENCODING: protos.google.cloud.texttospeech.v1.AudioEncoding =
  "MP3" as unknown as protos.google.cloud.texttospeech.v1.AudioEncoding;

const BREAK_AFTER_TURN_MS = 500;
const DELAY_BETWEEN_TURNS_MS = 100;
const DELAY_BETWEEN_UNITS_MS = 1500;

const UNIT_GLOB = "*/unit-*.json";
const UNIT_FILENAME_RE = /^unit-(\d{2})-.+\.json$/i;
const VALID_LEVELS = ["A1", "A2", "B1", "B2"] as const;
type Level = (typeof VALID_LEVELS)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SpeakerKey = "A" | "B";

interface DialogueTurn {
  turn: number;
  speaker: SpeakerKey;
  line: string;
}

interface UnitFile {
  meta: {
    level: Level;
    unit: number;
    topic: string;
  };
  listening: {
    dialogue: DialogueTurn[];
  };
}

interface CliOptions {
  level: Level | null;
  unit: string | null; // e.g. "A1-01"
  dryRun: boolean;
}

interface UnitJob {
  filePath: string;
  level: Level;
  unitNumber: number;
  outputName: string; // e.g. "A1-01.mp3"
  outputPath: string;
}

interface RunSummary {
  generated: number;
  skipped: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const padUnit = (n: number): string => n.toString().padStart(2, "0");

const isLevel = (value: string): value is Level =>
  (VALID_LEVELS as readonly string[]).includes(value);

const fileExists = async (p: string): Promise<boolean> => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

/**
 * Strip markdown bold markers (**word**) so the TTS engine doesn't read the
 * asterisks aloud. Leaves the inner text intact.
 */
const stripMarkdown = (text: string): string => text.replace(/\*\*/g, "");

/**
 * Escape characters that would break SSML / XML parsing.
 */
const escapeSsml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Wrap a single dialogue line in a <speak> root and append a half-second
 * note-taking break. The break gives a natural pause between speakers.
 */
const buildSsml = (line: string): string => {
  const cleaned = stripMarkdown(line);
  const escaped = escapeSsml(cleaned);
  return `<speak>${escaped}<break time="${BREAK_AFTER_TURN_MS}ms"/></speak>`;
};

const voiceForSpeaker = (speaker: SpeakerKey): VoiceConfig =>
  speaker === "A" ? VOICE_SPEAKER_A : VOICE_SPEAKER_B;

const parseArgs = (argv: readonly string[]): CliOptions => {
  const opts: CliOptions = { level: null, unit: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--level") {
      const value = argv[i + 1];
      if (!value || !isLevel(value)) {
        throw new Error(
          `--level requires one of ${VALID_LEVELS.join(", ")} (got: ${value ?? "nothing"})`,
        );
      }
      opts.level = value;
      i++;
    } else if (arg === "--unit") {
      const value = argv[i + 1];
      if (!value || !/^[A-B][12]-\d{2}$/.test(value)) {
        throw new Error(
          `--unit requires an ID like "A1-01" (got: ${value ?? "nothing"})`,
        );
      }
      opts.unit = value;
      i++;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
};

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Find every unit JSON file, optionally filtered by --level or --unit. Identity
 * (level + unit number) comes from the file path itself, not the JSON contents,
 * so a malformed JSON file is recoverable as a per-unit failure rather than a
 * fatal during discovery.
 */
const findUnitJobs = async (opts: CliOptions): Promise<UnitJob[]> => {
  const files = await glob(UNIT_GLOB, { cwd: INPUT_ROOT, absolute: true });
  files.sort();

  const jobs: UnitJob[] = [];
  for (const filePath of files) {
    const level = path.basename(path.dirname(filePath));
    if (!isLevel(level)) {
      throw new Error(`Unexpected level directory "${level}" in ${filePath}`);
    }
    const match = UNIT_FILENAME_RE.exec(path.basename(filePath));
    if (!match) {
      throw new Error(`Unexpected unit filename: ${filePath}`);
    }
    const unitNumber = Number.parseInt(match[1], 10);
    const outputName = `${level}-${padUnit(unitNumber)}.mp3`;
    if (opts.level && opts.level !== level) continue;
    if (opts.unit && opts.unit !== `${level}-${padUnit(unitNumber)}`) continue;
    jobs.push({
      filePath,
      level,
      unitNumber,
      outputName,
      outputPath: path.join(OUTPUT_ROOT, outputName),
    });
  }
  return jobs;
};

// ---------------------------------------------------------------------------
// TTS synthesis
// ---------------------------------------------------------------------------

type TtsClient = InstanceType<typeof textToSpeech.TextToSpeechClient>;

/**
 * Synthesize a single dialogue turn via Google TTS and return the raw MP3
 * bytes. The line is wrapped in SSML with a trailing <break/> for pacing.
 */
const synthesizeTurn = async (
  client: TtsClient,
  line: string,
  speaker: SpeakerKey,
): Promise<Buffer> => {
  const ssml = buildSsml(line);
  const voice = voiceForSpeaker(speaker);
  const [response] = await client.synthesizeSpeech({
    input: { ssml },
    voice: { languageCode: LANGUAGE_CODE, name: voice.name },
    audioConfig: {
      audioEncoding: AUDIO_ENCODING,
      speakingRate: voice.speakingRate,
      pitch: voice.pitch,
    },
  });
  const audio = response.audioContent;
  if (!audio) {
    throw new Error("TTS returned empty audioContent");
  }
  if (typeof audio === "string") {
    return Buffer.from(audio, "base64");
  }
  return Buffer.from(audio);
};

/**
 * Process a single unit: synthesize each dialogue turn sequentially, then
 * concatenate the MP3 buffers into one file. MP3 frames concatenate cleanly
 * without re-encoding, which is why no audio post-processing lib is needed.
 */
const processUnit = async (
  client: TtsClient,
  job: UnitJob,
): Promise<void> => {
  const raw = await readFile(job.filePath, "utf8");
  const parsed = JSON.parse(raw) as UnitFile;
  const turns = parsed.listening.dialogue;

  console.log(`GEN ${job.outputName} — ${turns.length} turns`);

  const buffers: Buffer[] = [];
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const buffer = await synthesizeTurn(client, turn.line, turn.speaker);
    buffers.push(buffer);
    if (i < turns.length - 1) {
      await sleep(DELAY_BETWEEN_TURNS_MS);
    }
  }

  await mkdir(path.dirname(job.outputPath), { recursive: true });
  await writeFile(job.outputPath, Buffer.concat(buffers));
};

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

const printSetupBanner = (jobCount: number): void => {
  console.log("=".repeat(72));
  console.log("Eng Path — dialogue audio synthesis");
  console.log("=".repeat(72));
  console.log(
    `GOOGLE_APPLICATION_CREDENTIALS must point to a service-account JSON.`,
  );
  console.log(
    `  current value: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "(unset)"}`,
  );
  console.log(`Reading units from: ${INPUT_ROOT}`);
  console.log(`Writing MP3s to:    ${OUTPUT_ROOT}`);
  const fmt = (v: VoiceConfig): string =>
    `${v.name} (rate=${v.speakingRate}, pitch=${v.pitch})`;
  console.log(`Speaker A:          ${fmt(VOICE_SPEAKER_A)}`);
  console.log(`Speaker B:          ${fmt(VOICE_SPEAKER_B)}`);
  console.log(`Units found:        ${jobCount}`);
  console.log("=".repeat(72));
};

const runDryRun = async (jobs: UnitJob[]): Promise<void> => {
  console.log("(dry-run) The following units would be processed:");
  for (const job of jobs) {
    const exists = await fileExists(job.outputPath);
    const status = exists ? "SKIP (already exists)" : "GEN";
    console.log(`  ${status} ${job.outputName}`);
  }
};

const main = async (): Promise<void> => {
  const opts = parseArgs(process.argv.slice(2));
  const jobs = await findUnitJobs(opts);
  printSetupBanner(jobs.length);

  if (jobs.length === 0) {
    console.log("No units matched the given filters.");
    return;
  }

  if (opts.dryRun) {
    await runDryRun(jobs);
    return;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS is not set. Point it at your service-account JSON before running.",
    );
  }

  const client = new textToSpeech.TextToSpeechClient();
  const summary: RunSummary = { generated: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (await fileExists(job.outputPath)) {
      console.log(`SKIP ${job.outputName} (already exists)`);
      summary.skipped++;
      continue;
    }
    try {
      await processUnit(client, job);
      console.log(`OK ${job.outputName}`);
      summary.generated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`FAIL ${job.outputName}: ${message}`);
      summary.failed++;
    }
    if (i < jobs.length - 1) {
      await sleep(DELAY_BETWEEN_UNITS_MS);
    }
  }

  console.log("-".repeat(72));
  console.log(
    `Summary: generated=${summary.generated}, skipped=${summary.skipped}, failed=${summary.failed}`,
  );
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Fatal: ${message}`);
  process.exit(1);
});
