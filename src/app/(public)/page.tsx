import { Hero } from "@/components/homepage/Hero";
import { FeatureStrip } from "@/components/homepage/FeatureStrip";
import { AcademicSpace } from "@/components/homepage/AcademicSpace";
import { RecentResources } from "@/components/homepage/RecentResources";
import { FacultySection } from "@/components/homepage/FacultySection";
import { loadSiteSettings } from "@/components/layout/site-settings";
import { SITE } from "@/constants/site";
import { getFeaturedFaculty, getRecentNotes, getSetupStatus, tryQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, recent, faculty] = await Promise.all([
    loadSiteSettings(),
    tryQuery(() => getRecentNotes(6), []),
    tryQuery(() => getFeaturedFaculty(3), []),
  ]);
  const heroImage = settings.heroImageUrl || SITE.heroImage;

  return (
    <>
      <Hero heroImage={heroImage} />
      <FeatureStrip />
      <AcademicSpace />
      <RecentResources notes={recent} configured={getSetupStatus().configured} />
      <FacultySection faculty={faculty} />
    </>
  );
}
