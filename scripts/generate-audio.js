#!/usr/bin/env node
/**
 * Generates TTS audio for French listening dialogues using Google Cloud TTS (Studio voices).
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-audio.js
 *   node --env-file=.env.local scripts/generate-audio.js --level a1
 *   node --env-file=.env.local scripts/generate-audio.js --level a1 --unit 5
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS in .env.local pointing to a service account JSON.
 *
 * Voices: Speaker A → fr-FR-Studio-A (female), Speaker B → fr-FR-Studio-D (male)
 * Output: data/audio/fr/[LEVEL]-[NN].mp3   (e.g. A1-01.mp3)
 *
 * Studio voice quota: 100 000 chars/month free; $0.00016/char after.
 * Actual totals: A1≈24K  A2≈35K  B1≈51K  B2≈63K  (all levels ≈173K chars)
 * A1 alone ≈ 24 000 chars — safely within the free tier.
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const https  = require('https');
const crypto = require('crypto');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const VOICE_A      = 'fr-FR-Studio-A'; // female
const VOICE_B      = 'fr-FR-Studio-D'; // male
const VOICE_MAP    = { A: VOICE_A, B: VOICE_B };
const SAMPLE_RATE  = 24000;
const CONCURRENCY  = 3; // max simultaneous TTS API calls (free-tier safe)

const ROOT         = path.join(__dirname, '..');
const GENERATED    = path.join(ROOT, 'data', 'generated', 'fr');
const AUDIO_OUT    = path.join(ROOT, 'data', 'audio', 'fr');
const ALL_LEVELS   = ['a1', 'a2', 'b1', 'b2'];

// ─── CLI ARGS ────────────────────────────────────────────────────────────────

const args  = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const levelArg = getArg('--level');
const unitArg  = getArg('--unit');
const LEVELS   = levelArg ? [levelArg.toLowerCase()] : ALL_LEVELS;

// ─── AUTH (Service Account → OAuth2 access token) ────────────────────────────

function buildJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');
  const sigInput = `${header}.${payload}`;
  const sig = crypto.createSign('RSA-SHA256').update(sigInput).sign(sa.private_key, 'base64url');
  return `${sigInput}.${sig}`;
}

function httpRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(body ?? '');
    const req = https.request({ ...opts, headers: { 'Content-Length': bodyBuf.length, ...(opts.headers ?? {}) } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} ${opts.path}: ${raw.slice(0, 300)}`));
        } else {
          resolve(raw);
        }
      });
    });
    req.on('error', reject);
    if (bodyBuf.length) req.write(bodyBuf);
    req.end();
  });
}

async function getAccessToken(sa) {
  const jwt  = buildJWT(sa);
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`;
  const raw  = await httpRequest({
    hostname: 'oauth2.googleapis.com',
    path:     '/token',
    method:   'POST',
    headers:  { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, body);
  return JSON.parse(raw).access_token;
}

// ─── TTS ─────────────────────────────────────────────────────────────────────

function escXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function synthesize(token, text, voice, addPause) {
  const ssml = addPause
    ? `<speak>${escXml(text)}<break time="500ms"/></speak>`
    : `<speak>${escXml(text)}</speak>`;

  const payload = JSON.stringify({
    input:       { ssml },
    voice:       { languageCode: 'fr-FR', name: voice },
    audioConfig: { audioEncoding: 'MP3', sampleRateHertz: SAMPLE_RATE },
  });

  const raw = await httpRequest({
    hostname: 'texttospeech.googleapis.com',
    path:     '/v1/text:synthesize',
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }, payload);

  return Buffer.from(JSON.parse(raw).audioContent, 'base64');
}

// ─── CONCURRENCY LIMITER ─────────────────────────────────────────────────────

function makeSemaphore(limit) {
  let active = 0;
  const queue = [];
  return function run(fn) {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        if (active >= limit) { queue.push(attempt); return; }
        active++;
        Promise.resolve().then(fn).then(
          (v) => { active--; if (queue.length) queue.shift()(); resolve(v); },
          (e) => { active--; if (queue.length) queue.shift()(); reject(e); },
        );
      };
      attempt();
    });
  };
}

// ─── UNIT PROCESSING ─────────────────────────────────────────────────────────

async function processUnit(token, level, unitNum) {
  const pad       = String(unitNum).padStart(2, '0');
  const levelUp   = level.toUpperCase();
  const unitFile  = path.join(GENERATED, level, `unit-${pad}.json`);
  const outputMp3 = path.join(AUDIO_OUT, `${levelUp}-${pad}.mp3`);

  if (!fs.existsSync(unitFile)) {
    console.log(`[MISSING] ${level}/unit-${pad}.json`);
    return;
  }
  if (fs.existsSync(outputMp3)) {
    console.log(`[skip]    ${levelUp}-${pad}.mp3`);
    return;
  }

  const unit = JSON.parse(fs.readFileSync(unitFile, 'utf8'));
  const dialogue = unit?.listening?.dialogue;
  if (!Array.isArray(dialogue) || dialogue.length === 0) {
    console.warn(`[WARN]    ${levelUp}-${pad}: no dialogue found, skipping`);
    return;
  }

  console.log(`[start]   ${levelUp}-${pad}  (${dialogue.length} turns)`);

  // Turns are sequential within a unit so the whole unit is one "slot" in the semaphore.
  const chunks = [];
  for (let i = 0; i < dialogue.length; i++) {
    const { speaker, line } = dialogue[i];
    const voice    = VOICE_MAP[speaker] ?? VOICE_A;
    const addPause = i < dialogue.length - 1;
    process.stdout.write(`\r  ${levelUp}-${pad}  turn ${i + 1}/${dialogue.length} …`);
    // eslint-disable-next-line no-await-in-loop
    chunks.push(await synthesize(token, line, voice, addPause));
  }
  process.stdout.write('\r' + ' '.repeat(40) + '\r'); // clear the turn line

  fs.writeFileSync(outputMp3, Buffer.concat(chunks));
  console.log(`[done]    ${outputMp3}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS is not set.');
    console.error('Run with: node --env-file=.env.local scripts/generate-audio.js');
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(path.resolve(ROOT, credPath), 'utf8'));
  console.log(`Authenticating as ${sa.client_email} …`);
  const token = await getAccessToken(sa);
  console.log('Access token acquired.\n');

  fs.mkdirSync(AUDIO_OUT, { recursive: true });

  const run = makeSemaphore(CONCURRENCY); // limits concurrent units, not individual turns

  // Build job list
  const jobs = [];
  for (const level of LEVELS) {
    const dir = path.join(GENERATED, level);
    if (!fs.existsSync(dir)) { console.warn(`[WARN] No directory for level "${level}"`); continue; }

    const files = fs.readdirSync(dir)
      .filter(f => /^unit-\d+\.json$/.test(f))
      .sort();

    for (const file of files) {
      const unitNum = parseInt(file.match(/unit-(\d+)\.json/)[1], 10);
      if (unitArg && parseInt(unitArg, 10) !== unitNum) continue;
      jobs.push({ level, unitNum });
    }
  }

  if (jobs.length === 0) {
    console.log('Nothing to do — all audio files already exist.');
    return;
  }

  console.log(`Processing ${jobs.length} unit(s) with concurrency=${CONCURRENCY}…\n`);

  // Each unit acquires one semaphore slot for its entire duration.
  // Turns inside a unit are sequential, so we get exactly CONCURRENCY concurrent API calls.
  await Promise.all(jobs.map(({ level, unitNum }) =>
    run(() => processUnit(token, level, unitNum)).catch(err => {
      const pad = String(unitNum).padStart(2, '0');
      console.error(`[ERROR]   ${level.toUpperCase()}-${pad}: ${err.message}`);
    })
  ));

  console.log('\nAll done!');
}

main().catch(err => { console.error(err); process.exit(1); });
