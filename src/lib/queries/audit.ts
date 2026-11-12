import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { docToData } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import type { AdminSession, AuditAction, AuditLog, AuditLogDoc } from "@/types";

export async function writeAuditLog(
  session: Pick<AdminSession, "uid" | "email">,
  action: AuditAction,
  targetCollection: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await adminDb().collection(COLLECTIONS.auditLogs).add({
      actorUid: session.uid,
      actorEmail: session.email,
      action,
      targetCollection,
      targetId,
      metadata,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Audit failures must never break the main operation.
    console.error("[audit] failed to write log", err);
  }
}

export async function listAuditLogs(opts?: { limit?: number; targetId?: string }): Promise<AuditLog[]> {
  let q: FirebaseFirestore.Query = adminDb().collection(COLLECTIONS.auditLogs);
  if (opts?.targetId) q = q.where("targetId", "==", opts.targetId);
  q = q.orderBy("createdAt", "desc").limit(opts?.limit ?? 50);
  const snap = await q.get();
  return snap.docs.map((d) => docToData<AuditLogDoc>(d)!);
}
