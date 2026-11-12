import type { Metadata } from "next";
import { FileWarning, FilePlus2, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ContactPanel } from "@/components/community/ContactPanel";
import { loadSiteSettings } from "@/components/layout/site-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact", description: "Request or report a resource, or get in touch with the MUJ Study Buddy team." };

export default async function ContactPage() {
  const settings = await loadSiteSettings();
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" description="Request a missing resource, report a problem, or ask for something to be taken down." crumbs={[{ label: "Contact" }]} />
      <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_22rem]">
        <ContactPanel email={settings.contactEmail} />
        <aside className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-text">
              <FilePlus2 className="h-4 w-4 text-primary" aria-hidden />
              Requesting a resource
            </h2>
            <p className="mt-2 text-sm text-text-3">Mention the subject code, semester, unit and the kind of resource (notes, PYQ, lab manual…).</p>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-text">
              <FileWarning className="h-4 w-4 text-primary" aria-hidden />
              Reporting a problem
            </h2>
            <p className="mt-2 text-sm text-text-3">Include the page link and what&apos;s wrong — wrong subject, unreadable pages, outdated content or a copyright concern.</p>
          </Card>
          {settings.socialLinks.length > 0 && (
            <Card>
              <h2 className="flex items-center gap-2 font-semibold text-text">
                <Link2 className="h-4 w-4 text-primary" aria-hidden />
                Elsewhere
              </h2>
              <ul className="mt-2 space-y-1.5">
                {settings.socialLinks.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-lavender hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </Container>
    </>
  );
}
