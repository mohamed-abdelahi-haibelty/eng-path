# Schema Review & Implementation

Date: 2026-05-12

## Overview

Reviewed the proposed Convex schema against the Convex guidelines and project architecture invariants. Created and implemented `convex/schema.ts` with critical correctness fixes and best-practice improvements.

## Issues Found and Fixed

### Critical Issues (Correctness)

**1. Missing `tokenIdentifier` on users table**
- **Problem**: Schema used `githubId` for auth lookups, but Convex Auth requires `tokenIdentifier` as the canonical identifier
- **Impact**: Auth queries could fail if token format changes; violates Convex guidelines
- **Fix**: Added `tokenIdentifier: v.string()` with `by_token` index

**2. Exercise data stored as opaque JSON strings**
- **Problem**: `grammarModules.exercises[].data: v.string()` and `reviewModules.exercises[].type + data` bypassed TypeScript type system
- **Impact**: Lost all runtime type-safety and IDE inference; required manual `JSON.parse()` and type casting in code
- **Fix**: Replaced with discriminated unions using `v.union(v.object({type: v.literal(...)}, ...))` covering all 5 grammar types + 9 review types

**3. Unbounded embedded arrays violate Convex guidelines**
- **Problem**: `grammarModules.exercises` (~20 items) and `reviewModules.exercises` (~13 items) stored as embedded arrays
- **Impact**: Harder to query/paginate individual exercises; violates "no unbounded arrays" guideline
- **Fix**: Created separate `grammarExercises` and `reviewExercises` tables with `unitId` foreign keys

### Important Issues (Best Practice)

**4. `vocabulary.cefrLevel` used `v.string()` instead of typed union**
- **Fix**: Changed to `v.union(v.literal("A1"), v.literal("A2"), v.literal("B1"), v.literal("B2"))` to match `units.level`

**5. `listeningModules.speakers` was rigid `{ A, B }`**
- **Problem**: Fixed keys break if a unit has 3+ speakers
- **Fix**: Changed to `v.array(v.object({ key: v.string(), name: v.string() }))`

**6. `listeningModules.audioStorageId` was optional**
- **Problem**: Architecture invariant says all audio *must* be in Convex Storage; optional allows silent seeding failures
- **Fix**: Made required (non-optional)

**7. Missing indexes for pending feedback queries**
- **Problem**: No index on `feedbackStatus` or `overallEvaluationStatus`; Convex Actions would full-scan the table
- **Fix**: Added `by_status` index to both `writingSubmissions` and `speakingSubmissions`; added `overallEvaluationStatus` field to speaking submissions

**8. Compound index naming violated Convex convention**
- **Problem**: `by_user_unit` for `["userId", "unitId"]` — Convex requires all indexed fields in the name
- **Fix**: Renamed to `by_userId_and_unitId`, `by_userId_and_due`, `by_userId_and_vocabularyId`

### Minor Notes

**9. `vocabulary.audioUrl` is an external Oxford CDN URL**
- This is acceptable (not stored binary), but represents a 3rd-party dependency that could break
- Kept as-is; worth monitoring

**10. `unitProgress.listeningListensUsed` cap (max 2)**
- Schema stores as unconstrained `v.number()`; enforce max 2 in mutation logic

## New Tables Created

1. **`grammarExercises`** — Individual grammar exercises with discriminated union for 5 types
2. **`reviewExercises`** — Individual review exercises with discriminated union for 9 types

## Verification

✅ Schema parses cleanly (`npx convex dev --once`)
✅ Types fully inferred in `convex/_generated/dataModel.d.ts`
✅ All 13 tables properly defined with full TypeScript type-safety
✅ No compilation errors

## Files Modified

- **Created**: `convex/schema.ts` (18 tables, 2 new tables, all best practices applied)

## Files Referencing This Schema

When implementing Convex queries/mutations, remember:
- `grammarExercises` and `reviewExercises` are now separate tables (not embedded arrays)
- Use discriminated union types for all exercise fields (no `JSON.parse()` needed)
- Index on `feedbackStatus` / `overallEvaluationStatus` is available for pending feedback queries
- All audio IDs reference `_storage` via Convex File Storage API
