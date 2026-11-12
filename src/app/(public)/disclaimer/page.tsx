import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Prose } from "@/components/layout/Prose";
import { SITE } from "@/constants/site";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader title="Disclaimer" crumbs={[{ label: "Disclaimer" }]} />
      <Container className="py-10 sm:py-14">
        <Prose>
          <h2>Not an official university website</h2>
          <p>
            {SITE.name} is an independent, student-run project. It is not affiliated with, endorsed by or operated by {SITE.university} or Manipal Education. University names are used only to describe who the resources are for.
          </p>
          <h2>Educational use only</h2>
          <p>Resources are shared to help students study. Copyright in notes, papers and manuals remains with their original authors and institutions. We do not claim ownership of third-party material.</p>
          <h2>Accuracy</h2>
          <p>
            We review uploads before publishing, but material may contain mistakes or be out of date. Always confirm syllabi, exam schedules, grading rules and deadlines with official university sources. Faculty contact details are shown only after an administrator marks them as verified.
          </p>
          <h2>Takedown requests</h2>
          <p>
            If you are the rights holder of any material and want it removed, contact us through the <Link href="/contact">contact page</Link> with the resource link. We will unpublish it promptly while the request is reviewed.
          </p>
        </Prose>
      </Container>
    </>
  );
}
