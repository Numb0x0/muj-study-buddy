import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { docToData } from "@/lib/firebase/serialize";
import { HttpError } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/queries/audit";
import type { AdminSession, AuditAction } from "@/types";
import { revalidatePublic } from "./revalidate";

type Data = Record<string, unknown>;

/**
 * Generic admin CRUD for simple collections (faculty, community items,
 * announcements). Validates the merged document against the full schema on
 * every write so partial updates can't produce invalid records.
 */
export function makeCrud<S extends z.ZodType<Data>>(opts: {
  collection: string;
  schema: S;
  audit: { create: AuditAction; update: AuditAction; delete: AuditAction };
  label: (d: Data) => string;
  /** Optional cross-reference validation (e.g. department exists). */
  validate?: (d: Data) => Promise<void>;
}) {
  const col = () => adminDb().collection(opts.collection);
  const strip = (d: Data) => {
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = d;
    void _i;
    void _c;
    void _u;
    return rest;
  };

  return {
    async list() {
      const snap = await col().get();
      return snap.docs
        .map((d) => docToData<{ id: string } & Data>(d)!)
        .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    },
    async get(id: string) {
      const item = docToData<{ id: string } & Data>(await col().doc(id).get());
      if (!item) throw new HttpError(404, "Not found.", "NOT_FOUND");
      return item;
    },
    async create(session: AdminSession, body: unknown) {
      const data = opts.schema.parse(strip((body ?? {}) as Data));
      await opts.validate?.(data);
      const ref = col().doc();
      await ref.set({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      await writeAuditLog(session, opts.audit.create, opts.collection, ref.id, { title: opts.label(data) });
      revalidatePublic();
      return docToData<{ id: string } & Data>(await ref.get())!;
    },
    async update(session: AdminSession, id: string, body: unknown) {
      const ref = col().doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new HttpError(404, "Not found.", "NOT_FOUND");
      const merged = opts.schema.parse({ ...strip(snap.data() as Data), ...strip((body ?? {}) as Data) });
      await opts.validate?.(merged);
      await ref.update({ ...merged, updatedAt: FieldValue.serverTimestamp() });
      await writeAuditLog(session, opts.audit.update, opts.collection, id, { title: opts.label(merged) });
      revalidatePublic();
      return docToData<{ id: string } & Data>(await ref.get())!;
    },
    async remove(session: AdminSession, id: string) {
      const ref = col().doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new HttpError(404, "Not found.", "NOT_FOUND");
      await ref.delete();
      await writeAuditLog(session, opts.audit.delete, opts.collection, id, { title: opts.label(snap.data() as Data) });
      revalidatePublic();
    },
  };
}
