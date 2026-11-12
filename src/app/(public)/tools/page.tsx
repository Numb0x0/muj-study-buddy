import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, CalendarCheck, Lightbulb, Ruler, Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { GpaCalculator } from "@/components/tools/GpaCalculator";
import { AttendanceCalculator } from "@/components/tools/AttendanceCalculator";
import { StudyTimer } from "@/components/tools/StudyTimer";
import { UnitConverter } from "@/components/tools/UnitConverter";
import { ComingSoonTools } from "@/components/tools/ComingSoonTools";

export const metadata: Metadata = { title: "Academic Tools", description: "SGPA/CGPA calculator, attendance calculator, study timer and robotics unit converter." };

const JUMP = [
  { href: "#gpa", label: "SGPA / CGPA", Icon: Calculator },
  { href: "#attendance", label: "Attendance", Icon: CalendarCheck },
  { href: "#timer", label: "Study timer", Icon: Timer },
  { href: "#units", label: "Unit converter", Icon: Ruler },
];

export default function ToolsPage() {
  return (
    <>
      <PageHeader eyebrow="Academic tools" title="Tools that actually work" description="Small, reliable helpers for everyday student life. Everything runs in your browser — nothing is sent to a server." crumbs={[{ label: "Tools" }]}>
        <nav aria-label="Jump to tool" className="flex flex-wrap gap-2">
          {JUMP.map(({ href, label, Icon }) => (
            <a key={href} href={href} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-sm text-text-2 transition-colors hover:border-primary/50 hover:text-text">
              <Icon className="h-4 w-4 text-lavender" aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      </PageHeader>
      <Container className="space-y-8 py-10 sm:py-14">
        <GpaCalculator />
        <div className="grid gap-8 xl:grid-cols-2">
          <AttendanceCalculator />
          <StudyTimer />
        </div>
        <UnitConverter />
        <ComingSoonTools />
        <p className="flex items-center gap-2 text-sm text-text-3">
          <Lightbulb className="h-4 w-4 text-warning" aria-hidden />
          Have an idea for a tool?{" "}
          <Link href="/contact" className="font-semibold text-lavender hover:underline">
            Suggest a tool
          </Link>
        </p>
      </Container>
    </>
  );
}
