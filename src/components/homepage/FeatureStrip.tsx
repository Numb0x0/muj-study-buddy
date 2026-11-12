import { Bot, Layers, Users, Zap, type LucideIcon } from "lucide-react";

const FEATURES: { Icon: LucideIcon; title: string; subtitle: string }[] = [
  { Icon: Bot, title: "For Mechatronics Dept.", subtitle: "B.Tech Mechatronics · R&AI" },
  { Icon: Layers, title: "All in One Place", subtitle: "Notes, Papers, Labs & More" },
  { Icon: Zap, title: "Save Time", subtitle: "Find what you need, fast" },
  { Icon: Users, title: "Robotics Community", subtitle: "Learn, Build, Collaborate" },
];

export function FeatureStrip() {
  return (
    <section aria-label="Highlights" className="container-page">
      <ul className="grid grid-cols-1 gap-3 border-y border-border/70 py-6 sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-4 lg:gap-0">
        {FEATURES.map(({ Icon, title, subtitle }, i) => (
          <li
            key={title}
            className={`flex items-center gap-4 px-2 sm:px-4 lg:justify-center ${i > 0 ? "lg:border-l lg:border-border/70" : ""}`}
          >
            <Icon className="h-9 w-9 shrink-0 text-lavender" strokeWidth={1.6} aria-hidden />
            <div>
              <p className="font-semibold text-text">{title}</p>
              <p className="text-sm text-text-3">{subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
