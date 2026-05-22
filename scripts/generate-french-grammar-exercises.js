#!/usr/bin/env node
/**
 * Generates 20 grammar exercises per French unit by calling the DeepSeek API.
 * Writes results into the unit JSON at `grammar.exercises`.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-french-grammar-exercises.js
 *   node --env-file=.env.local scripts/generate-french-grammar-exercises.js --level a1
 *   node --env-file=.env.local scripts/generate-french-grammar-exercises.js --level a2 --unit 5
 *   node --env-file=.env.local scripts/generate-french-grammar-exercises.js --force        # regenerate even if exercises already exist
 *   node --env-file=.env.local scripts/generate-french-grammar-exercises.js --concurrency 4
 *
 * Requires: DEEPSEEK_API_KEY in .env.local
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error(
    "Error: DEEPSEEK_API_KEY is not set. Run with: node --env-file=.env.local scripts/generate-french-grammar-exercises.js",
  );
  process.exit(1);
}

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const BASE_DIR = path.join(__dirname, "..");
const OUTPUT_BASE = path.join(BASE_DIR, "data", "generated", "fr");

const LEVELS = ["a1", "a2", "b1", "b2"];
const TYPE_DISTRIBUTION = {
  fill_in_the_blank: 5,
  multiple_choice: 5,
  sentence_transformation: 4,
  error_correction: 3,
  build_a_sentence: 3,
};
const TOTAL_EXERCISES = Object.values(TYPE_DISTRIBUTION).reduce(
  (a, b) => a + b,
  0,
);
const MAX_VOCAB_HINT = 30;

// ─── CLI ARGS ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function arg(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
}

const onlyLevel = arg("level")?.toLowerCase() ?? null;
const onlyUnit = arg("unit") ? Number(arg("unit")) : null;
const force = flag("force");
const concurrency = Math.max(1, Number(arg("concurrency") ?? "3"));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pad(n, w) {
  return String(n).padStart(w, "0");
}

function sanitizeJson(str) {
  let out = "";
  let inStr = false;
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (inStr) {
      if (ch === "\\") {
        const next = str[i + 1];
        if (next !== undefined && '"\\/bfnrtuv'.includes(next)) {
          out += ch + next;
          i += 2;
        } else {
          out += "\\\\";
          i++;
        }
      } else if (ch === '"') {
        inStr = false;
        out += ch;
        i++;
      } else if (ch === "\n") {
        out += "\\n";
        i++;
      } else if (ch === "\r") {
        out += "\\r";
        i++;
      } else if (ch === "\t") {
        out += "\\t";
        i++;
      } else if (ch.charCodeAt(0) < 0x20) {
        i++;
      } else {
        out += ch;
        i++;
      }
    } else {
      if (ch === '"') inStr = true;
      out += ch;
      i++;
    }
  }
  return out;
}

// ─── PROMPT ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un concepteur expert de curriculum de français langue étrangère, spécialisé dans la préparation aux examens DELF/DALF. Tu produis des exercices de grammaire précis, naturels et calibrés au niveau CECR demandé. Tu réponds toujours par du JSON valide uniquement — aucun markdown, aucun bloc de code, aucun texte d'introduction. La structure JSON doit correspondre exactement au schéma demandé.`;

function buildUserPrompt({ level, topic, grammarPoint, examples, vocab }) {
  const vocabList = (vocab ?? [])
    .slice(0, MAX_VOCAB_HINT)
    .map((w) => `"${w}"`)
    .join(", ");

  return `Génère ${TOTAL_EXERCISES} exercices de grammaire en français pour une unité d'apprentissage.

CONTEXTE :
- Niveau CECR : ${level}
- Sujet de l'unité : ${topic}
- Point de grammaire ciblé : ${grammarPoint}
- Exemples du module : ${(examples ?? []).map((e) => `« ${e} »`).join(" ; ")}
${vocabList ? `- Vocabulaire de l'unité à privilégier dans les phrases : ${vocabList}` : ""}

EXIGENCES :
1. Tous les exercices portent sur le point de grammaire ciblé ci-dessus — pas un autre.
2. Les phrases reflètent le sujet de l'unité et utilisent le vocabulaire de l'unité quand c'est possible.
3. La difficulté est calibrée pour un apprenant de niveau ${level} (pas plus haut, pas plus bas).
4. Les explications sont en français, claires et concises (1 à 2 phrases). Elles expliquent la règle appliquée.
5. Les ids sont "G1" à "G${TOTAL_EXERCISES}" dans l'ordre.

RÉPARTITION OBLIGATOIRE DES TYPES :
- 5 exercices "fill_in_the_blank"
- 5 exercices "multiple_choice"
- 4 exercices "sentence_transformation"
- 3 exercices "error_correction"
- 3 exercices "build_a_sentence"

SCHÉMA STRICT (chaque exercice = un objet avec id, instruction, exercise) :

[
  {
    "id": "G1",
    "instruction": "Complétez la phrase avec le verbe entre parenthèses au temps correct.",
    "exercise": {
      "type": "fill_in_the_blank",
      "sentence": "Je _____ (parler) avec mes amis tous les jours.",
      "answer": "parle",
      "explanation": "Le verbe « parler » est régulier en -er, et la première personne du singulier au présent prend la terminaison -e."
    }
  },
  {
    "id": "G6",
    "instruction": "Choisissez la bonne conjugaison.",
    "exercise": {
      "type": "multiple_choice",
      "sentence": "Nous _____ au parc le dimanche.",
      "options": {
        "a": "allons",
        "b": "allez",
        "c": "vont",
        "d": "vais"
      },
      "correct": "a",
      "explanation": "Avec « nous », le verbe « aller » se conjugue « allons » au présent."
    }
  },
  {
    "id": "G11",
    "instruction": "Reformulez la phrase en utilisant le pronom proposé.",
    "exercise": {
      "type": "sentence_transformation",
      "original": "Je mange une pomme chaque matin.",
      "prompt": "Nous _____",
      "answer": "Nous mangeons une pomme chaque matin.",
      "explanation": "Avec « nous », le verbe « manger » prend « -eons » pour conserver la prononciation douce du « g »."
    }
  },
  {
    "id": "G15",
    "instruction": "Corrigez l'erreur dans la phrase.",
    "exercise": {
      "type": "error_correction",
      "incorrect": "Elle parlent français à la maison.",
      "correct": "Elle parle français à la maison.",
      "explanation": "Avec « elle » (3e personne du singulier), le verbe « parler » prend « -e » : « parle »."
    }
  },
  {
    "id": "G18",
    "instruction": "Remettez les mots dans l'ordre pour former une phrase correcte.",
    "exercise": {
      "type": "build_a_sentence",
      "scrambled": ["mes", "j'", "amis", "appelle", "soir", "le"],
      "answer": "J'appelle mes amis le soir.",
      "explanation": "Phrase au présent : sujet + verbe conjugué + complément d'objet + complément circonstanciel de temps."
    }
  }
]

RÈGLES SUPPLÉMENTAIRES :
- Pour "multiple_choice" : exactement 4 options ("a", "b", "c", "d"), un seul "correct".
- Pour "fill_in_the_blank" : la phrase contient un blanc « _____ » et "answer" est la forme exacte à insérer (uniquement le ou les mots à insérer, pas la phrase entière).
- Pour "sentence_transformation" : "prompt" est le début de la phrase à compléter (peut contenir « _____ »), "answer" est la phrase complète reformulée.
- Pour "error_correction" : "incorrect" contient une erreur unique liée au point de grammaire ; "correct" est la version corrigée complète.
- Pour "build_a_sentence" : "scrambled" est un tableau de mots mélangés ; "answer" est la phrase remontée correctement.

RÉPONDS UNIQUEMENT avec un tableau JSON de ${TOTAL_EXERCISES} objets, dans l'ordre des types listés ci-dessus (5 fill_in_the_blank, puis 5 multiple_choice, puis 4 sentence_transformation, puis 3 error_correction, puis 3 build_a_sentence). Aucun préambule, aucun markdown.`;
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

function isString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function validateExercise(ex) {
  if (!ex || typeof ex !== "object") return false;
  if (!isString(ex.id) || !isString(ex.instruction)) return false;
  const e = ex.exercise;
  if (!e || typeof e !== "object") return false;
  switch (e.type) {
    case "fill_in_the_blank":
      return isString(e.sentence) && isString(e.answer) && isString(e.explanation);
    case "multiple_choice":
      return (
        e.options &&
        isString(e.options.a) &&
        isString(e.options.b) &&
        isString(e.options.c) &&
        isString(e.options.d) &&
        isString(e.correct) &&
        ["a", "b", "c", "d"].includes(e.correct) &&
        isString(e.explanation)
      );
    case "sentence_transformation":
      return isString(e.original) && isString(e.answer) && isString(e.explanation);
    case "error_correction":
      return isString(e.incorrect) && isString(e.correct) && isString(e.explanation);
    case "build_a_sentence":
      return (
        Array.isArray(e.scrambled) &&
        e.scrambled.length >= 4 &&
        e.scrambled.every(isString) &&
        isString(e.answer) &&
        isString(e.explanation)
      );
    default:
      return false;
  }
}

function validateExercises(arr) {
  if (!Array.isArray(arr) || arr.length !== TOTAL_EXERCISES) return false;
  if (!arr.every(validateExercise)) return false;
  const counts = {};
  for (const ex of arr) {
    counts[ex.exercise.type] = (counts[ex.exercise.type] ?? 0) + 1;
  }
  // Allow slight drift from the exact distribution as long as all 5 types appear and total = 20.
  if (Object.keys(TYPE_DISTRIBUTION).some((t) => !counts[t])) return false;
  return true;
}

function normalizeIds(arr) {
  return arr.map((ex, i) => ({ ...ex, id: `G${i + 1}` }));
}

// Strip unknown fields per discriminated union so Convex schema accepts them.
function cleanExercise(ex) {
  const e = ex.exercise;
  let cleaned;
  switch (e.type) {
    case "fill_in_the_blank":
      cleaned = {
        type: "fill_in_the_blank",
        sentence: e.sentence,
        answer: e.answer,
        explanation: e.explanation,
      };
      if (Array.isArray(e.options) && e.options.length > 0) {
        cleaned.options = e.options;
      }
      break;
    case "multiple_choice":
      cleaned = {
        type: "multiple_choice",
        options: {
          a: e.options.a,
          b: e.options.b,
          c: e.options.c,
          d: e.options.d,
        },
        correct: e.correct,
        explanation: e.explanation,
      };
      if (isString(e.sentence)) cleaned.sentence = e.sentence;
      break;
    case "sentence_transformation":
      cleaned = {
        type: "sentence_transformation",
        original: e.original,
        answer: e.answer,
        explanation: e.explanation,
      };
      if (isString(e.prompt)) cleaned.prompt = e.prompt;
      break;
    case "error_correction":
      cleaned = {
        type: "error_correction",
        incorrect: e.incorrect,
        correct: e.correct,
        explanation: e.explanation,
      };
      break;
    case "build_a_sentence":
      cleaned = {
        type: "build_a_sentence",
        scrambled: e.scrambled,
        answer: e.answer,
        explanation: e.explanation,
      };
      break;
  }
  return {
    id: ex.id,
    instruction: ex.instruction,
    exercise: cleaned,
  };
}

// ─── DEEPSEEK CALL ───────────────────────────────────────────────────────────

async function apiCall(userPrompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const clean = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    parsed = JSON.parse(sanitizeJson(clean));
  }
  // The model may wrap the array in { exercises: [...] } when response_format=json_object.
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.exercises)) return parsed.exercises;
  if (parsed && Array.isArray(parsed.grammar_exercises)) return parsed.grammar_exercises;
  if (parsed && Array.isArray(parsed.data)) return parsed.data;
  throw new Error("Response is not an exercise array");
}

async function callWithRetry(prompt, label) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await apiCall(prompt);
      if (validateExercises(result)) {
        return normalizeIds(result).map(cleanExercise);
      }
      lastErr = new Error("Validation failed");
      console.warn(
        `    ⚠ ${label}: invalid response on attempt ${attempt} (got ${
          Array.isArray(result) ? result.length : "non-array"
        } items)`,
      );
    } catch (e) {
      lastErr = e;
      console.warn(`    ⚠ ${label}: API error on attempt ${attempt}: ${e.message}`);
    }
    if (attempt < 3) await sleep(1500 * attempt);
  }
  throw lastErr ?? new Error("Unknown failure");
}

// ─── DRIVER ──────────────────────────────────────────────────────────────────

function collectVocab(unitJson) {
  const v = unitJson?.vocabulary?.vocabulary;
  if (!Array.isArray(v)) return [];
  return v.map((w) => w.word).filter(isString);
}

function unitFiles(level) {
  const dir = path.join(OUTPUT_BASE, level);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^unit-\d+\.json$/.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

function readUnit(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeUnit(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

async function processOne(file) {
  const unit = readUnit(file);
  const meta = unit.meta ?? {};
  const level = String(meta.level ?? "").toUpperCase();
  const unitNum = Number(meta.unit ?? 0);
  const grammarPoint = meta.grammar_point;
  const topic = meta.topic ?? "";

  if (!grammarPoint || !level || !unitNum) {
    console.warn(`  ⚠ ${path.basename(file)}: missing meta — skipped`);
    return { skipped: "missing-meta" };
  }

  unit.grammar ??= {};
  const current = Array.isArray(unit.grammar.exercises) ? unit.grammar.exercises : [];
  if (!force && current.length === TOTAL_EXERCISES) {
    return { skipped: "already-present" };
  }

  const prompt = buildUserPrompt({
    level,
    topic,
    grammarPoint,
    examples: unit.grammar.examples ?? [],
    vocab: collectVocab(unit),
  });

  const label = `${level} U${pad(unitNum, 2)}`;
  const exercises = await callWithRetry(prompt, label);

  unit.grammar.exercises = exercises;
  writeUnit(file, unit);
  return { generated: exercises.length };
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  let inFlight = 0;
  return new Promise((resolve, reject) => {
    const launch = () => {
      while (inFlight < limit && next < items.length) {
        const idx = next++;
        inFlight++;
        Promise.resolve()
          .then(() => worker(items[idx], idx))
          .then((r) => {
            results[idx] = r;
            inFlight--;
            if (next >= items.length && inFlight === 0) resolve(results);
            else launch();
          })
          .catch((err) => reject(err));
      }
    };
    launch();
  });
}

async function main() {
  const levels = onlyLevel ? [onlyLevel] : LEVELS;
  const targets = [];
  for (const lv of levels) {
    const files = unitFiles(lv);
    for (const f of files) {
      if (onlyUnit != null) {
        const m = f.match(/unit-(\d+)\.json$/);
        if (!m || Number(m[1]) !== onlyUnit) continue;
      }
      targets.push(f);
    }
  }

  if (targets.length === 0) {
    console.error("No matching unit files found.");
    process.exit(1);
  }

  console.log(
    `Generating grammar exercises for ${targets.length} unit${targets.length === 1 ? "" : "s"} ` +
      `(concurrency=${concurrency}, force=${force})\n`,
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  await runWithConcurrency(targets, concurrency, async (file) => {
    const name = path.relative(BASE_DIR, file);
    try {
      const result = await processOne(file);
      if (result.skipped) {
        skipped++;
        console.log(`  ◦ ${name}: ${result.skipped}`);
      } else {
        generated++;
        console.log(`  ✓ ${name}: ${result.generated} exercises`);
      }
    } catch (e) {
      failed++;
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  });

  console.log(
    `\nDone. generated=${generated}  skipped=${skipped}  failed=${failed}  total=${targets.length}`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
