export const SITE = {
  name: "MUJ Study Buddy",
  tagline: "Your Robotics Journey. Your Study Buddy.",
  description:
    "Notes, previous year papers, assignments, lab resources and everything you need for B.Tech Mechatronics and B.Tech Robotics & AI at Manipal University Jaipur.",
  university: "Manipal University Jaipur",
  universityShort: "MUJ",
  audience: "For MUJ Mechatronics & R&AI Students",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Bundled campus photo; NEXT_PUBLIC_HERO_IMAGE or Admin → Settings can override it. */
  heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE || "/images/campus/main-building-golden-hour.webp",
  /** Default public contact address (Admin → Settings can change it). */
  contactEmail: "aarya.singh787034@gmail.com",
} as const;

/** Public navigation (desktop + mobile). */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "All Resources", href: "/resources", description: "Search & filter every published PDF" },
      { label: "Semester Notes", href: "/resources?type=notes", description: "Unit-wise notes per subject" },
      { label: "Previous Year Papers", href: "/resources?type=pyq", description: "PYQs to prepare better" },
      { label: "Assignments", href: "/resources?type=assignment", description: "References & submission guides" },
      { label: "Lab Resources", href: "/resources?type=lab", description: "Manuals, experiments, viva" },
      { label: "Degree Programs", href: "/programs", description: "Browse by program & semester" },
    ],
  },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Faculty", href: "/faculty" },
  { label: "Tools", href: "/tools" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
] as const;

export const FOOTER_LINKS = {
  quick: [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    { label: "Degree Programs", href: "/programs" },
    { label: "Curriculum & Syllabus", href: "/curriculum" },
    { label: "How it Works", href: "/how-it-works" },
  ],
  resources: [
    { label: "Semester Notes", href: "/resources?type=notes" },
    { label: "Previous Year Papers", href: "/resources?type=pyq" },
    { label: "Assignments", href: "/resources?type=assignment" },
    { label: "Lab Resources", href: "/resources?type=lab" },
  ],
  more: [
    { label: "Faculty", href: "/faculty" },
    { label: "Tools", href: "/tools" },
    { label: "Community", href: "/community" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;
