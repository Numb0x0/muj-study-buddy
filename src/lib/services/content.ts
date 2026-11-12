import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/constants/collections";
import { HttpError } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/queries/audit";
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/queries/settings";
import { facultyInput } from "@/lib/validations/faculty";
import { announcementInput, communityItemInput } from "@/lib/validations/community";
import { siteSettingsInput } from "@/lib/validations/settings";
import { SITE_SETTINGS_DOC_ID, type AdminSession } from "@/types";
import { makeCrud } from "./crud";
import { revalidatePublic } from "./revalidate";

export const facultyService = makeCrud({
  collection: COLLECTIONS.faculty,
  schema: facultyInput,
  audit: { create: "faculty.create", update: "faculty.update", delete: "faculty.delete" },
  label: (d) => String(d.name ?? ""),
  validate: async (d) => {
    const dept = await adminDb().collection(COLLECTIONS.departments).doc(String(d.departmentId)).get();
    if (!dept.exists) throw new HttpError(400, "The selected department doesn't exist.", "BAD_PARENT");
    if (dept.data()?.universityId !== d.universityId) throw new HttpError(400, "Department doesn't belong to the selected university.", "BAD_PARENT");
  },
});

export const communityService = makeCrud({
  collection: COLLECTIONS.communityItems,
  schema: communityItemInput,
  audit: { create: "community.create", update: "community.update", delete: "community.delete" },
  label: (d) => String(d.title ?? ""),
});

export const announcementService = makeCrud({
  collection: COLLECTIONS.announcements,
  schema: announcementInput,
  audit: { create: "community.create", update: "community.update", delete: "community.delete" },
  label: (d) => String(d.title ?? ""),
});

export async function updateSiteSettings(session: AdminSession, body: unknown) {
  const current = await getSiteSettings();
  const { createdAt: _c, updatedAt: _u, ...rest } = { ...DEFAULT_SITE_SETTINGS, ...current, ...((body ?? {}) as object) } as Record<string, unknown>;
  void _c;
  void _u;
  const data = siteSettingsInput.parse(rest);
  if (data.defaultProgramId) {
    const p = await adminDb().collection(COLLECTIONS.programs).doc(data.defaultProgramId).get();
    if (!p.exists) throw new HttpError(400, "Default program doesn't exist.", "BAD_PARENT");
  }
  await adminDb()
    .collection(COLLECTIONS.siteSettings)
    .doc(SITE_SETTINGS_DOC_ID)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await writeAuditLog(session, "settings.update", COLLECTIONS.siteSettings, SITE_SETTINGS_DOC_ID, { fields: Object.keys((body ?? {}) as object) });
  revalidatePublic();
  return getSiteSettings();
}
