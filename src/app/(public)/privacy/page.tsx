import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Prose } from "@/components/layout/Prose";
import { SITE } from "@/constants/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy Policy" description="What we collect (very little) and why." crumbs={[{ label: "Privacy Policy" }]} />
      <Container className="py-10 sm:py-14">
        <Prose>
          <h2>Students and visitors</h2>
          <ul>
            <li>You don&apos;t need an account. We don&apos;t ask for your name, email or roll number to browse, preview or download resources.</li>
            <li>We don&apos;t use advertising or third-party tracking scripts.</li>
            <li>
              We count page views with Vercel Web Analytics, served from this site&apos;s own domain. It sets no cookies, doesn&apos;t follow you across other websites and doesn&apos;t store personal information such as your name or email — we only see totals like which pages are visited most, plus country, browser and device type. Vercel Speed Insights works the same way and measures how quickly pages load for visitors, so we can make the site faster.
            </li>
            <li>Our hosting provider and Firebase keep standard technical logs (such as IP address, browser type and requested page) to operate and secure the service.</li>
            <li>The academic tools (GPA, attendance, timer) save your inputs in your own browser&apos;s local storage. They never leave your device.</li>
          </ul>
          <h2>Administrators</h2>
          <ul>
            <li>Administrators sign in with Google through Firebase Authentication. We store their Firebase user id, name and email to authorise access.</li>
            <li>Actions in the dashboard (uploads, publishing, edits, deletions) are recorded in an audit log with the administrator&apos;s id and email.</li>
            <li>A secure, http-only session cookie keeps administrators signed in. No cookies are set for regular visitors.</li>
          </ul>
          <h2>Content</h2>
          <p>Resources are uploaded by administrators for educational use. If a file contains your personal information or you hold its copyright and want it removed, please use the <Link href="/contact">contact page</Link>.</p>
          <h2>Changes</h2>
          <p>If this policy changes, the updated version will be published on this page. {SITE.name} is a student-run project and not an official {SITE.university} service.</p>
        </Prose>
      </Container>
    </>
  );
}
