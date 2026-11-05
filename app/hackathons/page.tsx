import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import HackathonsExperience from "@/components/hackathons/hackathons-experience";
import { MotionLayer } from "@/components/shell";
import "./hackathons.css";
import "@/components/hackathons/hackathons-journal.css";
import "@/components/hackathons/hackathons-hero.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Hackathons — People, ideas & the work between",
  description:
    "Tanmay Tiwari’s hackathon journal: mentoring builders, evaluating ideas, and exploring the people and experiences behind each event.",
};

export default async function HackathonsPage() {
  const [events, profiles] = await Promise.all([
    published(repos.hackathons),
    repos.profile.getAll(),
  ]);
  return (
    <>
      <HackathonsExperience events={events} profile={profiles[0]} />
      <MotionLayer />
    </>
  );
}
