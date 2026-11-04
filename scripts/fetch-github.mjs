import { execFileSync } from "node:child_process";
import { loadEnvFile } from "node:process";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tsImport } from "tsx/esm/api";

const {
  prepareContributionData,
  parseContributionData,
  hasContributionChanges,
} = await tsImport("../lib/github-contributions.ts", import.meta.url);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "data/github-contributions.json");
const USERNAME = "tanmay-tiwari-20";
const QUERY = `query ContributionCity($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount contributionLevel }
        }
      }
    }
  }
}`;

async function main() {
  // Existing process variables win; the local override is loaded before .env.
  for (const filename of [".env.local", ".env"]) {
    try {
      loadEnvFile(resolve(ROOT, filename));
    } catch (error) {
      if (error.code !== "ENOENT")
        throw new Error(`Could not load ${filename}.`);
    }
  }

  let token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    try {
      token = execFileSync(
        "gh",
        ["auth", "token", "--hostname", "github.com"],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          timeout: 10_000,
          windowsHide: true,
        },
      ).trim();
    } catch {
      throw new Error(
        "GitHub authentication is unavailable. Set GITHUB_TOKEN in .env.local or run gh auth login, then rerun npm run fetch:github. No contribution data was generated.",
      );
    }
  }
  if (!token) throw new Error("GitHub authentication returned an empty token.");

  let response;
  try {
    response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "tanmay-portfolio-contribution-city",
      },
      body: JSON.stringify({ query: QUERY, variables: { username: USERNAME } }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error(
      "Could not reach GitHub GraphQL. Check network access and retry; the previous snapshot is unchanged.",
    );
  }
  if (!response.ok) {
    const hint =
      response.status === 401 || response.status === 403
        ? "Check that GITHUB_TOKEN is valid, unexpired, and can read this public profile."
        : "Retry later; GitHub may be temporarily unavailable or rate limited.";
    throw new Error(`GitHub GraphQL returned HTTP ${response.status}. ${hint}`);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "GitHub returned an unreadable response; the previous snapshot is unchanged.",
    );
  }
  // Never log response bodies, headers, environment variables, or raw fetch errors.
  if (body.errors?.length) {
    throw new Error(
      "GitHub GraphQL rejected the calendar query. Check the token's access and API rate limit; the previous snapshot is unchanged.",
    );
  }
  if (!body.data?.user)
    throw new Error(`GitHub could not find the public profile ${USERNAME}.`);

  const data = prepareContributionData(
    USERNAME,
    body.data.user.contributionsCollection?.contributionCalendar,
    new Date().toISOString(),
  );
  let previous = null;
  try {
    previous = parseContributionData(
      JSON.parse(await readFile(OUTPUT, "utf8")),
    );
  } catch {
    // A missing/invalid snapshot is replaced only after a successful API query.
  }
  if (previous && !hasContributionChanges(previous, data)) {
    console.log(
      "GitHub contribution calendar is unchanged; kept the existing snapshot.",
    );
    return;
  }
  await mkdir(dirname(OUTPUT), { recursive: true });
  const temporary = `${OUTPUT}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(data)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporary, OUTPUT);
  } finally {
    await unlink(temporary).catch(() => {});
  }
  console.log(
    `Saved ${data.days.length} real GitHub days for @${data.username} to data/github-contributions.json.`,
  );
  console.log(
    `Period: ${data.startDate} to ${data.endDate}. GitHub total: ${data.totalContributions}.`,
  );
  console.log(
    data.maxDay
      ? `Peak: ${data.maxDay.contributionCount} contributions on ${data.maxDay.date} (earliest date wins ties).`
      : "There are no contributions in this period.",
  );
}

main().catch((error) => {
  console.error(`Contribution update failed: ${error.message}`);
  process.exitCode = 1;
});
