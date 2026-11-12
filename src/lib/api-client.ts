/**
 * Typed fetch wrapper for the admin UI (browser side).
 *
 * Every helper mirrors one row of docs/API.md. Non-2xx responses are turned
 * into an `ApiClientError` carrying the server's `{ error, code, details }`.
 * Nothing here imports firebase-admin; it is safe for client components.
 */
import type { z } from "zod";
import type {
  AdminSession,
  Announcement,
  AuditLog,
  CommunityItem,
  Department,
  Faculty,
  Note,
  NoteSummary,
  PaginatedResult,
  Program,
  Semester,
  SiteSettings,
  Subject,
  University,
} from "@/types";
import type { CatalogKind, departmentInput, programInput, semesterInput, subjectInput, universityInput } from "@/lib/validations/catalog";
import type { createNoteInput, replaceFileInput, updateNoteInput } from "@/lib/validations/note";
import type { facultyInput } from "@/lib/validations/faculty";
import type { announcementInput, communityItemInput } from "@/lib/validations/community";
import type { siteSettingsInput } from "@/lib/validations/settings";
import { adminFileUrl } from "@/lib/storage/paths";
import { toQueryString } from "@/lib/utils";

// ── Errors ──────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  /** Zod issue list from a 400 VALIDATION response, keyed by field path. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (Array.isArray(this.details)) {
      for (const d of this.details as { path?: string; message?: string }[]) {
        if (d && typeof d.path === "string" && typeof d.message === "string" && !(d.path in out)) out[d.path] = d.message;
      }
    }
    return out;
  }
}

export function isApiClientError(err: unknown): err is ApiClientError {
  return err instanceof ApiClientError;
}

/** Human-readable message for any thrown value (used by toasts). */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof ApiClientError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

