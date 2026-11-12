import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { docToData } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import type { Faculty, FacultyDoc } from "@/types";

const col = () => adminDb().collection(COLLECTIONS.faculty);

const sortFaculty = (a: Faculty, b: Faculty) => a.order - b.order || a.name.localeCompare(b.name);

/**
 * Public view of a profile: contact fields are removed unless an admin has
 * verified them, so unverified numbers/emails never reach the browser (not even
 * in the serialized props of a client component).
 */
export function toPublicFaculty(f: Faculty): Faculty {
  return f.isVerified ? f : { ...f, email: null, phone: null, officeLocation: null, profileUrl: null };
}

interface FacultyOpts {
  includeInactive?: boolean;
  departmentId?: string;
  /** Admin views only: return unredacted records. */
  raw?: boolean;
}

export async function getFacultyList(opts?: FacultyOpts): Promise<Faculty[]> {
  let q: FirebaseFirestore.Query = col();
  if (!opts?.includeInactive) q = q.where("isActive", "==", true);
  if (opts?.departmentId) q = q.where("departmentId", "==", opts.departmentId);
  const snap = await q.get();
  const list = snap.docs.map((d) => docToData<FacultyDoc>(d)!).sort(sortFaculty);
  return opts?.raw ? list : list.map(toPublicFaculty);
}

/** Homepage strip: featured + active, falling back to the first few active. */
export async function getFeaturedFaculty(limit = 3): Promise<Faculty[]> {
  const all = await getFacultyList();
  const featured = all.filter((f) => f.isFeatured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getFacultyMember(id: string, opts?: Pick<FacultyOpts, "includeInactive" | "raw">): Promise<Faculty | null> {
  const snap = await col().doc(id).get();
  const f = docToData<FacultyDoc>(snap);
  if (!f) return null;
  if (!opts?.includeInactive && !f.isActive) return null;
  return opts?.raw ? f : toPublicFaculty(f);
}
