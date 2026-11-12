import type { Metadata } from "next";
import { Megaphone, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AnnouncementList, COMMUNITY_SECTIONS, CommunityItemCard } from "@/components/community/CommunitySections";
import { SetupHint } from "@/components/programs/SetupHint";
import { getAnnouncements, getCommunityItems, tryQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Community", description: "Announcements, events, study groups and project collaboration for MUJ Mechatronics and Robotics & AI students." };

export default async function CommunityPage() {
  const [announcements, items] = await Promise.all([tryQuery(() => getAnnouncements(), []), tryQuery(() => getCommunityItems(), [])]);

  return (
    <>
      <PageHeader
        eyebrow="Robotics community"
        title="Learn, Build, Collaborate"
        description="Announcements, events, study groups and project calls curated by the administrators."
        crumbs={[{ label: "Community" }]}
        actions={
          <Button href="/contact" variant="outline" leftIcon={<MessageSquarePlus className="h-4 w-4" aria-hidden />}>
            List your group or event
          </Button>
        }
      >
        <p className="inline-flex items-center gap-2 text-sm text-text-3">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
          Everything here is reviewed by an administrator. Public posting isn&apos;t available yet.
        </p>
      </PageHeader>

      <Container className="space-y-12 py-10 sm:py-14">
        <section aria-labelledby="ann-title">
          <h2 id="ann-title" className="mb-4 flex items-center gap-2 text-xl font-bold text-text">
            <Megaphone className="h-5 w-5 text-primary" aria-hidden />
            Announcements
          </h2>
          <AnnouncementList items={announcements} />
        </section>

        {COMMUNITY_SECTIONS.map(({ type, title, empty, Icon }) => {
          const list = items.filter((i) => i.type === type);
          return (
            <section key={type} aria-labelledby={`c-${type}`}>
              <h2 id={`c-${type}`} className="mb-4 flex items-center gap-2 text-xl font-bold text-text">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                {title}
              </h2>
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border-2 p-5 text-sm text-text-3">{empty}</p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((i) => (
                    <li key={i.id}>
                      <CommunityItemCard item={i} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <section className="card-surface flex flex-col gap-3 border-dashed p-6 opacity-80 sm:flex-row sm:items-center sm:justify-between" aria-label="Coming soon">
          <div>
            <Badge variant="warning">Coming soon</Badge>
            <h2 className="mt-2 font-semibold text-text">Discussion forum &amp; moderated posting</h2>
            <p className="mt-1 text-sm text-text-3">Student posting with moderation is planned for a later version. Until then, send listings through the contact page.</p>
          </div>
        </section>
        {announcements.length === 0 && items.length === 0 && <SetupHint />}
      </Container>
    </>
  );
}
