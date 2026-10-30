import type { Experience, Project } from "@/lib/validators/schemas";

export const BUILDERS_MENTORED_COUNT = 3000;

function yearsIn(value: string): number[] {
  return (value.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number);
}

export function getYearsCreating(
  projects: readonly Pick<Project, "year">[],
  experiences: readonly Pick<Experience, "period">[],
  now = new Date(),
) {
  const recordedYears = [
    ...projects.flatMap((project) => yearsIn(project.year)),
    ...experiences.flatMap((experience) => yearsIn(experience.period)),
  ];
  const firstYear = recordedYears.length
    ? Math.min(...recordedYears)
    : now.getFullYear();

  // Count calendar years with published work, including the current year.
  return Math.max(1, now.getFullYear() - firstYear + 1);
}

export function getPortfolioMetrics(
  projects: readonly Pick<Project, "year">[],
  experiences: readonly Pick<Experience, "period">[],
) {
  return [
    { label: "Projects shipped", value: projects.length },
    { label: "Builders mentored", value: BUILDERS_MENTORED_COUNT },
    {
      label: "Years creating",
      value: getYearsCreating(projects, experiences),
    },
  ];
}
