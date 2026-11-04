export const CONTRIBUTION_LEVELS = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
] as const;

export type ContributionLevel = (typeof CONTRIBUTION_LEVELS)[number];

export interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: ContributionLevel;
}

export interface ContributionData {
  username: string;
  totalContributions: number;
  startDate: string;
  endDate: string;
  generatedAt: string;
  days: ContributionDay[];
  maxDay: ContributionDay | null;
}

/** A rerun with identical activity should not create a timestamp-only commit. */
export function hasContributionChanges(
  previous: ContributionData,
  next: ContributionData,
): boolean {
  const content = (data: ContributionData) => [
    data.username,
    data.totalContributions,
    data.startDate,
    data.endDate,
    data.days.map((day) => [
      day.date,
      day.contributionCount,
      day.contributionLevel,
    ]),
  ];
  return JSON.stringify(content(previous)) !== JSON.stringify(content(next));
}

const DAY_MS = 86_400_000;

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid contribution data: ${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function date(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new Error(
      `Invalid contribution data: ${label} must be a real ISO date.`,
    );
  }
  return value;
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      `Invalid contribution data: ${label} must be a nonnegative integer.`,
    );
  }
  return value;
}

function parseDay(value: unknown): ContributionDay {
  const day = object(value, "day");
  const contributionCount = nonnegativeInteger(day.contributionCount, "count");
  if (
    !CONTRIBUTION_LEVELS.includes(day.contributionLevel as ContributionLevel)
  ) {
    throw new Error(
      "Invalid contribution data: unknown GitHub contribution level.",
    );
  }
  if ((contributionCount === 0) !== (day.contributionLevel === "NONE")) {
    throw new Error(
      "Invalid contribution data: count and contribution level disagree.",
    );
  }
  return {
    date: date(day.date, "day date"),
    contributionCount,
    contributionLevel: day.contributionLevel as ContributionLevel,
  };
}

/** Dates are sorted ascending, so keeping the first maximum resolves ties. */
export function findMaximumDay(
  days: readonly ContributionDay[],
): ContributionDay | null {
  let maximum: ContributionDay | null = null;
  for (const day of days) {
    if (day.contributionCount > (maximum?.contributionCount ?? 0))
      maximum = day;
  }
  return maximum;
}

/** Validate imported snapshots without replacing GitHub's independently reported total. */
export function parseContributionData(value: unknown): ContributionData {
  const data = object(value, "calendar");
  if (
    typeof data.username !== "string" ||
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(data.username) ||
    data.username.includes("--")
  ) {
    throw new Error("Invalid contribution data: invalid GitHub username.");
  }
  if (
    !Array.isArray(data.days) ||
    data.days.length < 1 ||
    data.days.length > 371
  ) {
    throw new Error(
      "Invalid contribution data: expected a calendar of 1–371 days.",
    );
  }
  const days = data.days.map(parseDay);
  for (let index = 1; index < days.length; index++) {
    if (
      Date.parse(days[index].date) - Date.parse(days[index - 1].date) !==
      DAY_MS
    ) {
      throw new Error(
        "Invalid contribution data: days must be consecutive and chronological.",
      );
    }
  }
  const startDate = date(data.startDate, "start date");
  const endDate = date(data.endDate, "end date");
  if (startDate !== days[0].date || endDate !== days[days.length - 1].date) {
    throw new Error(
      "Invalid contribution data: period does not match daily records.",
    );
  }
  if (
    typeof data.generatedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
      data.generatedAt,
    ) ||
    !Number.isFinite(Date.parse(data.generatedAt))
  ) {
    throw new Error(
      "Invalid contribution data: generatedAt must be a UTC timestamp.",
    );
  }
  date(data.generatedAt.slice(0, 10), "generation date");
  const maxDay = findMaximumDay(days);
  const declaredMaximum = data.maxDay === null ? null : parseDay(data.maxDay);
  if (
    maxDay?.date !== declaredMaximum?.date ||
    maxDay?.contributionCount !== declaredMaximum?.contributionCount ||
    maxDay?.contributionLevel !== declaredMaximum?.contributionLevel
  ) {
    throw new Error(
      "Invalid contribution data: maximum must be the earliest highest-count day.",
    );
  }
  return {
    username: data.username,
    totalContributions: nonnegativeInteger(data.totalContributions, "total"),
    startDate,
    endDate,
    generatedAt: data.generatedAt,
    days,
    maxDay,
  };
}

/** Flatten the API's partial Sunday-first weeks while retaining every actual day. */
export function prepareContributionData(
  username: string,
  value: unknown,
  generatedAt: string,
): ContributionData {
  const calendar = object(value, "API calendar");
  if (!Array.isArray(calendar.weeks) || calendar.weeks.length === 0) {
    throw new Error(
      "Invalid contribution data: GitHub returned no calendar weeks.",
    );
  }
  const days = calendar.weeks.flatMap((value) => {
    const week = object(value, "week");
    if (
      !Array.isArray(week.contributionDays) ||
      week.contributionDays.length > 7
    ) {
      throw new Error("Invalid contribution data: invalid calendar week.");
    }
    return week.contributionDays.map(parseDay);
  });
  days.sort((a, b) => a.date.localeCompare(b.date));
  return parseContributionData({
    username,
    totalContributions: calendar.totalContributions,
    startDate: days[0]?.date,
    endDate: days[days.length - 1]?.date,
    generatedAt,
    days,
    maxDay: findMaximumDay(days),
  });
}
