/**
 * Shared primitives for all Firestore entities.
 *
 * Server code (Admin SDK) works with Firestore `Timestamp` objects. Anything
 * that crosses the server → client boundary (RSC props, JSON API responses)
 * must be serialised first, so every entity has a `*Doc` form (what is stored)
 * and a plain form where timestamps are ISO strings. The `Serialized<T>`
 * helper derives the latter.
 */
import type { Timestamp } from "firebase-admin/firestore";

export type { Timestamp };

/** ISO-8601 string. */
export type ISODate = string;

export interface Timestamps {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Replace Firestore Timestamps with ISO strings, recursively. */
export type Serialized<T> = T extends Timestamp
  ? ISODate
  : T extends Array<infer U>
    ? Array<Serialized<U>>
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

export interface PaginatedResult<T> {
  items: T[];
  /** Opaque cursor for the next page (document id of last item), null when exhausted. */
  nextCursor: string | null;
  /** True when at least one more page exists. */
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
