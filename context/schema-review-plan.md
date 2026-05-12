# Schema Review Plan

## Context

The user submitted a proposed Convex schema for Eng Path — a TOEFL-prep platform with 120 units (4 CEFR levels × 30 units), each containing Grammar, Reading, Listening, Writing, Speaking, and Review modules. No `convex/schema.ts` currently exists. The goal is to review the proposed schema against Convex's official guidelines and project architecture invariants, then create a corrected `convex/schema.ts`.

---

## Issues Found

### Critical

**1. Users table is missing `tokenIdentifier`**
The schema uses `githubId: v.string()` for auth lookup, but the Convex guidelines explicitly state `tokenIdentifier` (from `ctx.auth.getUserIdentity()`) is the canonical stable identifier for linking DB records to authenticated users. `githubId` alone may fail to find the right user if the token format changes.
- Add `tokenIdentifier: v.string()` and `.index("by_token", ["tokenIdentifier"])`.

**2. Exercise data stored as opaque JSON strings**
`grammarModules.exercises[].data: v.string()` and `reviewModules.exercises[].type: v.string()` + `data: v.string()` bypass Convex's type system entirely. The guidelines say to use discriminated unions (`v.union(v.object({type: v.literal(...)}, ...))`) when a field has multiple shapes. This loses all runtime type-safety and breaks TypeScript inference.
- Replace `data: v.string()` with a proper discriminated union covering all 5 grammar exercise types and all review exercise types.

**3. Unbounded embedded arrays should be separate tables**
The Convex guidelines say "do NOT store unbounded lists as an array field inside a document." With ~20 exercises per `grammarModules` doc and ~13 per `reviewModules` doc, at 120 units this is currently fine, but:
- `grammarModules.exercises` and `reviewModules.exercises` are the most impactful — moving them to child tables (`grammarExercises`, `reviewExercises`) makes them queryable and pageable.
- `speakingModules.questions`, `readingModules.questions`, `listeningModules.dialogue` are smaller (5–10 items) and can remain embedded.

### Important

**4. `vocabulary.cefrLevel` uses `v.string()` instead of a typed union**
`units.level` correctly uses `v.union(v.literal("A1"), ...)` but `vocabulary.cefrLevel` is a plain string. This inconsistency allows invalid values.
- Change to `v.union(v.literal("A1"), v.literal("A2"), v.literal("B1"), v.literal("B2"))`.

**5. `listeningModules.speakers` shape is rigid `{ A, B }`**
Fixed keys `A` and `B` break if a future unit adds a 3rd speaker. The content files use speaker names, not just `A`/`B`.
- Change to `v.array(v.object({ key: v.string(), name: v.string() }))`.

**6. `listeningModules.audioStorageId` is optional when it should be required**
Architecture invariant: all audio lives in Convex File Storage. Once a dialogue is seeded with audio, the storage ID is mandatory. Optional means the seed pipeline can produce an incomplete record silently.
- Make required (non-optional). Missing audio before seeding is a seeding pipeline concern, not a schema concern.

**7. Missing index for querying pending AI feedback**
`writingSubmissions.feedbackStatus` and `speakingSubmissions` have no index on status. Convex Actions that poll for `"pending"` items will be forced to scan the full table.
- Add `.index("by_status", ["feedbackStatus"])` to `writingSubmissions`.
- Add `overallEvaluationStatus` field + index to `speakingSubmissions` for the same reason.

**8. Index naming does not follow Convex convention**
Guidelines: index names must name all indexed fields. `by_user_unit` for `["userId", "unitId"]` should be `by_userId_and_unitId`. Etc.
- Rename all compound indexes to follow `by_<field1>_and_<field2>` convention.

### Minor / Nice-to-have

**9. `vocabulary.audioUrl` is an external Oxford CDN URL**
Architecture says audio bytes never live in the DB but are in Convex Storage. The vocabulary audio is a 3rd-party URL — acceptable, but it's an external dependency that can break. Noting this for awareness.

**10. `unitProgress.listeningListensUsed`**
This caps at 2 by product rules. The schema stores it as an unconstrained `v.number()`. This is unavoidable in Convex (no range validators), but should be enforced in the mutation layer.

**11. No `createdAt` on `unitProgress`**
`_creationTime` is auto-added, so this is fine as-is.

---

## Changes Summary

| Table | Change |
|---|---|
| `users` | Add `tokenIdentifier: v.string()`, add `by_token` index |
| `grammarModules` | Replace `data: v.string()` in exercises with a discriminated union type |
| `reviewModules` | Replace `type: v.string()` + `data: v.string()` with discriminated union |
| `grammarExercises` | New table — move `grammarModules.exercises[]` here, add `by_unitId` index |
| `reviewExercises` | New table — move `reviewModules.exercises[]` here, add `by_unitId` index |
| `listeningModules` | Change `speakers` to array; make `audioStorageId` required |
| `vocabulary` | Change `cefrLevel` to typed union |
| `writingSubmissions` | Add `by_status` index on `feedbackStatus` |
| `speakingSubmissions` | Add `overallEvaluationStatus` field + `by_status` index |
| All compound indexes | Rename to `by_<field1>_and_<field2>` pattern |

---

## Critical Files

- **Create**: `convex/schema.ts` — does not exist yet; write the corrected schema here
- **Reference**: `convex/_generated/ai/guidelines.md` — Convex rules (already read)
- **Reference**: `context/architecture-context.md` — storage invariants (already read)

---

## Verification

1. Run `npx convex dev` — should parse and apply the schema without errors
2. Check `convex/_generated/dataModel.d.ts` — types should be fully inferred (no `any`)
3. Confirm TypeScript compiles: `npx tsc --noEmit`
4. Spot-check: `grammarExercises` and `reviewExercises` tables appear in the generated `TableNames` type
