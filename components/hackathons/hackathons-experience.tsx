import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import type { Hackathon, Profile } from "@/lib/validators/schemas";
import { hackathonMoments } from "@/data/hackathon-moments";
import {
  hackathonDisplayDate,
  getHackathonSource,
} from "@/lib/hackathons-content";
import HackathonsMotion from "./hackathons-motion";
import HackathonsImage from "./hackathons-image";
import HackathonsArchive from "./hackathons-archive";
import HackathonsHero from "./hackathons-hero";

const linkedin = "https://www.linkedin.com/in/tanmay-tiwari20/";

function Chapter({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <p className="hk-chapter">
      <span>{number}</span>
      <span className="hk-chapter-line" data-hk-rule />
      <span>{children}</span>
    </p>
  );
}

function EventLink({ event }: { event: Hackathon }) {
  const source = getHackathonSource(event);
  const content = (
    <>
      <span>
        <span className="hk-meta">
          {hackathonDisplayDate(event) || event.role}
        </span>
        <strong>{event.name}</strong>
        <span className="hk-event-organizer">{event.organizer}</span>
      </span>
      <ArrowUpRight size={23} aria-hidden="true" data-hk-arrow />
    </>
  );
  return source ? (
    <a
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
      className="hk-feature-event"
      data-hk-link
    >
      {content}
    </a>
  ) : (
    <div className="hk-feature-event">{content}</div>
  );
}

