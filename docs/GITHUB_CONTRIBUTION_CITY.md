# GitHub contribution city

The city uses a checked, local snapshot for `tanmay-tiwari-20`. Visitors never make authenticated requests to GitHub, and the browser never receives a token.

## Daily automatic refresh

`.github/workflows/refresh-github-contributions.yml` runs daily at **08:17 IST (02:47 UTC)**, on changes to the refresh pipeline in `main`, and through the Actions **Run workflow** button. It runs on GitHub's servers, independently of your computer. After setup, no daily manual fetch is needed.

One-time activation:

1. Open [this repository's Actions secrets](https://github.com/tanmay-tiwari-20/Portfolio-2.0/settings/secrets/actions/new). Create `GH_CONTRIBUTIONS_TOKEN` using the public-profile token that already worked locally. Keep the token's value out of commits and chat. The token must remain valid; replace the secret if it expires or is revoked.
2. Publish the city, generated snapshot, fetch script, and workflow to the repository's default branch, `main`. The workflow cannot run while these files exist only locally.
3. Confirm **Refresh GitHub contribution city** succeeds in the repository's Actions tab, then confirm Vercel deploys the new commit. The repo's existing Vercel connection was verified from its successful commit status. Keep automatic production deployments from `main` enabled.

The job installs the existing dependencies, fetches real GitHub data, validates the generated snapshot, and commits only `data/github-contributions.json` when calendar content changes. Timestamp-only reruns leave the file untouched. The GraphQL query uses the separate read credential; publishing uses GitHub Actions' short-lived token with repository contents write access. Commits are attributed to `github-actions[bot]`, so the refresh does not manufacture personal contribution activity.

Runs are serialized. A non-force push/rebase retry preserves concurrent human commits; a conflict or failed refresh stops the job rather than overwriting work. GitHub's workflow result exposes failures. Protected-branch rules must permit this automation's snapshot update; the workflow does not bypass them.

Vercel's connected [Git integration deploys branch pushes](https://vercel.com/docs/git/vercel-for-github), rebuilding the bundled JSON into the live chart. A separate push-triggered GitHub Actions deployment would not be triggered by this bot's token; if deployment is moved into Actions, invoke it explicitly from this job. If Vercel's project policy blocks a bot deployment, configure the project's allowed bot access or a Vercel deploy hook before considering automation fully active.

[GitHub's scheduled jobs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) can run later than their scheduled time; 08:17 is a target, not an exact-time guarantee. Public repository schedules can be disabled after 60 days without repository activity. A normal daily snapshot commit keeps this repository active while the workflow is running successfully.

## Optional local refresh

1. Use the repository's Node.js 22+ setup and installed dependencies.
2. Add `GITHUB_TOKEN=...` to the ignored `.env.local` file, or authenticate GitHub CLI with `gh auth login`. A token that can read public profile data is sufficient; private repository access is not needed for the public contribution calendar. Never use a `NEXT_PUBLIC_` token variable or paste the token into source files.
3. Run `npm run fetch:github`.
4. Review and commit `data/github-contributions.json`, then rebuild/redeploy the portfolio.

The command can also run as `node scripts/fetch-github.mjs`. It uses the existing `tsx` dependency to load the shared TypeScript validator. Environment variables already set in the process take precedence; otherwise `.env.local` is loaded before `.env`.

The script sends one GraphQL query to GitHub for `user(login: "tanmay-tiwari-20").contributionsCollection.contributionCalendar`, requesting `totalContributions` and `weeks.contributionDays { date contributionCount contributionLevel }`. It retains GitHub's five contribution levels, flattens the weeks into chronological days, validates the records, and writes compact JSON atomically. GitHub's reported annual total is preserved even when it differs from the sum of daily counts. Ties for maximum contributions select the earliest date; an all-zero calendar has no highlighted peak.

The snapshot contains username, reported total, first/last date, generation timestamp, every daily record, and the maximum day. The date range is GitHub's default trailing contribution year at fetch time. The scheduled workflow handles routine updates; this local command remains available for development. No authenticated visitor request is installed. If private activity is missing, check GitHub's “Include private contributions on my profile” setting.

Authentication failures, HTTP errors, GraphQL errors, missing profiles, and malformed calendars fail visibly without overwriting the last valid file. No synthetic activity is generated. The command prints only public contribution metadata and sanitized failure messages.

## Data verification

Run `npm run test:github` to check partial-week flattening, chronological and valid dates, duplicate detection, GitHub levels, retained reported totals, maximum-day ties, and empty activity.

The initial real snapshot was fetched successfully by the owner on 4 November 2026 and passes the shared validator: **358 contributions**, **368 daily records**, **2 November 2025–4 November 2026**, and a maximum of **10 contributions on 24 December 2025**. The compact file is 27,825 bytes. These values are evidence for the initial fetch, not constants used by the renderer; future refreshes use the new API result. GitHub may include a partial calendar week, so the script preserves the returned dates instead of forcing exactly 365 records.

## Rendering and integration

The references are [02. As a city](https://www.avivashishta.com/lab/commits) and the author's [implementation guide](https://www.avivashishta.com/blog/animate-github-contribution-graph-portfolio). The live reference and complete guide were reviewed before implementation.

The shared server component appears after the Work hero and before the project gallery. Every individual project route supplies the same component to the case-study template's `afterHero` slot, immediately before the overview. Its background inherits the existing Work page's paper surface, as requested in the final design direction. Local Poppins/Inter fonts, Georgia accents, burgundy text, and wine/terracotta buildings match the surrounding page.

`createCityLayout` precomputes actual UTC week/weekday positions, oblique projection, face colours, square-root heights, and drawing order. Every supplied day is represented; zero days are flat foundation pads. Canvas 2D draws the side, front, and lit roof with a fine architectural edge. Picking reverses the painter order and tests the visible polygons, so nearer buildings win overlapping hits.

The construction lasts 2.8 seconds. A deterministic spatial delay carries the rise from Sunday/back rows toward Saturday/front rows, with a small chronological offset and restrained overshoot. The last buildings settle before the peak leader starts at 2.28 seconds. The highlighted date comes from the validated snapshot, with earliest-date tie handling. No statistics, streaks, or activity are synthesized.

Hover displays exact date/count information; tap or click pins a selection. The date control gives access to every day, including occluded buildings. Keyboard arrows move by day or week, Home/End jump to the period boundaries, and Escape clears the selection. Selection changes are announced in a polite live region. Replay resets elapsed time and selection without moving the layout.

The canvas measures its own container. Below 600 CSS pixels, the year splits into two chronological districts with larger buildings; the matching container query reserves 560px instead of 390px. Tooltip and peak labels are bounded inside the canvas, and device-pixel ratio is capped at two. No animation library or new dependency was added.

IntersectionObserver starts construction when the graph is visible. One requestAnimationFrame loop runs only during construction or a requested update. It stops when complete, offscreen, hidden, or covered by the existing page transition. Observers, listeners, and frames are removed on unmount. Existing portfolio capture, transition, and preloader events pause/resume the city without creating a separate loader. Reduced motion draws the finished frame immediately; replay keeps it static.

Two server-rendered SVG projections provide a complete city before hydration or if canvas cannot initialize. Enhancement hides the static drawing before construction begins and restores it if drawing fails. The expandable daily table remains available without JavaScript. The validated JSON is imported into the server bundle, so Docker's mutable `/app/data` volume cannot mask it. Production updates require refreshing the JSON and rebuilding/redeploying.

## Files

Created:

- `.github/workflows/refresh-github-contributions.yml` — daily refresh, validation, and snapshot publishing.
- `scripts/fetch-github.mjs` — authenticated data preparation for local use and Actions; skips unchanged calendars.
- `data/github-contributions.json` — real generated public calendar.
- `lib/github-contributions.ts` — types, validation, flattening, and peak selection.
- `lib/get-github-contributions.ts` — cached server-only snapshot access.
- `lib/contribution-city.ts` — projection, geometry, shading, timing, drawing, and picking.
- `components/work/contribution-city.tsx` — shared section, SVG fallback, and daily table.
- `components/work/contribution-city-canvas.tsx` — animation lifecycle and interaction.
- `components/work/contribution-city.module.css` — page-matched styling and responsive layout.
- `scripts/github-contributions.test.ts` and `scripts/contribution-city.test.ts` — data and geometry checks.
- `docs/GITHUB_CONTRIBUTION_CITY.md` — this implementation and setup report.

Modified:

- `app/projects/page.tsx` — Work page insertion.
- `app/projects/[slug]/page.tsx` and `components/work/project-case-study.tsx` — shared project insertion.
- `scripts/work-content.test.ts` — verify the after-hero composition while preserving existing project tests.
- `package.json` — fetch and data-test commands.
- `.env.example` — server-only token setup guidance, with no credential value.
- `README.md` — one-time daily refresh activation instructions.

## Verification and limits

- TypeScript and targeted ESLint checks pass.
- Data, geometry, and Work tests pass. Reproduce with `node node_modules/tsx/dist/cli.mjs --test scripts/contribution-city.test.ts scripts/github-contributions.test.ts scripts/work-content.test.ts`. The daily refresh adds coverage ensuring timestamp-only reruns are ignored while changes to dates, counts, levels, and GitHub's reported total are retained.
- Workflow YAML, schedule, token scope, and serialized execution were checked locally. Activation and the first hosted run require the repository secret and publication to `main`.
- Data/geometry tests cover the real snapshot, GitHub total preservation, calendar boundaries, invalid data, maximum ties, square-root heights, reveal order, overshoot bounds, frontmost picking, and phone district layout.
- Existing Work rendering tests cover all seven project templates; the added composition check verifies hero → city → overview ordering.
- Production webpack build passes using local JSON repository mode (`MONGODB_URI` empty for the verification process only). With the existing live MongoDB configuration, production compilation passed but sitemap generation failed because the sandbox could not reach MongoDB. No database settings were changed on disk.
- The final production server returned HTTP 200 for the Work listing and all seven project routes, each with exactly one city, the real snapshot, and server-rendered SVG geometry. Desktop and mobile geometry were also rendered to PNG and visually inspected; these are geometry checks, not browser screenshots.
- Interactive browser verification could not run: the browser tool's automatic approval service repeatedly failed or timed out before execution, including after the user's explicit retry authorization. Actual browser performance, pointer/touch interaction, reduced-motion emulation, and client-navigation behavior remain unverified in-browser. Their implementations were checked in code; they are not reported as successful browser tests.
- Once activated, the workflow refreshes the snapshot daily and the connected deployment rebuilds the chart. `npm run fetch:github` is an optional local override. A token is required only when refreshing, never for page visitors or ordinary builds.
