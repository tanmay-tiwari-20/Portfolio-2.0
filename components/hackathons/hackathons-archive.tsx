"use client";
import { useId, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import type { Hackathon } from "@/lib/validators/schemas";
import {
  hackathonDisplayDate,
  getHackathonSource,
  getHackathonContext,
} from "@/lib/hackathons-content";
import HackathonsJournal from "./hackathons-journal";

const pageSize = 4;

export default function HackathonsArchive({ events }: { events: Hackathon[] }) {
  const id = useId();
  const [role, setRole] = useState("All");
  const [page, setPage] = useState(0);
  const [opened, setOpened] = useState<string | null>(null);
  const roles = [
    "All",
    "Mentor",
    "Judge",
    ...(events.some((event) => event.role === "Organizer")
      ? ["Organizer"]
      : []),
  ];
  const filtered = events.filter(
    (event) => role === "All" || event.role === role,
  );
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  function filter(value: string) {
    setRole(value);
    setPage(0);
    setOpened(null);
  }
  function changePage(next: number) {
    setPage(next);
    setOpened(null);
  }

  return (
    <div className="hk-archive-grid grid min-w-0 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <HackathonsJournal />
      <div className="min-w-0">
        <div
          className="hk-filters flex flex-wrap gap-2"
          role="group"
          aria-label="Filter events by role"
        >
          {roles.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={value === role}
              onClick={() => filter(value)}
            >
              {value === "All"
                ? "All experiences"
                : value === "Mentor"
                  ? "Mentoring"
                  : value === "Judge"
                    ? "Judging"
                    : "Organising"}
            </button>
          ))}
        </div>
        <div className="hk-event-list" aria-label="Hackathon experiences">
          {visible.map((event) => {
            const expanded = event.id === opened;
            const panelId = `${id}-${event.id}`;
            const date = hackathonDisplayDate(event);
            const source = getHackathonSource(event);
            const context = getHackathonContext(event);
            return (
              <article key={event.id} className="hk-event" data-open={expanded}>
                <h3 className="m-0">
                  <button
                    type="button"
                    className="hk-event-toggle"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    id={`${panelId}-button`}
                    onClick={() => setOpened(expanded ? null : event.id)}
                  >
                    <span className="hk-event-role">{event.role}</span>
                    <span className="hk-event-name">{event.name}</span>
                    <span className="hk-event-toggle-icon">
                      {expanded ? (
                        <Minus size={20} aria-hidden="true" />
                      ) : (
                        <Plus size={20} aria-hidden="true" />
                      )}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${panelId}-button`}
                  hidden={!expanded}
                  className="hk-event-details"
                >
                  <p className="hk-event-meta">
                    {event.organizer}
                    {date ? ` · ${date}` : ""}
                  </p>
                  {context && (
                    <p className="hk-event-location">{context.location}</p>
                  )}
                  <p>{event.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {source && (
                      <a
                        href={source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hk-text-link"
                        data-hk-link
                      >
                        {source.label}{" "}
                        <ArrowUpRight
                          size={17}
                          aria-hidden="true"
                          data-hk-arrow
                        />
                      </a>
                    )}
                    {source &&
                      context &&
                      context.officialUrl !== source.href && (
                        <a
                          href={context.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hk-text-link"
                          data-hk-link
                        >
                          Official event{" "}
                          <ArrowUpRight
                            size={17}
                            aria-hidden="true"
                            data-hk-arrow
                          />
                        </a>
                      )}
                  </div>
                </div>
              </article>
            );
          })}
          {!visible.length && (
            <p className="hk-empty">
              More experiences will appear here as the journal grows.
            </p>
          )}
        </div>
        <div className="hk-archive-pagination flex items-center justify-between gap-4">
          <p aria-live="polite" className="hk-meta">
            {filtered.length
              ? `Page ${currentPage + 1} of ${lastPage + 1}`
              : "No published events"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="hk-icon-button"
              disabled={currentPage === 0}
              onClick={() => changePage(currentPage - 1)}
              aria-label="Previous events"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hk-icon-button"
              disabled={currentPage === lastPage}
              onClick={() => changePage(currentPage + 1)}
              aria-label="Next events"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
