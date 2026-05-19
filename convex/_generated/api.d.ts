/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_vocabulary from "../actions/vocabulary.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as mutations_grammar from "../mutations/grammar.js";
import type * as mutations_listening from "../mutations/listening.js";
import type * as mutations_reading from "../mutations/reading.js";
import type * as queries_grammar from "../queries/grammar.js";
import type * as queries_home from "../queries/home.js";
import type * as queries_listening from "../queries/listening.js";
import type * as queries_reading from "../queries/reading.js";
import type * as queries_unit from "../queries/unit.js";
import type * as queries_units from "../queries/units.js";
import type * as queries_user from "../queries/user.js";
import type * as queries_vocabulary from "../queries/vocabulary.js";
import type * as seed_clear from "../seed/clear.js";
import type * as seed_grammar from "../seed/grammar.js";
import type * as seed_listening from "../seed/listening.js";
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
  "actions/vocabulary": typeof actions_vocabulary;
  auth: typeof auth;
  http: typeof http;
  "mutations/grammar": typeof mutations_grammar;
  "mutations/listening": typeof mutations_listening;
  "mutations/reading": typeof mutations_reading;
  "queries/grammar": typeof queries_grammar;
  "queries/home": typeof queries_home;
  "queries/listening": typeof queries_listening;
  "queries/reading": typeof queries_reading;
  "queries/unit": typeof queries_unit;
  "queries/units": typeof queries_units;
  "queries/user": typeof queries_user;
  "queries/vocabulary": typeof queries_vocabulary;
  "seed/clear": typeof seed_clear;
  "seed/grammar": typeof seed_grammar;
  "seed/listening": typeof seed_listening;
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
