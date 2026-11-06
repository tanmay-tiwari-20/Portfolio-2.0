import HackShastraExperience from "@/components/hackshastra/hackshastra-experience";
import { MotionLayer } from "@/components/shell";
import { published, repos } from "@/lib/db";
import { resolveHackShastraEvents } from "@/lib/hackshastra-content";
import "./hackshastra.css";
import { pageMetadata, pageGraph } from "@/lib/seo";
import SeoJsonLd from "@/components/seo-json-ld";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("hackshastra");

export default async function HackShastraPage() {
  const events = resolveHackShastraEvents(await published(repos.events));
  return (
    <>
      <SeoJsonLd data={pageGraph("hackshastra")} />
      <HackShastraExperience events={events} />
      <MotionLayer />
    </>
  );
}
