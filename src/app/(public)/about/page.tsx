import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Briefcase, CheckCircle2, Cpu, FlaskConical, GraduationCap, ListChecks, ShieldCheck, Upload, Users, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card, CardIcon } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { SITE } from "@/constants/site";
import { CAMPUS_IMAGES } from "@/constants/images";

export const metadata: Metadata = { title: "About", description: `What ${SITE.name} is, who it is for and how resources are reviewed.` };

const INSIDE = [
  { href: "/curriculum", title: "Curriculum", text: "Scheme, credits and syllabus topics per batch.", Icon: ListChecks },
  { href: "/resources?type=notes", title: "Semester notes", text: "Unit-wise notes for each subject.", Icon: BookOpen },
  { href: "/resources?type=pyq", title: "Previous year papers", text: "Practise with real exam papers.", Icon: GraduationCap },
  { href: "/resources?type=lab", title: "Lab resources", text: "Manuals, experiments and viva questions.", Icon: FlaskConical },
  { href: "/tools", title: "Academic tools", text: "GPA, attendance, timer and converters.", Icon: Wrench },
  { href: "/faculty", title: "Faculty", text: "Verified faculty profiles and contacts.", Icon: Users },
];

/** From the department's 2026–27 admissions brochure (descriptive content only; no statistics). */
const PROGRAMME = [
  {
    title: "Programme highlights",
    Icon: GraduationCap,
    items: ["Interdisciplinary curriculum", "Project-based learning", "Student clubs and technical chapters", "Opportunities for incubation and start-ups", "Student exchange with international universities"],
  },
  {
    title: "Laboratories",
    Icon: FlaskConical,
    items: ["IoT Fab Lab", "3D Printing Farm Lab", "Robotics Lab", "Industrial Automation Lab", "PLC Lab", "Microcontroller Lab"],
  },
  {
    title: "Research equipment",
    Icon: Cpu,
    items: [
      "UR 5–6 axis manipulator arm",
      "Bosch Rexroth electro-hydraulic system and Janatics electro-pneumatics",
      "Siemens PLCs and VFDs",
      "Raspberry Pi, Jetson Nano, NI myRIO / ELVIS II+",
      "TurtleBot 2i (ROS), Khepera robot, hexacopter drones",
      "Intel RealSense, Oculus, HTC Vive and HoloLens headsets",
    ],
  },
  {
    title: "Careers & collaborations",
    Icon: Briefcase,
    items: [
      "Industry 4.0, IoT systems and AI-enabled design",
      "Robotics, autonomous systems and human–robot interaction",
      "AI ethics",
      "University of Malaya (Malaysia) and Hochschule Bremen (Germany)",
      "ETMN Technology Pvt. Ltd.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title={`About ${SITE.name}`} description="A single, organised place for everything a Mechatronics or Robotics & AI student at MUJ needs to study — free, public and login-free." crumbs={[{ label: "About" }]} />
      <Container className="space-y-12 py-10 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-2">
          <Card padding="lg">
            <h2 className="text-xl font-bold text-text">Our mission</h2>
            <p className="mt-3 leading-relaxed text-text-2">
              Study material is usually scattered across group chats, drives and old emails. {SITE.name} collects it in one searchable library organised by program, semester, subject and unit, so you spend time studying instead of searching.
            </p>
          </Card>
          <Card padding="lg">
            <h2 className="text-xl font-bold text-text">Who it&apos;s for</h2>
            <p className="mt-3 leading-relaxed text-text-2">
              Students of both B.Tech branches of the Department of Mechatronics Engineering at {SITE.university}: <strong className="font-semibold text-text">Mechatronics</strong> and <strong className="font-semibold text-text">Robotics &amp; Artificial Intelligence</strong>. The catalogue is data-driven, so administrators can add other departments and programs without code changes.
            </p>
          </Card>
        </section>

        <section aria-labelledby="inside">
          <h2 id="inside" className="mb-5 text-xl font-bold text-text">What&apos;s inside</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {INSIDE.map(({ href, title, text, Icon }) => (
              <li key={href}>
                <Link href={href} className="card-surface card-hover flex h-full flex-col p-5">
                  <CardIcon className="h-10 w-10">
                    <Icon className="h-5 w-5" aria-hidden />
                  </CardIcon>
                  <span className="mt-4 font-semibold text-text">{title}</span>
                  <span className="mt-1 text-sm text-text-3">{text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="programme" aria-labelledby="programme-h" className="scroll-mt-24 space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lavender">About the programme</p>
            <h2 id="programme-h" className="mt-1 text-2xl font-bold text-text">B.Tech in Robotics &amp; Artificial Intelligence</h2>
            <p className="mt-3 leading-relaxed text-text-2">
              An interdisciplinary programme from the Department of Mechatronics Engineering that brings together mechanical, electrical, electronics and computing. The department describes its courses as designed to follow emerging trends and industry demand, with applications in robotic systems, industrial automation, cybernetics, UAVs and drones, smart systems, medical robotics, autonomous vehicles and space research.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PROGRAMME.map(({ title, Icon, items }) => (
              <Card key={title} className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-text">
                  <Icon className="h-4 w-4 text-primary" aria-hidden /> {title}
                </h3>
                <ul className="space-y-1.5 text-sm text-text-2">
                  {items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lavender" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <p className="text-xs text-text-3">
            The department also runs B.Tech Mechatronics; its programme details and curriculum will be added once its documents are available. Summarised from the department&apos;s 2026–27 Robotics &amp; AI admissions brochure. For the semester-by-semester course list, see the{" "}
            <Link href="/curriculum" className="text-lavender underline underline-offset-4">
              curriculum
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="campus" className="grid items-center gap-6 md:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lavender">Campus</p>
            <h2 id="campus" className="mt-1 text-2xl font-bold text-text">{SITE.university}</h2>
            <p className="mt-3 leading-relaxed text-text-2">The domed main building on the MUJ campus at Dehmi Kalan, on the Jaipur–Ajmer Expressway.</p>
          </div>
          {CAMPUS_IMAGES.gallery.map((img) => (
            <figure key={img.src} className="overflow-hidden rounded-2xl border border-border bg-bg-2">
              <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="(min-width: 768px) 30vw, 100vw" className="aspect-[3/4] h-auto w-full object-cover" />
            </figure>
          ))}
        </section>

        <section aria-labelledby="review" className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 id="review" className="text-xl font-bold text-text">How resources are reviewed</h2>
            <p className="mt-3 text-text-2">Only authorised administrators can upload. Every file goes through the same workflow before students can see it:</p>
          </div>
          <ol className="space-y-3">
            {[
              { Icon: Upload, t: "Uploaded as a private draft", d: "PDFs are validated (type and size) and stored privately." },
              { Icon: CheckCircle2, t: "Previewed and checked", d: "An admin reviews the file and its subject, semester and unit details." },
              { Icon: ShieldCheck, t: "Published by the server", d: "Only then is it copied to public storage and listed on the site." },
            ].map(({ Icon, t, d }, i) => (
              <li key={t} className="flex gap-4 rounded-xl border border-border bg-surface/60 p-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-lavender">{i + 1}</span>
                <span>
                  <span className="flex items-center gap-2 font-semibold text-text">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {t}
                  </span>
                  <span className="mt-0.5 block text-sm text-text-3">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <Alert variant="warning" title="Not an official MUJ website">
          {SITE.name} is a student-run project and is not affiliated with or endorsed by {SITE.university}. Always confirm deadlines, syllabi and regulations with official university sources.
        </Alert>

        <section className="text-sm text-text-3">
          Built with Next.js, React, TypeScript, Tailwind CSS and Firebase.
        </section>

        <div className="flex flex-wrap gap-3">
          <Button href="/resources">Explore resources</Button>
          <Button href="/contact" variant="outline">
            Contact us
          </Button>
        </div>
      </Container>
    </>
  );
}
