import { published, repos } from "@/lib/db";
import HackathonsExperience from "@/components/hackathons/hackathons-experience";
import { MotionLayer } from "@/components/shell";
import "./hackathons.css";
import "@/components/hackathons/hackathons-journal.css";
import "@/components/hackathons/hackathons-hero.css";
import { pageMetadata, pageGraph } from "@/lib/seo";
import SeoJsonLd from "@/components/seo-json-ld";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("hackathons");

export default async function HackathonsPage() {
  const [events, profiles] = await Promise.all([
    published(repos.hackathons),
    published(repos.profile),
  ]);
  return (
    <>
      <SeoJsonLd data={pageGraph("hackathons")} />
      <HackathonsExperience events={events} profile={profiles[0]} />
      <MotionLayer />
    </>
  );
}
