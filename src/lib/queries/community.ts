import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { docToData } from "@/lib/firebase/serialize";
import { COLLECTIONS } from "@/constants/collections";
import type { Announcement, AnnouncementDoc, CommunityItem, CommunityItemDoc } from "@/types";

export async function getCommunityItems(opts?: { includeInactive?: boolean }): Promise<CommunityItem[]> {
  let q: FirebaseFirestore.Query = adminDb().collection(COLLECTIONS.communityItems);
  if (!opts?.includeInactive) q = q.where("isActive", "==", true);
  const snap = await q.get();
  return snap.docs
    .map((d) => docToData<CommunityItemDoc>(d)!)
    .sort((a, b) => a.order - b.order || b.createdAt.localeCompare(a.createdAt));
}

export async function getAnnouncements(opts?: { includeInactive?: boolean; limit?: number }): Promise<Announcement[]> {
  let q: FirebaseFirestore.Query = adminDb().collection(COLLECTIONS.announcements);
  if (!opts?.includeInactive) q = q.where("isActive", "==", true);
  const snap = await q.get();
  const items = snap.docs
    .map((d) => docToData<AnnouncementDoc>(d)!)
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt.localeCompare(a.createdAt));
  return opts?.limit ? items.slice(0, opts.limit) : items;
}
