import Image from "next/image";
import { ArrowRight, GraduationCap, Landmark, PlayCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/constants/site";
import { CAMPUS_IMAGES } from "@/constants/images";
import { canOptimizeImage } from "@/lib/images";

interface HeroProps {
  /** Bundled path (default) or an admin-provided URL. */
  heroImage: string;
}

const BUNDLED = [CAMPUS_IMAGES.hero, ...CAMPUS_IMAGES.gallery];

/** Two-column hero matching the reference design: copy on the left, campus visual on the right. */
export function Hero({ heroImage }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      {/* Background decoration */}
      <div className="glow-blob absolute -left-40 top-10 -z-10 h-96 w-96 opacity-60" aria-hidden />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.22),transparent_55%)]" aria-hidden />

      <div className="container-page grid items-center gap-10 pb-10 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-14 lg:pt-12">
        <div className="relative z-10 animate-fade-up">
          <div className="inline-flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-amber-400/40 bg-bg-2/80 px-3.5 py-1.5 text-sm shadow-[0_0_0_1px_rgba(168,85,247,0.08)] backdrop-blur">
            <Landmark className="h-4 w-4 text-amber-400" aria-hidden />
            <span className="font-medium text-text">{SITE.university}</span>
            <span className="h-4 w-px bg-border-2" aria-hidden />
            <GraduationCap className="h-4 w-4 text-lavender" aria-hidden />
            <span className="font-medium text-lavender">Mechatronics · Robotics &amp; AI</span>
          </div>

          <h1 id="hero-title" className="relative mt-6 text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-text sm:text-5xl lg:text-[2.75rem] xl:text-[3.4rem] 2xl:text-[3.75rem]">
            <span className="block sm:whitespace-nowrap">Your Robotics Journey.</span>
            <span className="block sm:whitespace-nowrap">
            Your{" "}
            <span className="relative inline-block">
              <span className="text-gradient">Study Buddy.</span>
              {/* Hand-drawn underline stroke */}
              <svg className="absolute -bottom-2 left-0 h-3 w-[70%] text-primary" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none" aria-hidden>
                <path d="M2 9C40 3 90 2 140 5c20 1 40 3 56 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M30 11c40-4 90-5 130-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </svg>
            </span>
            </span>
            {/* Sparkle accent */}
            <svg className="absolute -top-6 right-0 hidden h-10 w-12 text-primary sm:block lg:-right-14" viewBox="0 0 48 40" fill="none" aria-hidden>
              <path d="M10 18 14 4M24 22 36 10M28 34h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-text-2 sm:text-lg">{SITE.description.replace(" at Manipal University Jaipur.", " at MUJ.")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button href="#academic-space" size="lg" leftIcon={<Rocket className="h-5 w-5" aria-hidden />} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />} className="px-7">
              Explore Resources
            </Button>
            <Button
              href="/how-it-works"
              size="lg"
              variant="outline"
              leftIcon={<PlayCircle className="h-5 w-5 text-lavender" aria-hidden />}
              className="border-primary/50 px-7"
            >
              How it Works
            </Button>
          </div>
        </div>

        <HeroVisual src={heroImage} />
      </div>
    </section>
  );
}

function HeroVisual({ src }: { src: string }) {
  const alt = BUNDLED.find((img) => img.src === src)?.alt ?? `${SITE.university} campus`;

  return (
    <figure className="relative mx-auto w-full max-w-2xl lg:mr-[-6rem] lg:max-w-none xl:mr-[-10rem]">
      {/* Glow + orbit arc behind the image */}
      <div className="absolute inset-[10%] -z-10 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" aria-hidden />
      <svg className="pointer-events-none absolute -left-6 top-6 z-10 h-[85%] w-[105%] text-primary" viewBox="0 0 600 400" fill="none" preserveAspectRatio="none" aria-hidden>
        <path d="M20 360C80 150 330 40 590 70" stroke="url(#orbit)" strokeWidth="3" strokeLinecap="round" />
        <defs>
          <linearGradient id="orbit" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7" stopOpacity="0.9" />
            <stop offset="0.6" stopColor="#7C3AED" stopOpacity="0.5" />
            <stop offset="1" stopColor="#C4B5FD" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl [mask-image:radial-gradient(ellipse_80%_75%_at_60%_45%,black_55%,transparent_100%)] lg:rounded-none">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
          unoptimized={!canOptimizeImage(src)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/70 via-transparent to-transparent" aria-hidden />
      </div>
    </figure>
  );
}
