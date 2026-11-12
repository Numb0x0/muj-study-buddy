import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ACADEMIC_SPACE_CARDS } from "@/constants/resources";
import { CardIcon } from "@/components/ui/Card";
import { IconByName } from "@/components/ui/ResourceTypeIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function AcademicSpace() {
  return (
    <section id="academic-space" className="container-page scroll-mt-24 pt-12 sm:pt-14" aria-labelledby="academic-space-title">
      <SectionHeading title={<span id="academic-space-title">Your Academic Space</span>} action={{ label: "Explore All Resources", href: "/resources" }} />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {ACADEMIC_SPACE_CARDS.map((card) => (
          <li key={card.title}>
            <Link
              href={card.href}
              className="group card-surface card-hover relative flex h-full flex-col p-6 focus-visible:border-primary/60"
            >
              <CardIcon className="h-12 w-12">
                <IconByName name={card.icon} className="h-6 w-6" aria-hidden />
              </CardIcon>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-text">{card.title}</h3>
              <p className="mt-2 pr-8 text-[15px] leading-relaxed text-text-3">{card.description}</p>
              <ArrowRight
                className="absolute bottom-6 right-6 h-5 w-5 text-text-2 transition-all duration-300 group-hover:translate-x-1 group-hover:text-lavender"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