export default function HackathonsExperience({
  events,
  profile,
}: {
  events: Hackathon[];
  profile?: Profile;
}) {
  const mentors = events.filter((event) => event.role === "Mentor");
  const mentorNames = ["HackCBS 8.0", "Hack4Delhi", "SRM Builds 7.0"];
  const featuredMentors = mentorNames
    .map((name) => mentors.find((event) => event.name === name))
    .filter((event): event is Hackathon => Boolean(event));
  const mentorSelection = featuredMentors.length
    ? featuredMentors
    : mentors.slice(0, 3);
  const judges = events.filter((event) => event.role === "Judge");
  const person = profile?.name || "Tanmay Tiwari";
  const email = profile?.email?.trim();

  return (
    <HackathonsMotion className="hackathons-page">
      <div className="hk-reading-track" aria-hidden="true">
        <span data-hk-reading-progress />
      </div>
      <HackathonsHero
        name={person}
        location={profile?.location}
        hasMentors={mentors.length > 0}
        hasJudges={judges.length > 0}
      />

      {mentors.length > 0 && (
        <section
          className="hk-screen hk-mentoring"
          aria-labelledby="hk-mentor-title"
          id="hk-journey"
          data-hk-journey
        >
          <div className="hk-container">
            <Chapter number="01">The conversations that count</Chapter>
            <div className="hk-mentor-grid grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-20">
              <div className="min-w-0">
                <h2 id="hk-mentor-title" className="hk-heading" data-hk-line>
                  A good question.
                  <br />
                  <span className="hk-muted">A better build.</span>
                </h2>
                <figure className="hk-mentor-figure">
                  <div className="hk-mentor-photo" data-hk-image>
                    <HackathonsImage
                      src={hackathonMoments[0].src}
                      alt={hackathonMoments[0].alt}
                    />
                  </div>
                  <figcaption>
                    <span className="hk-meta">Notes from the floor</span>
                    <span>Different minds. Different routes.</span>
                  </figcaption>
                </figure>
              </div>
              <div className="hk-mentor-story">
                <div>
                  <span className="hk-overline hk-red">
                    In the room / Mentor
                  </span>
                  <p className="hk-lede">
                    From an early idea to a clearer way forward.
                  </p>
                  <p className="hk-body">
                    My mentoring work brings me alongside teams as they question
                    an idea, work through technical challenges, and decide what
                    to build next.
                  </p>
                </div>
                <div className="hk-milestones" data-hk-sequence>
                  <span className="hk-timeline-track" aria-hidden="true">
                    <span data-hk-progress />
                  </span>
                  {mentorSelection.map((event) => (
                    <div className="hk-milestone" data-hk-step key={event.id}>
                      <EventLink event={event} />
                    </div>
                  ))}
                </div>
                <a href="#hk-archive" className="hk-text-link" data-hk-link>
                  Explore the event journal{" "}
                  <ArrowDown size={17} aria-hidden="true" data-hk-arrow />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {judges.length > 0 && (
        <section
          id="hk-judging"
          className="hk-screen hk-judging"
          aria-labelledby="hk-judge-title"
        >
          <div className="hk-container">
            <Chapter number="02">A different side of the table</Chapter>
            <div className="hk-judge-grid grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
              <div>
                <span className="hk-overline">Project evaluation / Judge</span>
                <h2 id="hk-judge-title" className="hk-judge-title" data-hk-line>
                  <span data-hk-judge-word>Beyond</span>
                  <span data-hk-judge-word>
                    the demo<span className="hk-judge-stop">.</span>
                  </span>
                </h2>
                <p className="hk-judge-note">
                  A strong idea deserves
                  <br />a thoughtful review.
                </p>
              </div>
              <div className="hk-judge-content">
                <p className="hk-lede">
                  Looking at the thinking
                  <br className="hidden sm:block" /> behind the thing.
                </p>
                <p className="hk-body">
                  Judging brings a different responsibility: considering the
                  idea, its technical execution, and how it responds to a real
                  problem.
                </p>
                <div className="hk-judge-events" data-hk-sequence>
                  {judges.slice(0, 2).map((event) => (
                    <div data-hk-step key={event.id}>
                      <EventLink event={event} />
                    </div>
                  ))}
                </div>
                <a href="#hk-archive" className="hk-text-link" data-hk-link>
                  Open the full archive{" "}
                  <ArrowDown size={17} aria-hidden="true" data-hk-arrow />
                </a>
              </div>
            </div>
            <div className="hk-criteria" data-hk-sequence>
              <span data-hk-step>Technical execution</span>
              <span data-hk-step>Original thinking</span>
              <span data-hk-step>Real-world relevance</span>
            </div>
          </div>
        </section>
      )}

      <section
        id="hk-archive"
        className="hk-screen hk-archive"
        aria-labelledby="hk-archive-title"
      >
        <div className="hk-container">
          <Chapter number="03">The event journal</Chapter>
          <div className="hk-section-heading flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <h2 id="hk-archive-title" className="hk-heading" data-hk-line>
              Different rooms.
              <br />
              <span className="hk-muted">Shared possibility.</span>
            </h2>
            <p className="hk-body">
              The events, the roles, and the work between.
              <br className="hidden lg:block" /> Open an entry to explore the
              experience.
            </p>
          </div>
          <HackathonsArchive events={events} />
        </div>
      </section>

      <footer
        id="hk-connect"
        className="hk-screen hk-connect"
        aria-labelledby="hk-connect-title"
      >
        <div className="hk-container hk-connect-inner">
          <Chapter number="04">
            A fresh perspective for your next hackathon
          </Chapter>
          <div className="hk-invite-layout">
            <div>
              <span className="hk-invite-availability">
                <i aria-hidden="true" />
                Always open to contributing
              </span>
              <h2
                id="hk-connect-title"
                className="hk-invite-title"
                data-hk-line
              >
                Good ideas.
                <br />
                <span className="hk-red">Better together.</span>
              </h2>
            </div>
            <div className="hk-invite-note" data-hk-line>
              <p className="hk-invite-question">
                Have a hackathon
                <br />
                on the horizon?
              </p>
              <p className="hk-body">
                From helping teams find their next step to giving a thoughtful
                project review, I’m always up for contributing to a hackathon.
                Let’s find a way to make yours even better.
              </p>
              <Link href="/contact" className="hk-text-link" data-hk-link>
                Start a conversation{" "}
                <ArrowUpRight size={18} aria-hidden="true" data-hk-arrow />
              </Link>
            </div>
          </div>
          <div className="hk-invite-actions">
            <a
              href={
                email
                  ? `mailto:${email}?subject=Let%E2%80%99s%20talk%20about%20your%20hackathon`
                  : "/contact"
              }
              className="hk-invite-email"
              data-hk-link
            >
              <span className="hk-invite-action-copy">
                <span className="hk-invite-label">
                  Tell me what you’re planning
                </span>
                <strong>
                  Drop me a line<span aria-hidden="true">.</span>
                </strong>
                <span className="hk-invite-address">
                  {email || "Let’s talk about your next hackathon"}
                </span>
              </span>
              <span className="hk-invite-arrow">
                <ArrowUpRight size={28} aria-hidden="true" data-hk-arrow />
              </span>
            </a>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hk-invite-linkedin"
              data-hk-link
            >
              <span className="hk-invite-action-copy">
                <span className="hk-invite-label">
                  Keep the conversation going
                </span>
                <strong>
                  Connect on <br />
                  LinkedIn
                </strong>
              </span>
              <span className="hk-invite-arrow">
                <ArrowUpRight size={28} aria-hidden="true" data-hk-arrow />
              </span>
            </a>
          </div>
          <div className="hk-footer-bottom flex flex-wrap items-center justify-between gap-5">
            <Link href="/" className="hk-footer-name">
              {person}
              <span>For the ideas. For the people. For the next build.</span>
            </Link>
            <nav aria-label="Related work" className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/hackshastra" className="hk-text-link" data-hk-link>
                The HackShastra community
              </Link>
              <Link href="/projects" className="hk-text-link" data-hk-link>
                Explore my projects
              </Link>
            </nav>
            <a href="#hk-top" className="hk-text-link" data-hk-link>
              Back to the top{" "}
              <ArrowUp size={17} aria-hidden="true" data-hk-arrow />
            </a>
          </div>
        </div>
      </footer>
    </HackathonsMotion>
  );
}
