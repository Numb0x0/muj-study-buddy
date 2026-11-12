import Link from "next/link";
import { ArrowRight, Mail, Phone, ShieldAlert, Users } from "lucide-react";
import { FacultyAvatar } from "@/components/faculty/FacultyAvatar";
import type { Faculty } from "@/types";

/** Wide glowing frame from the bottom of the reference design. */
export function FacultySection({ faculty }: { faculty: Faculty[] }) {
  return (
    <section className="container-page pt-14" aria-labelledby="faculty-title">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/50 bg-gradient-to-br from-surface/90 via-bg-2/90 to-surface/80 p-5 shadow-glow sm:p-6 lg:p-7">
        <div className="glow-blob absolute -right-20 -top-20 h-64 w-64 opacity-40" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-8">
          <div className="lg:border-r lg:border-border lg:pr-8">
            <h2 id="faculty-title" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-text sm:text-[1.75rem]">
              <Users className="h-8 w-8 text-lavender" strokeWidth={1.7} aria-hidden />
              Faculty Details
            </h2>
            <div className="ml-11 mt-1 h-0.5 w-24 rounded-full bg-gradient-to-r from-primary to-transparent" aria-hidden />
            <p className="mt-4 text-[15px] leading-relaxed text-text-3">
              Get in touch with the Department of Mechatronics Engineering faculty for academic guidance, projects and other related queries.
            </p>
          </div>

          {faculty.length === 0 ? (
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-border-2 p-6 sm:flex-row sm:items-center">
              <p className="text-sm text-text-3">Faculty profiles will appear here once added by an administrator.</p>
              <ViewAllLink className="sm:w-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_9.5rem]">
              {faculty.map((f) => (
                <FacultyMini key={f.id} faculty={f} />
              ))}
              <ViewAllLink />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FacultyMini({ faculty }: { faculty: Faculty }) {
  const showContact = faculty.isVerified && (faculty.phone || faculty.email);
  return (
    <article className="group relative rounded-2xl border border-border bg-bg-2/80 p-4 transition-colors hover:border-primary/50">
      <div className="flex items-start gap-3">
        <FacultyAvatar name={faculty.name} imageUrl={faculty.imageUrl} className="h-12 w-12" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text">
            <Link href={`/faculty/${faculty.id}`} className="after:absolute after:inset-0 after:content-['']">
              {faculty.name}
            </Link>
          </h3>
          <p className="text-sm text-text-3">{faculty.designation}</p>
          <p className="text-xs text-muted">{faculty.departmentLabel}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {showContact ? (
          <>
            {faculty.phone && (
              <a href={`tel:${faculty.phone.replace(/[^+\d]/g, "")}`} className="relative z-10 flex items-center gap-2.5 text-text-2 hover:text-lavender">
                <Phone className="h-4 w-4 text-text-3" aria-hidden />
                {faculty.phone}
              </a>
            )}
            {faculty.email && (
              <a href={`mailto:${faculty.email}`} className="relative z-10 flex min-w-0 items-center gap-2.5 text-text-2 hover:text-lavender">
                <Mail className="h-4 w-4 shrink-0 text-text-3" aria-hidden />
                <span className="truncate">{faculty.email}</span>
              </a>
            )}
          </>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            Contact details pending verification
          </p>
        )}
      </div>
    </article>
  );
}

function ViewAllLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/faculty"
      className={`group flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/5 px-4 py-5 text-center font-semibold text-lavender transition-all hover:bg-primary/15 hover:shadow-glow-sm ${className}`}
    >
      <Users className="h-6 w-6" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        View All Faculty
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
