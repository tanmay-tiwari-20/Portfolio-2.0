import type { Metadata } from "next";
import HackShastraExperience from "@/components/hackshastra/hackshastra-experience";
import { MotionLayer } from "@/components/shell";
import { published, repos } from "@/lib/db";
import { resolveHackShastraEvents } from "@/lib/hackshastra-content";
import "./hackshastra.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HackShastra — Built Together",
  description:
    "Inside HackShastra: a creator-led student technology community connecting ideas, hackathons and campus chapters across India. Co-founded by Tanmay Tiwari.",
};

export default async function HackShastraPage() {
  const events = resolveHackShastraEvents(await published(repos.events));
  return (
    <>
      <HackShastraExperience events={events} />
      <MotionLayer />
    </>
  );
}
