This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Curriculum: dialogue audio synthesis

The script at [scripts/curriculum-generator/synthesize-dialogues.ts](scripts/curriculum-generator/synthesize-dialogues.ts)
converts each unit's listening dialogue into a single MP3 using Google Cloud
Text-to-Speech (Studio voices). It runs offline, before deployment — the
generated MP3s are uploaded separately to Convex File Storage.

### 1. Install dependencies

Already in `devDependencies`. If you cloned fresh:

```bash
npm install
```

### 2. Configure Google Cloud credentials

1. In the Google Cloud Console, create a project and enable the **Cloud
   Text-to-Speech API**.
2. Create a service account with the **Cloud Text-to-Speech User** role and
   download its JSON key.
3. Drop the key at `.gcp/eng-path-tts.json` (the directory is gitignored).
4. `.env.local` already contains:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./.gcp/eng-path-tts.json
   ```
   — the npm script picks this up automatically via `tsx --env-file`.

The Studio voices `en-US-Studio-O` (Speaker A, female) and `en-US-Studio-Q`
(Speaker B, male) are in the free tier (1M characters/month).

### 3. Run the script

```bash
# Generate every missing unit (sequential, polite to the API)
npm run synthesize:dialogues

# Process only one CEFR level
npm run synthesize:dialogues -- --level A1

# Process exactly one unit (useful for voice validation)
npm run synthesize:dialogues -- --unit A1-01

# Print what would be generated, without calling the API
npm run synthesize:dialogues -- --dry-run
```

The run is resumable: if `data/curriculum/generated/audio/dialogues/{LEVEL}-{NN}.mp3`
already exists for a unit, the script logs `SKIP` and moves on. Failures are
logged per unit and the batch keeps going.

### 4. Validate the output

```bash
ls -lh data/curriculum/generated/audio/dialogues/ | head
afplay data/curriculum/generated/audio/dialogues/A1-01.mp3   # macOS
```

Each MP3 should be under 5 MB and 1–5 minutes long.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
