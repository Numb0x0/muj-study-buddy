import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Contact, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FacultyAvatar } from "@/components/faculty/FacultyAvatar";
import { FacultyContact } from "@/components/faculty/FacultyContact";
import { getFacultyMember, tryQuery } from "@/lib/queries";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ facultyId: string }>;
}

/** De-duplicated between generateMetadata and the page render. */
const loadFaculty = cache((id: string) => tryQuery(() => getFacultyMember(id), null));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { facultyId } = await params;
  const faculty = await loadFaculty(facultyId);
  if (!faculty) return { title: "Faculty member not found", robots: { index: false } };
  const description = faculty.bio ? truncate(faculty.bio, 155) : `${faculty.designation}, ${faculty.departmentLabel}.`;
  return {
    title: faculty.name,
    description,
    openGraph: { title: faculty.name, description, ...(faculty.imageUrl ? { images: [faculty.imageUrl] } : {}) },
  };
}

export default async function FacultyDetailPage({ params }: Props) {
  const { facultyId } = await params;
  const faculty = await loadFaculty(facultyId);
  if (!faculty) notFound();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Faculty", href: "/faculty" }, { label: faculty.name }]}
        eyebrow={
          <div className="flex items-center gap-4 normal-case tracking-normal">
            <FacultyAvatar name={faculty.name} imageUrl={faculty.imageUrl} size="lg" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-lavender">{faculty.departmentLabel}</span>
          </div>
        }
        title={faculty.name}
        description={faculty.designation}
        actions={
          <Button href="/faculty" variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
            All faculty
          </Button>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {faculty.isVerified ? (
            <Badge variant="success">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              Verified profile
            </Badge>
          ) : (
            <Badge variant="warning">Pending verification</Badge>
          )}
          {faculty.isFeatured && <Badge variant="primary">Featured</Badge>}
        </div>
      </PageHeader>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-text">About</h2>
              {faculty.bio ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-2 sm:text-base">{faculty.bio}</p>
              ) : (
                <p className="mt-3 text-sm text-muted">No biography has been added for this profile yet.</p>
              )}
            </Card>

            <Card>
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-text">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                Specializations
              </h2>
              {faculty.specializations.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Specializations">
                  {faculty.specializations.map((s) => (
                    <li key={s}>
                      <Badge variant="primary" className="px-3 py-1 text-sm">
                        {s}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">No specializations listed yet.</p>
              )}
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card glow={faculty.isVerified}>
              <h2 className="inline-flex items-center gap-2 text-base font-semibold text-text">
                <Contact className="h-4 w-4 text-primary" aria-hidden />
                Contact &amp; office
              </h2>
              <FacultyContact faculty={faculty} variant="detail" className="mt-3" />
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                {faculty.isVerified
                  ? "Details were confirmed by an administrator against an official source. Spotted a change?"
                  : "Contact details are shown only after an administrator verifies them."}{" "}
                <a href="/contact" className="text-lavender underline underline-offset-4">
                  Let us know
                </a>
                .
              </p>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
