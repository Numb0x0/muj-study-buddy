import type { Serialized, Timestamp } from "./common";

export type AuditAction =
  | "note.create"
  | "note.update"
  | "note.replaceFile"
  | "note.publish"
  | "note.unpublish"
  | "note.archive"
  | "note.delete"
  | "catalog.create"
  | "catalog.update"
  | "catalog.delete"
  | "faculty.create"
  | "faculty.update"
  | "faculty.delete"
  | "community.create"
  | "community.update"
  | "community.delete"
  | "settings.update"
  | "auth.login"
  | "auth.logout";

export interface AuditLogDoc {
  id: string;
  actorUid: string;
  actorEmail: string | null;
  action: AuditAction;
  targetCollection: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
}
export type AuditLog = Serialized<AuditLogDoc>;
