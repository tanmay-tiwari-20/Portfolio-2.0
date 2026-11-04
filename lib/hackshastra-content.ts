import type { HackShastraEvent } from "@/components/hackshastra/event-archive";
import { hackshastraEvents } from "@/data/hackshastra";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import type { CommunityEvent } from "@/lib/validators/schemas";

// Snapshot at research time, 5 November 2026. Do not derive this comparison
// from the editable JSON collection: a later rebuild must still honor edits.
const originalEvents: ReadonlyArray<
  Pick<CommunityEvent, "id" | "link" | "date" | "description">
> = [
  {
    id: "event-01",
    link: "https://unstop.com/hackathons/hackshastra-hackshastra-1544473",
    date: "20-09-2025",
    description:
      "HackShastra 1.0 is the first hackathon by our community, marking the beginning of many more innovations to come.",
  },
  {
    id: "event-02",
    link: "https://luma.com/n17f71yg",
    date: "27-07-2025",
    description:
      "HackShastra Pre-Meetup was the first tech event of the HackShastra community, bringing developers together to connect and kickstart the community.",
  },
  {
    id: "-diqvGFp-0K1HPL4OkIyS",
    link: "https://unstop.com/hackathons/snowhackipec-hackshastra-1613746",
    date: "31-01-2026",
    description: "IPEC's annual winter hackathon organized by HackShastra.",
  },
  {
    id: "e81z2KHrFdbHa8HTO3dus",
    link: "https://unstop.com/competitions/texpo-2026-student-innovation-and-industry-technology-expo-srm-university-srmap-andhra-pradesh-1638340",
    date: "26-02-2026",
    description:
      "TEXPO 2026 brings together students, faculty, startups, and technology companies on a single platform, creating opportunities for exposure, validation, collaboration, and talent discovery.",
  },
  {
    id: "Dd2i-5c16PFmLlQS_VI3K",
    link: "https://unstop.com/hackathons/shubhshastra-subharti-university-meerut-uttar-pradesh-india-1663561",
    date: "28-03-2026",
    description:
      "ShubhShastra is a 24-hour National Level AI Hackathon being organized through a collaboration between HackShastra and Subharti University, Meerut.",
  },
  {
    id: "cG77mPg9fcm2DoI1jD0fC",
    link: "https://unstop.com/p/grand-hack-ipec-hackshastra-1704703",
    date: "26-09-2026",
    description:
      "Grand Hack IPEC is a 24-hour national-level offline hackathon organized by HackShastra in collaboration with Inderprastha Engineering College (IPEC), Ghaziabad.",
  },
];

const originalsById = new Map(originalEvents.map((event) => [event.id, event]));
const researchByUrl = new Map(
  hackshastraEvents.map((event) => [event.href, event]),
);
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function parseEventDate(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  // Reject impossible dates rather than allowing JavaScript to roll them over.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function safeEventLink(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? value
      : "";
  } catch {
    return "";
  }
}

/** Reconcile the live admin collection with narrowly matched research notes. */
export function resolveHackShastraEvents(
  records: readonly CommunityEvent[],
): HackShastraEvent[] {
  const sorted = records
    .filter((record) => record.isPublished !== false)
    .map((record, index) => ({
      record,
      index,
      date: parseEventDate(record.date),
    }))
    .sort(
      (a, b) =>
        (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity) ||
        a.index - b.index,
    );
  const reservedIds = new Set(sorted.map(({ record }) => record.id));
  const usedIds = new Set<string>();

  return sorted.map(({ record, date }) => {
    const original = originalsById.get(record.id);
    const research =
      original?.link && record.link === original.link
        ? researchByUrl.get(original.link)
        : undefined;
    // Usually IDs are unique already. Keep malformed/imported duplicates from
    // producing duplicate accordion regions without dropping their content.
    let id = record.id;
    let occurrence = 2;
    while (usedIds.has(id)) {
      do {
        id = `${record.id}--${occurrence++}`;
      } while (reservedIds.has(id));
    }
    usedIds.add(id);

    const image = record.image?.url ?? "";
    return {
      id,
      title: record.title,
      date:
        research && record.date === original?.date
          ? research.date
          : date
            ? dateFormatter.format(date)
            : record.date,
      location: record.venue,
      role: research?.role ?? "Community event",
      description:
        research && record.description === original?.description
          ? research.description
          : record.description,
      image: isCloudinaryImageUrl(image) ? image : "",
      href: safeEventLink(record.link),
    };
  });
}
