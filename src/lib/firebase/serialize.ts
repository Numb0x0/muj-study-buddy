import { Timestamp, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { Serialized } from "@/types/common";

/** Recursively convert Firestore Timestamps to ISO strings so data can cross to the client. */
export function serialize<T>(value: T): Serialized<T> {
  if (value instanceof Timestamp) return value.toDate().toISOString() as Serialized<T>;
  if (value === null || value === undefined) return value as Serialized<T>;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as Serialized<T>;
  if (typeof value === "object") {
    // Firestore returns plain objects; preserve Date too.
    if (value instanceof Date) return value.toISOString() as Serialized<T>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serialize(v);
    return out as Serialized<T>;
  }
  return value as Serialized<T>;
}

/** Map a snapshot to `{ id, ...data }` with timestamps serialised. */
export function docToData<T extends { id: string }>(snap: DocumentSnapshot | QueryDocumentSnapshot): Serialized<T> | null {
  if (!snap.exists) return null;
  return serialize({ ...(snap.data() as Omit<T, "id">), id: snap.id } as T);
}

/** Like docToData but for raw (unserialised) use on the server. */
export function docToRaw<T extends { id: string }>(snap: DocumentSnapshot | QueryDocumentSnapshot): T | null {
  if (!snap.exists) return null;
  return { ...(snap.data() as Omit<T, "id">), id: snap.id } as T;
}
