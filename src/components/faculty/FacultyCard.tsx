import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Faculty } from "@/types";
import { FacultyAvatar } from "./FacultyAvatar";
import { FacultyContact } from "./FacultyContact";

const MAX_SPECIALIZATIONS = 4;

export function FacultyCard({ faculty }: { faculty: Faculty }) {
  const extra = faculty.specializations.length - MAX_SPECIALIZATIONS;
  return (
    <article className="card-surface card-hover group relative flex h-full flex-col p-5 focus-within:border-primary/50">
      <div className="flex items-start gap-4">
        <FacultyAvatar name={faculty.name} imageUrl={faculty.imageUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-text">
            {/* Stretched link: the whole card is clickable, but nested contact links stay independent. */}
            <Link
              href={`/faculty/${faculty.id}`}
              className="after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none"
            >
              {faculty.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-text-2">{faculty.designation}</p>
          <p className="text-xs text-text-3">{faculty.departmentLabel}</p>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lavender"
          aria-hidden
        />
      </div>

      {(faculty.isVerified || faculty.specializations.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {faculty.isVerified && (
            <Badge variant="success">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              Verified
            </Badge>
          )}
          {faculty.specializations.slice(0, MAX_SPECIALIZATIONS).map((s) => (
            <Badge key={s} variant="primary">
              {s}
            </Badge>
          ))}
          {extra > 0 && <Badge variant="outline">+{extra} more</Badge>}
        </div>
      )}

      <div className="mt-auto border-t border-border pt-4">
        <FacultyContact faculty={faculty} className="mt-0" />
      </div>
    </article>
  );
}
