import { requireAdminPage } from "@/lib/auth/guard";
import type { Metadata } from "next";
import Link from "next/link";
import { Archive, BookOpen, CheckCircle2, Circle, FileClock, FilePlus2, FolderTree, GraduationCap, History, Send, Upload, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { auditHref, auditLabel, auditTarget, relativeTime } from "@/components/admin/format";
import { safeLoad } from "@/components/admin/server/safe-load";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { countNotesByStatus, EMPTY_CATALOG, getCatalogTree, getFacultyList, listAuditLogs } from "@/lib/queries";
import { usingEmulators } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdminPage();
  const [counts, catalog, faculty, audit] = await Promise.all([
    safeLoad(() => countNotesByStatus(), { draft: 0, published: 0, archived: 0 }),
    safeLoad(() => getCatalogTree({ includeInactive: true }), EMPTY_CATALOG),
    safeLoad(() => getFacultyList({ includeInactive: true, raw: true }), []),
    safeLoad(() => listAuditLogs({ limit: 12 }), []),
  ]);
  const errors = [counts, catalog, faculty, audit].map((r) => r.error).filter(Boolean);
  const c = counts.data;
  const t = catalog.data;

  const stats = [
    { label: "Drafts", value: c.draft, Icon: FileClock, href: "/admin/notes?status=draft", tone: "text-warning" },
    { label: "Published", value: c.published, Icon: Send, href: "/admin/notes?status=published", tone: "text-success" },
    { label: "Archived", value: c.archived, Icon: Archive, href: "/admin/notes?status=archived", tone: "text-text-3" },
    { label: "Programs", value: t.programs.length, Icon: GraduationCap, href: "/admin/catalog?tab=programs", tone: "text-lavender" },
    { label: "Subjects", value: t.subjects.length, Icon: BookOpen, href: "/admin/catalog?tab=subjects", tone: "text-lavender" },
    { label: "Faculty", value: faculty.data.length, Icon: Users, href: "/admin/faculty", tone: "text-lavender" },
  ];

  const checklist = [
    { done: !errors.length, label: "Firebase connected", hint: usingEmulators ? "Using the local emulator suite" : "Production Firebase project" },
    { done: t.programs.length > 0 && t.semesters.length > 0, label: "Catalogue seeded", hint: "Programs and semesters exist", href: "/admin/catalog" },
    { done: t.subjects.some((s) => !s.code.startsWith("PLACEHOLDER")), label: "Real subjects added", hint: "Replace the placeholder subjects with the official syllabus", href: "/admin/catalog?tab=subjects" },
    { done: c.published > 0, label: "First resource published", hint: "Upload a PDF and publish it", href: "/admin/notes/new" },
    { done: faculty.data.some((f) => f.isVerified), label: "Verified faculty profile", hint: "Add faculty from official sources", href: "/admin/faculty" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of resources, catalogue and recent activity."
        actions={
          <Button href="/admin/notes/new" leftIcon={<Upload className="h-4 w-4" aria-hidden />}>
            Upload PDF
          </Button>
        }
      />
      {errors.length > 0 && (
        <Alert variant="danger" title="Some data couldn't be loaded" className="mb-6">
          {errors[0]}
        </Alert>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, Icon, href, tone }) => (
          <li key={label}>
            <Link href={href} className="card-surface card-hover block p-4">
              <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
              <p className="mt-3 text-2xl font-bold tabular-nums text-text">{value}</p>
              <p className="text-sm text-text-3">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-text">
            <History className="h-4 w-4 text-primary" aria-hidden /> Recent activity
          </h2>
          {audit.data.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No activity yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-border">
              {audit.data.map((a) => {
                const href = auditHref(a);
                const target = auditTarget(a);
                return (
                  <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                    <span className="min-w-0 text-text-2">
                      <span className="font-medium text-text">{auditLabel(a.action)}</span>
                      {target && (
                        <>
                          {" · "}
                          {href ? (
                            <Link href={href} className="text-lavender underline underline-offset-2">
                              {target}
                            </Link>
                          ) : (
                            target
                          )}
                        </>
                      )}
                      <span className="block text-xs text-muted">{a.actorEmail}</span>
                    </span>
                    <time dateTime={a.createdAt} className="shrink-0 text-xs text-text-3">
                      {relativeTime(a.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-text">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <Button href="/admin/notes/new" variant="secondary" leftIcon={<FilePlus2 className="h-4 w-4" aria-hidden />} className="justify-start">
                Upload a PDF
              </Button>
              <Button href="/admin/notes?status=draft" variant="secondary" leftIcon={<FileClock className="h-4 w-4" aria-hidden />} className="justify-start">
                Review drafts
              </Button>
              <Button href="/admin/notes?status=published" variant="secondary" leftIcon={<Send className="h-4 w-4" aria-hidden />} className="justify-start">
                Manage published
              </Button>
              <Button href="/admin/catalog?tab=subjects" variant="secondary" leftIcon={<FolderTree className="h-4 w-4" aria-hidden />} className="justify-start">
                Add a subject
              </Button>
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold text-text">Setup checklist</h2>
            <ul className="mt-4 space-y-3">
              {checklist.map((i) => (
                <li key={i.label} className="flex gap-3 text-sm">
                  {i.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Done" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label="Not done" />}
                  <span>
                    {i.href && !i.done ? (
                      <Link href={i.href} className="font-medium text-text hover:text-lavender">
                        {i.label}
                      </Link>
                    ) : (
                      <span className={i.done ? "text-text-2" : "font-medium text-text"}>{i.label}</span>
                    )}
                    <span className="block text-xs text-text-3">{i.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
