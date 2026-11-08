/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_flashcardExercises from "../actions/flashcardExercises.js";
import type * as actions_sentences from "../actions/sentences.js";
import type * as actions_speaking from "../actions/speaking.js";
import type * as actions_vocabulary from "../actions/vocabulary.js";
import type * as actions_writing from "../actions/writing.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as lib_prompts_speaking from "../lib/prompts/speaking.js";
import type * as lib_prompts_writing from "../lib/prompts/writing.js";
import type * as mutations_conjugaison from "../mutations/conjugaison.js";
import type * as mutations_flashcards from "../mutations/flashcards.js";
import type * as mutations_grammar from "../mutations/grammar.js";
import type * as mutations_listening from "../mutations/listening.js";
import type * as mutations_orthographe from "../mutations/orthographe.js";
import type * as mutations_reading from "../mutations/reading.js";
import type * as mutations_review from "../mutations/review.js";
import type * as mutations_sentences from "../mutations/sentences.js";
import type * as mutations_speaking from "../mutations/speaking.js";
import type * as mutations_writing from "../mutations/writing.js";
import type * as queries_conjugaison from "../queries/conjugaison.js";
import type * as queries_flashcards from "../queries/flashcards.js";
import type * as queries_grammar from "../queries/grammar.js";
import type * as queries_home from "../queries/home.js";
import type * as queries_listening from "../queries/listening.js";
import type * as queries_orthographe from "../queries/orthographe.js";
import type * as queries_reading from "../queries/reading.js";
import type * as queries_review from "../queries/review.js";
import type * as queries_sentences from "../queries/sentences.js";
import type * as queries_speaking from "../queries/speaking.js";
import type * as queries_unit from "../queries/unit.js";
import type * as queries_units from "../queries/units.js";
import type * as queries_user from "../queries/user.js";
import type * as queries_vocabulary from "../queries/vocabulary.js";
import type * as queries_writing from "../queries/writing.js";
import type * as seed_backfillLanguage from "../seed/backfillLanguage.js";
import type * as seed_clear from "../seed/clear.js";
import type * as seed_conjugaison from "../seed/conjugaison.js";
import type * as seed_grammar from "../seed/grammar.js";
import type * as seed_listening from "../seed/listening.js";
import type * as seed_orthographe from "../seed/orthographe.js";
import type * as seed_reading from "../seed/reading.js";
import type * as seed_review from "../seed/review.js";
import type * as seed_speaking from "../seed/speaking.js";
import type * as seed_storage from "../seed/storage.js";
import type * as seed_units from "../seed/units.js";
import type * as seed_vocabulary from "../seed/vocabulary.js";
import type * as seed_writing from "../seed/writing.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/flashcardExercises": typeof actions_flashcardExercises;
  "actions/sentences": typeof actions_sentences;
  "actions/speaking": typeof actions_speaking;
  "actions/vocabulary": typeof actions_vocabulary;
  "actions/writing": typeof actions_writing;
  auth: typeof auth;
  http: typeof http;
  "lib/prompts/speaking": typeof lib_prompts_speaking;
  "lib/prompts/writing": typeof lib_prompts_writing;
  "mutations/conjugaison": typeof mutations_conjugaison;
  "mutations/flashcards": typeof mutations_flashcards;
  "mutations/grammar": typeof mutations_grammar;
  "mutations/listening": typeof mutations_listening;
  "mutations/orthographe": typeof mutations_orthographe;
  "mutations/reading": typeof mutations_reading;
  "mutations/review": typeof mutations_review;
  "mutations/sentences": typeof mutations_sentences;
  "mutations/speaking": typeof mutations_speaking;
  "mutations/writing": typeof mutations_writing;
  "queries/conjugaison": typeof queries_conjugaison;
  "queries/flashcards": typeof queries_flashcards;
  "queries/grammar": typeof queries_grammar;
  "queries/home": typeof queries_home;
  "queries/listening": typeof queries_listening;
  "queries/orthographe": typeof queries_orthographe;
  "queries/reading": typeof queries_reading;
  "queries/review": typeof queries_review;
  "queries/sentences": typeof queries_sentences;
  "queries/speaking": typeof queries_speaking;
  "queries/unit": typeof queries_unit;
  "queries/units": typeof queries_units;
  "queries/user": typeof queries_user;
  "queries/vocabulary": typeof queries_vocabulary;
  "queries/writing": typeof queries_writing;
  "seed/backfillLanguage": typeof seed_backfillLanguage;
  "seed/clear": typeof seed_clear;
  "seed/conjugaison": typeof seed_conjugaison;
  "seed/grammar": typeof seed_grammar;
  "seed/listening": typeof seed_listening;
  "seed/orthographe": typeof seed_orthographe;
  "seed/reading": typeof seed_reading;
  "seed/review": typeof seed_review;
  "seed/speaking": typeof seed_speaking;
  "seed/storage": typeof seed_storage;
  "seed/units": typeof seed_units;
  "seed/vocabulary": typeof seed_vocabulary;
  "seed/writing": typeof seed_writing;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
