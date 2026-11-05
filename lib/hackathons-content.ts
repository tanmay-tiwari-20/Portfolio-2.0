import type { Hackathon } from "@/lib/validators/schemas";

type EventResearch = {
  id: string;
  name: string;
  organizer: string;
  role: Hackathon["role"];
  date: string;
  location: string;
  officialUrl: string;
};

/** Exact source identities keep researched details from surviving unrelated admin edits. */
const eventResearch: EventResearch[] = [
  {
    id: "hack-01",
    name: "Hack4Delhi",
    organizer: "IEEE NSUT, HN & Delhi Government",
    role: "Mentor",
    date: "Jan 2026",
    location: "Civic Centre, New Delhi",
    officialUrl: "https://events.vtools.ieee.org/m/527107",
  },
  {
    id: "hack-02",
    name: "HackCBS 8.0",
    organizer: "Shaheed Sukhdev College of Business Studies & Kronos",
    role: "Mentor",
    date: "Nov 2025",
    location: "New Delhi",
    officialUrl: "https://hackcbs-8.devfolio.co/",
  },
  {
    id: "33H5wcpKiTNmzmEFjT0Ii",
    name: "CodePunk v2.0",
    organizer: "Droid & GLA University",
    role: "Judge",
    date: "April 2026",
    location: "GLA University, Mathura",
    officialUrl:
      "https://unstop.com/hackathons/codepunk-v20-gla-university-glau-uttar-pradesh-1649328/amp",
  },
  {
    id: "ZQKB-chKlvPHH_bSeaN0g",
    name: "SRM Builds 7.0",
    organizer: "SRM University, Delhi NCR, Sonipat",
    role: "Mentor",
    date: "March 2026",
    location: "SRM University Delhi-NCR, Sonepat",
    officialUrl:
      "https://unstop.com/hackathons/srm-builds-70-verge-2026-srm-university-delhi-ncr-sonepat-1648620/amp",
  },
  {
    id: "4x7Hv-BM5CKVKB0Cjjujv",
    name: "VIBECODE </>",
    organizer: "OSEN",
    role: "Judge",
    date: "March 2026",
    location: "Online",
    officialUrl: "https://luma.com/hn0ak2z3",
  },
  {
    id: "FZsVWIadYkpK91_Ghbc5w",
    name: "Matrix 3.0",
    organizer: "InternWare – Internship Cell, IITM",
    role: "Mentor",
    date: "April 2026",
    location: "IITM Janakpuri, New Delhi",
    officialUrl: "https://matrix-3.devfolio.co/",
  },
  {
    id: "xgMMRuZ_ZHn-VH5kj-xbk",
    name: "Nexhack 2.0",
    organizer: "Nexverse IITM",
    role: "Mentor",
    date: "Aug 2026",
    location: "IITM Janakpuri, New Delhi",
    officialUrl: "https://nexhack-2.devfolio.co/",
  },
];

function researchFor(event: Hackathon): EventResearch | undefined {
  return eventResearch.find(
    (entry) =>
      entry.id === event.id &&
      entry.name === event.name &&
      entry.organizer === event.organizer &&
      entry.role === event.role &&
      entry.date === event.date,
  );
}

export function safeHackathonLink(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

/** Research: docs/hackathons-research.md. Conflicting months stay absent;
 * the original, editable source records are never overwritten. */
export function hackathonDisplayDate(event: Hackathon): string | undefined {
  if (researchFor(event)?.id === "xgMMRuZ_ZHn-VH5kj-xbk") return "2026";
  return event.date.trim() || undefined;
}

export function getHackathonContext(event: Hackathon):
  | {
      location: string;
      officialUrl: string;
    }
  | undefined {
  const research = researchFor(event);
  return research
    ? { location: research.location, officialUrl: research.officialUrl }
    : undefined;
}

/** Preserve supplied posts except the specifically disputed NexHack edition link. */
export function getHackathonSource(event: Hackathon):
  | {
      href: string;
      label: string;
    }
  | undefined {
  const research = researchFor(event);
  if (
    research?.id === "xgMMRuZ_ZHn-VH5kj-xbk" &&
    event.link === "https://www.instagram.com/p/Dcnhm6IBGN1/"
  ) {
    return { href: research.officialUrl, label: "Official event" };
  }
  const href = safeHackathonLink(event.link);
  if (href) return { href, label: "View event post" };
  // An explicitly removed link remains removed in the public page.
  return undefined;
}
