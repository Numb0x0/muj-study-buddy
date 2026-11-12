import Link from "next/link";
import { GraduationCap, Mail } from "lucide-react";
import { FOOTER_LINKS, SITE } from "@/constants/site";
import { Container } from "@/components/ui/Container";
import type { SiteSettings } from "@/types/settings";

const COLUMNS: { title: string; links: readonly { label: string; href: string }[] }[] = [
  { title: "Quick links", links: FOOTER_LINKS.quick },
  { title: "Resources", links: FOOTER_LINKS.resources },
  { title: "More", links: FOOTER_LINKS.more },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 border-t border-border bg-bg-2/60">
      <div className="divider-glow absolute inset-x-0 top-0" aria-hidden />
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
              <GraduationCap className="h-7 w-7 text-primary" aria-hidden />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-text">MUJ </span>
                <span className="text-gradient">Study Buddy</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-text-3">{settings.tagline}</p>
            <p className="mt-3 text-sm leading-relaxed text-text-3">
              A student-run academic resource hub for B.Tech Mechatronics and B.Tech Robotics &amp; AI at {SITE.university}. Free to browse, no account needed.
            </p>
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="mt-4 inline-flex items-center gap-2 text-sm text-lavender transition-colors hover:text-primary">
                <Mail className="h-4 w-4" aria-hidden />
                {settings.contactEmail}
              </a>
            )}
            {settings.socialLinks.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {settings.socialLinks.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-text-3 underline-offset-4 hover:text-text hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-2">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-text-3 transition-colors hover:text-text">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.siteName}. Not an official {SITE.universityShort} website. Resources are shared for educational purposes; copyright remains with their authors.
          </p>
          <ul className="flex flex-wrap gap-4">
            {FOOTER_LINKS.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-text">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin/login" className="transition-colors hover:text-text" title="Admin login">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
