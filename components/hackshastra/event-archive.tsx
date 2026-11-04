"use client";

import { useState } from "react";
import { ArrowDownRight, Plus, Check } from "lucide-react";
import BrandImage from "./brand-image";
import BrandLink from "./brand-link";

export type HackShastraEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  role: string;
  description: string;
  image: string;
  href: string;
};

export default function EventArchive({
  events,
}: {
  events: HackShastraEvent[];
}) {
  const [activeId, setActiveId] = useState(events[0]?.id);
  const active = Math.max(
    0,
    events.findIndex((event) => event.id === activeId),
  );
  const selected = events[active];
  if (!selected)
    return (
      <BrandLink href="https://www.hackshastra.in/events">
        Explore the official event archive
      </BrandLink>
    );

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <figure className="hs-event-figure hidden min-w-0 lg:sticky lg:top-10 lg:block">
        <div
          className="hs-event-mat relative overflow-hidden"
          data-hackshastra-image
        >
          <div className="absolute inset-6 sm:inset-10" key={selected.id}>
            {selected.image ? (
              <BrandImage
                src={selected.image}
                alt={`${selected.title} — official event artwork`}
                sizes="(max-width: 1023px) 88vw, 40vw"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-3xl font-semibold tracking-tight text-[#251c1d]">
                {selected.title}
              </div>
            )}
          </div>
          <span
            className="hs-mat-corner absolute top-3 left-3"
            aria-hidden="true"
          />
          <span
            className="hs-mat-corner absolute right-3 bottom-3 rotate-180"
            aria-hidden="true"
          />
        </div>
        <figcaption
          className="hs-mono mt-4 flex items-start justify-between gap-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>Archive / {String(active + 1).padStart(2, "0")}</span>
          <span className="text-right">{selected.title}</span>
        </figcaption>
      </figure>

      <div className="min-w-0">
        <p className="hs-mono mb-5 flex items-center gap-3 text-[var(--hs-dim)]">
          <ArrowDownRight size={16} aria-hidden="true" /> Select a chapter in
          the story
        </p>
        {events.map((event, index) => (
          <article
            className="hs-event-entry border-t border-[var(--hs-line)]"
            key={event.id}
          >
            <h3>
              <button
                type="button"
                aria-expanded={active === index}
                aria-disabled={active === index}
                aria-controls={`hs-event-${event.id}`}
                id={`hs-event-trigger-${event.id}`}
                onClick={() => setActiveId(event.id)}
                className="hs-event-trigger flex w-full items-start gap-4 py-6 text-left sm:gap-6 sm:py-8"
              >
                <span
                  className="hs-mono pt-2 text-[var(--hs-dim)]"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="hs-mono mb-2 block text-[var(--hs-dim)]">
                    {event.date}
                  </span>
                  <span className="hs-event-name block font-semibold tracking-[-0.05em]">
                    {event.title}
                  </span>
                </span>
                {active === index ? (
                  <Check
                    className="mt-6 shrink-0"
                    size={20}
                    aria-hidden="true"
                  />
                ) : (
                  <Plus
                    className="mt-6 shrink-0"
                    size={20}
                    aria-hidden="true"
                  />
                )}
              </button>
            </h3>
            <div
              id={`hs-event-${event.id}`}
              role="region"
              aria-labelledby={`hs-event-trigger-${event.id}`}
              hidden={active !== index}
              className="hs-event-detail pb-8 pl-8 sm:pl-11"
            >
              {active === index && (
                <div className="relative mb-6 aspect-[4/3] overflow-hidden bg-[#e8e2d8] lg:hidden">
                  <div className="absolute inset-5">
                    {event.image ? (
                      <BrandImage
                        key={event.id}
                        src={event.image}
                        alt={`${event.title} — official event artwork`}
                        sizes="(max-width: 1023px) 85vw, 1px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center text-2xl font-semibold tracking-tight text-[#251c1d]">
                        {event.title}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="hs-mono mb-4 text-[var(--hs-red)]">
                {event.role} <span aria-hidden="true">/</span> {event.location}
              </p>
              <p className="max-w-lg text-sm leading-[1.85] text-[var(--hs-dim)] sm:text-base">
                {event.description}
              </p>
              {event.href && (
                <BrandLink
                  href={event.href}
                  className="mt-4 border-b border-[var(--hs-line)] text-sm"
                >
                  Explore this event
                </BrandLink>
              )}
            </div>
          </article>
        ))}
        <BrandLink
          href="https://www.hackshastra.in/events"
          className="mt-5 w-full border-t border-[var(--hs-line)] pt-5 text-sm"
        >
          The complete HackShastra event archive
        </BrandLink>
      </div>
    </div>
  );
}