// ── Core request ────────────────────────────────────────────────

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body !== undefined ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
  } catch (err) {
    throw new ApiClientError(0, "Network error — check your connection and try again.", "NETWORK", err);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const parsed = (data ?? {}) as { error?: string; code?: string; details?: unknown };
    const message = parsed.error ?? (res.status === 401 ? "Not signed in." : res.status === 403 ? "Admin privileges required." : `Request failed (${res.status}).`);
    const error = new ApiClientError(res.status, message, parsed.code, parsed.details);
    // Session expired while using the dashboard: bounce to login.
    if (res.status === 401 && typeof window !== "undefined" && window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Hard navigation on purpose: this runs outside React (no router) and a full reload clears stale admin state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/admin/login?next=${next}`;
    }
    throw error;
  }
  return data as T;
}

export const apiGet = <T>(path: string, init?: RequestInit) => request<T>("GET", path, undefined, init);
export const apiPost = <T>(path: string, body?: unknown, init?: RequestInit) => request<T>("POST", path, body ?? {}, init);
export const apiPatch = <T>(path: string, body: unknown, init?: RequestInit) => request<T>("PATCH", path, body, init);
export const apiPut = <T>(path: string, body: unknown, init?: RequestInit) => request<T>("PUT", path, body, init);
export const apiDelete = <T>(path: string, init?: RequestInit) => request<T>("DELETE", path, undefined, init);

// ── Body / response types (derived from the Zod contracts) ──────

export type CreateNoteBody = z.input<typeof createNoteInput>;
export type UpdateNoteBody = z.input<typeof updateNoteInput>;
export type ReplaceFileBody = z.input<typeof replaceFileInput>;
export type FacultyBody = z.input<typeof facultyInput>;
export type CommunityItemBody = z.input<typeof communityItemInput>;
export type AnnouncementBody = z.input<typeof announcementInput>;
export type SiteSettingsBody = z.input<typeof siteSettingsInput>;

export interface CatalogItemMap {
  universities: University;
  departments: Department;
  programs: Program;
  semesters: Semester;
  subjects: Subject;
}
export interface CatalogBodyMap {
  universities: z.input<typeof universityInput>;
  departments: z.input<typeof departmentInput>;
  programs: z.input<typeof programInput>;
  semesters: z.input<typeof semesterInput>;
  subjects: z.input<typeof subjectInput>;
}

export interface PrepareUploadBody {
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
}
export interface PrepareUploadResponse {
  noteId: string;
  storagePath: string;
  maxUploadBytes: number;
  /** Bytes per PUT /api/admin/notes/upload request. */
  chunkBytes: number;
}

export interface AdminNoteListParams {
  status?: "draft" | "published" | "archived" | "all";
  q?: string;
  programId?: string;
  departmentId?: string;
  semesterId?: string;
  subjectId?: string;
  unit?: number;
  type?: string;
  tag?: string;
  since?: number;
  sort?: "newest" | "oldest" | "title";
  limit?: number;
  cursor?: string;
}

export interface AdminStats {
  notes: { draft: number; published: number; archived: number };
  subjects: number;
  programs: number;
  faculty: number;
  recentActivity: AuditLog[];
}

export interface NoteDetailResponse {
  note: Note;
  duplicates: NoteSummary[];
  audit: AuditLog[];
}

// ── Endpoint helpers ────────────────────────────────────────────

const enc = encodeURIComponent;

export const api = {
  auth: {
    session: () => apiGet<{ user: AdminSession | null }>("/api/auth/session"),
    login: (idToken: string) => apiPost<{ ok: true; user: AdminSession }>("/api/auth/session", { idToken }),
    logout: () => apiDelete<{ ok: true }>("/api/auth/session"),
  },

  adminNotes: {
    list: (params: AdminNoteListParams = {}) =>
      apiGet<PaginatedResult<Note>>(`/api/admin/notes${toQueryString(params as Record<string, string | number | undefined>)}`),
    prepare: (body: PrepareUploadBody) => apiPost<PrepareUploadResponse>("/api/admin/notes/prepare", body),
    /** Target of one chunk PUT (raw bytes body); see hooks/useAdminUpload.ts. */
    uploadUrl: (q: { path: string; index: number; size: number }) => `/api/admin/notes/upload${toQueryString({ path: q.path, index: q.index, size: q.size })}`,
    create: (body: CreateNoteBody) => apiPost<{ note: Note; duplicates: NoteSummary[] }>("/api/admin/notes", body),
    get: (id: string) => apiGet<NoteDetailResponse>(`/api/admin/notes/${enc(id)}`),
    update: (id: string, body: UpdateNoteBody) => apiPatch<{ note: Note }>(`/api/admin/notes/${enc(id)}`, body),
    remove: (id: string) => apiDelete<{ ok: true }>(`/api/admin/notes/${enc(id)}`),
    publish: (id: string) => apiPost<{ note: Note }>(`/api/admin/notes/${enc(id)}/publish`),
    unpublish: (id: string) => apiPost<{ note: Note }>(`/api/admin/notes/${enc(id)}/unpublish`),
    archive: (id: string) => apiPost<{ note: Note }>(`/api/admin/notes/${enc(id)}/archive`),
    replaceFile: (id: string, body: ReplaceFileBody) => apiPost<{ note: Note }>(`/api/admin/notes/${enc(id)}/replace-file`, body),
    /** URL of the admin preview stream (any status). */
    fileUrl: (id: string, opts?: { download?: boolean }) => adminFileUrl(id, opts),
  },

  catalog: {
    list: <K extends CatalogKind>(kind: K) => apiGet<{ items: CatalogItemMap[K][] }>(`/api/admin/catalog/${kind}`),
    create: <K extends CatalogKind>(kind: K, body: CatalogBodyMap[K] & { id?: string }) =>
      apiPost<{ item: CatalogItemMap[K] }>(`/api/admin/catalog/${kind}`, body),
    update: <K extends CatalogKind>(kind: K, id: string, body: Partial<CatalogBodyMap[K]>) =>
      apiPatch<{ item: CatalogItemMap[K] }>(`/api/admin/catalog/${kind}/${enc(id)}`, body),
    remove: (kind: CatalogKind, id: string) => apiDelete<{ ok: true }>(`/api/admin/catalog/${kind}/${enc(id)}`),
  },

  faculty: {
    list: () => apiGet<{ items: Faculty[] }>("/api/admin/faculty"),
    create: (body: FacultyBody) => apiPost<{ item: Faculty }>("/api/admin/faculty", body),
    get: (id: string) => apiGet<{ item: Faculty }>(`/api/admin/faculty/${enc(id)}`),
    update: (id: string, body: Partial<FacultyBody>) => apiPatch<{ item: Faculty }>(`/api/admin/faculty/${enc(id)}`, body),
    remove: (id: string) => apiDelete<{ ok: true }>(`/api/admin/faculty/${enc(id)}`),
  },

  community: {
    list: () => apiGet<{ items: CommunityItem[] }>("/api/admin/community"),
    create: (body: CommunityItemBody) => apiPost<{ item: CommunityItem }>("/api/admin/community", body),
    get: (id: string) => apiGet<{ item: CommunityItem }>(`/api/admin/community/${enc(id)}`),
    update: (id: string, body: Partial<CommunityItemBody>) => apiPatch<{ item: CommunityItem }>(`/api/admin/community/${enc(id)}`, body),
    remove: (id: string) => apiDelete<{ ok: true }>(`/api/admin/community/${enc(id)}`),
  },

  announcements: {
    list: () => apiGet<{ items: Announcement[] }>("/api/admin/announcements"),
    create: (body: AnnouncementBody) => apiPost<{ item: Announcement }>("/api/admin/announcements", body),
    get: (id: string) => apiGet<{ item: Announcement }>(`/api/admin/announcements/${enc(id)}`),
    update: (id: string, body: Partial<AnnouncementBody>) => apiPatch<{ item: Announcement }>(`/api/admin/announcements/${enc(id)}`, body),
    remove: (id: string) => apiDelete<{ ok: true }>(`/api/admin/announcements/${enc(id)}`),
  },

  settings: {
    get: () => apiGet<{ settings: SiteSettings }>("/api/admin/settings"),
    update: (body: SiteSettingsBody) => apiPut<{ settings: SiteSettings }>("/api/admin/settings", body),
  },

  stats: {
    get: () => apiGet<AdminStats>("/api/admin/stats"),
  },

  audit: {
    list: (params: { limit?: number; targetId?: string } = {}) => apiGet<{ items: AuditLog[] }>(`/api/admin/audit${toQueryString(params)}`),
  },
} as const;

export type Api = typeof api;
