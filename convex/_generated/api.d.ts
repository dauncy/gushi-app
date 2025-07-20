/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_actions from "../auth/actions.js";
import type * as auth_http from "../auth/http.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_mutations from "../auth/mutations.js";
import type * as auth_queries from "../auth/queries.js";
import type * as auth_types from "../auth/types.js";
import type * as auth_utils from "../auth/utils.js";
import type * as http from "../http.js";
import type * as stories from "../stories.js";
import type * as subscriptions_actions from "../subscriptions/actions.js";
import type * as subscriptions_index from "../subscriptions/index.js";
import type * as subscriptions_utils from "../subscriptions/utils.js";
import type * as users_http from "../users/http.js";
import type * as users_index from "../users/index.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/actions": typeof auth_actions;
  "auth/http": typeof auth_http;
  "auth/index": typeof auth_index;
  "auth/mutations": typeof auth_mutations;
  "auth/queries": typeof auth_queries;
  "auth/types": typeof auth_types;
  "auth/utils": typeof auth_utils;
  http: typeof http;
  stories: typeof stories;
  "subscriptions/actions": typeof subscriptions_actions;
  "subscriptions/index": typeof subscriptions_index;
  "subscriptions/utils": typeof subscriptions_utils;
  "users/http": typeof users_http;
  "users/index": typeof users_index;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  actionCache: {
    crons: {
      purge: FunctionReference<
        "mutation",
        "internal",
        { expiresAt?: number },
        null
      >;
    };
    lib: {
      get: FunctionReference<
        "query",
        "internal",
        { args: any; name: string; ttl: number | null },
        { kind: "hit"; value: any } | { expiredEntry?: string; kind: "miss" }
      >;
      put: FunctionReference<
        "mutation",
        "internal",
        {
          args: any;
          expiredEntry?: string;
          name: string;
          ttl: number | null;
          value: any;
        },
        { cacheHit: boolean; deletedExpiredEntry: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { args: any; name: string },
        null
      >;
      removeAll: FunctionReference<
        "mutation",
        "internal",
        { batchSize?: number; before?: number; name?: string },
        null
      >;
    };
  };
};
