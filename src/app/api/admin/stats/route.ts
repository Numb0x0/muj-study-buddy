import { json, withAdmin } from "@/lib/auth/require-admin";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/constants/collections";
import { listAuditLogs } from "@/lib/queries/audit";
import { countNotesByStatus } from "@/lib/queries/notes";

export const dynamic = "force-dynamic";

const count = async (c: string) => (await adminDb().collection(c).count().get()).data().count;

export const GET = withAdmin(async () => {
  const [notes, subjects, programs, faculty, recentActivity] = await Promise.all([
    countNotesByStatus(),
    count(COLLECTIONS.subjects),
    count(COLLECTIONS.programs),
    count(COLLECTIONS.faculty),
    listAuditLogs({ limit: 10 }),
  ]);
  return json({ notes, subjects, programs, faculty, recentActivity });
});
