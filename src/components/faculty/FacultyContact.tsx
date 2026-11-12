import { ExternalLink, Mail, MapPin, Phone, ShieldAlert } from "lucide-react";
import type { Faculty } from "@/types";
import { cn } from "@/lib/utils";

type ContactFields = Pick<Faculty, "email" | "phone" | "officeLocation" | "profileUrl" | "isVerified">;

interface Props {
  faculty: ContactFields;
  /** `card` is compact for the directory grid; `detail` adds labels. */
  variant?: "card" | "detail";
  className?: string;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Contact rows are only ever rendered when an administrator has marked the
 * profile as verified AND the value exists. Nothing here is invented.
 */
export function FacultyContact({ faculty, variant = "card", className }: Props) {
  const detail = variant === "detail";
  const rowCls = cn("flex items-start gap-2.5 text-sm", detail ? "py-2" : "py-1");
  const iconCls = "mt-0.5 h-4 w-4 shrink-0 text-primary";
  const linkCls = "relative z-10 min-w-0 break-words text-text-2 transition-colors hover:text-lavender focus-visible:text-lavender";

  if (!faculty.isVerified) {
    return (
      <p className={cn("flex items-start gap-2 text-sm text-muted", className)}>
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>Contact details pending verification.</span>
      </p>
    );
  }

  const rows: React.ReactNode[] = [];

  if (faculty.email) {
    rows.push(
      <li key="email" className={rowCls}>
        <Mail className={iconCls} aria-hidden />
        <span className="min-w-0">
          {detail && <span className="block text-xs text-muted">Email</span>}
          <a href={`mailto:${faculty.email}`} className={linkCls}>
            {faculty.email}
          </a>
        </span>
      </li>,
    );
  }
  if (faculty.phone) {
    rows.push(
      <li key="phone" className={rowCls}>
        <Phone className={iconCls} aria-hidden />
        <span className="min-w-0">
          {detail && <span className="block text-xs text-muted">Phone</span>}
          <a href={`tel:${faculty.phone.replace(/[^+\d]/g, "")}`} className={linkCls}>
            {faculty.phone}
          </a>
        </span>
      </li>,
    );
  }
  if (faculty.officeLocation) {
    rows.push(
      <li key="office" className={rowCls}>
        <MapPin className={iconCls} aria-hidden />
        <span className="min-w-0 text-text-2">
          {detail && <span className="block text-xs text-muted">Office</span>}
          {faculty.officeLocation}
        </span>
      </li>,
    );
  }
  if (faculty.profileUrl) {
    rows.push(
      <li key="profile" className={rowCls}>
        <ExternalLink className={iconCls} aria-hidden />
        <span className="min-w-0">
          {detail && <span className="block text-xs text-muted">Profile</span>}
          <a href={faculty.profileUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
            {detail ? faculty.profileUrl : safeHost(faculty.profileUrl)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      </li>,
    );
  }

  if (rows.length === 0) {
    return <p className={cn("text-sm text-muted", className)}>No contact details listed.</p>;
  }

  return (
    <ul className={cn(detail && "divide-y divide-border", className)} aria-label="Contact details">
      {rows}
    </ul>
  );
}
