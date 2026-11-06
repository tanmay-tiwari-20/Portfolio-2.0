# Portfolio SEO implementation report

Prepared 6 November 2026. Preferred domain: **https://takneekitanmay.tech**.
Alternative deployment: **https://takneekitanmay.vercel.app**.

The repository now provides a consistent production identity, complete page
metadata, server-rendered structured data, synchronized discovery files,
social images, accessible content structure and targeted loading improvements.
These changes are local until the updated application is deployed. They do not
establish Google rankings, indexing, AI citations or a Core Web Vitals pass.

## Status and evidence

| Status                                  | Scope                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implemented and locally verified        | All 13 published pages: HTTP 200, unique titles/descriptions, production canonicals, index/follow, OG/Twitter metadata, JSON-LD checks, one H1, crawlable main content and internal links. XML sitemap parses with 13 entries. Unknown pages return 404. Private routes enforce authentication and noindex. |
| Implemented and locally verified        | Production build and TypeScript; targeted content, image, animation, SEO and authentication tests; anonymous route checks plus login, cookie, CSRF, refresh, renewal, logout replay and throttling checks using temporary credentials and isolated data.                                                    |
| Implemented and locally verified        | Desktop (1440px) and mobile (390px) browser checks across all 13 pages with JavaScript disabled. Hydrated navigation and reduced-motion checks. Browser image fixtures isolate layout from unavailable CDN access; they do not test real media quality or performance.                                      |
| Implemented but not externally verified | Live host redirects, production DNS/TLS, CDN image delivery, social previews on third-party platforms, production MongoDB content, production analytics collection, full Schema.org/Google validator results.                                                                                               |
| Requires owner action                   | Deploy, confirm live content/environment, verify Search Console and Bing ownership, submit sitemap, inspect live URLs and measure real performance. Exact steps below.                                                                                                                                      |
| Not applicable / deliberately omitted   | Framework migration, duplicate `/work` pages, artificial FAQs, unsupported education/employment/awards, reviews/ratings, paid keyword estimates, new tracking vendors, IndexNow without a publish hook.                                                                                                     |

Evidence is retained under `artifacts/seo/`. The report files describe each run's
scope. In particular, the initial full asset audit retains remote image proxy
failures; a passing local-only run must not be interpreted as verification of
Cloudinary availability. Browser fixtures are never used for Lighthouse scores.

Final rebuilt-application results:

- `artifacts/seo/final-audit.json`: **13 pages, 162 internal links, 46 local/share
  assets; 0 errors and 0 warnings** in the local-only scope. Ten alternate-host
  redirect cases and four canonical legacy/slash cases return a direct 308 with
  correct path/query handling; missing routes return 404.
- `artifacts/seo/browser-report.json`: **26 page/viewport checks**, two hydrated
  flows, reduced-motion and full Spider transitions, cleanup and H1 focus
  restoration; **0 JavaScript exceptions**.
- `artifacts/seo/social-images-verification.json`: all **13** social responses
  decoded as **1200×630 PNGs** (441,201 bytes combined).
- `artifacts/seo/admin-auth.json`: production-mode authentication checks passed.
  `artifacts/seo/build.log`: final production build/TypeScript passed. Full
  repository ESLint passed; final SEO/image/social unit run passed 18 tests,
  alongside the previously passed content, Spider and authentication suites.
- The final audit explicitly inventories **51 unverified remote/proxied media
  URLs** and **52 unverified external link destinations**. Its
  `--skip-remote-images` mode omits outbound requests, not failures. Earlier
  `local-production-audit.json` retains the network-blocked image proxy errors.

## Routes audited

The canonical content inventory and actual rendered metadata follow. All URLs
use HTTPS and omit a trailing slash except the equivalent origin `/` form.
Next.js normalizes the homepage metadata URL to the bare origin.

| Canonical path                        | Title                                                          | Meta description                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /                                     | Tanmay Tiwari \| Full-Stack Developer & HackShastra Co-founder | Tanmay Tiwari is a full-stack developer and HackShastra co-founder in New Delhi. Explore interactive web projects, hackathon mentoring and community work.           |
| /about                                | About Tanmay Tiwari \| Developer & Community Builder           | Meet Tanmay Tiwari, a full-stack developer in New Delhi and HackShastra co-founder. Read about his technical practice, experience and community involvement.         |
| /projects                             | Software & Interactive Web Projects \| Tanmay Tiwari           | Explore Tanmay Tiwari’s projects: Unoverse, Spools, Baithak and more. Browse real-time apps, 3D web experiences, source code and technical case studies.             |
| /hackathons                           | Hackathon Mentoring & Judging \| Tanmay Tiwari                 | Explore Tanmay Tiwari’s hackathon journal, with event-specific mentoring, judging and organizing roles, builder experiences and links to the events.                 |
| /hackshastra                          | HackShastra Community & Events \| Tanmay Tiwari                | Discover HackShastra, the student builder community co-founded by Tanmay Tiwari. Explore its hackathons, campus chapters, community events and official links.       |
| /contact                              | Contact Tanmay Tiwari \| Projects & Collaborations             | Contact Tanmay Tiwari for software projects, creative collaborations or community conversations. Find his email and official professional profiles.                  |
| /projects/unoverse                    | Unoverse \| Tanmay Tiwari                                      | Unoverse is a real-time 3D multiplayer UNO game built with Next.js, React Three Fiber, Express, Socket.IO, and TypeScript. It features a server-authoritative game…  |
| /projects/spools                      | Spools \| Tanmay Tiwari                                        | Spools is a social space for sharing ideas, finding your people, and building things together. It is a full-stack social app built with the MERN stack. Share short… |
| /projects/hackshastra-website         | HackShastra Website \| Tanmay Tiwari                           | This is an interactive, high-performance community platform and event management system built for the HackShastra community.                                         |
| /projects/baithak                     | Baithak \| Tanmay Tiwari                                       | Baithak is a video meeting and collaboration app built with Next.js. Its dashboard brings meeting creation, joining, scheduling, personal rooms, meeting history,…   |
| /projects/3d-shirt-showcaser          | 3D Shirt Showcaser \| Tanmay Tiwari                            | 3D Shirt Showcaser is an interactive web app using React, Three.js, and Tailwind CSS that lets users customize 3D shirt models with various textures and colors in…  |
| /projects/resumify                    | Resumify \| Tanmay Tiwari                                      | Resumify is a full-stack resume review web app that lets users upload resumes, preview them, get ATS-based scores, and receive detailed feedback with improvement…   |
| /projects/apple-iphone-15-pro-website | Apple iPhone 15 Pro Website \| Tanmay Tiwari                   | Apple iPhone 15 Pro Website is a React-based recreation of Apple's iPhone 15 Pro website. Featuring Tailwind CSS for responsive styling and Three.js for immersive…  |

Additional routes and resources:

| Route                                                                                 | Policy                                                                                                                                                                        |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/experience`                                                                         | Permanent 308 redirect to `/about`, excluded from sitemap. A 308 is a permanent HTTP redirect; it preserves the request method.                                               |
| `/work`                                                                               | No public route; the Work page is `/projects`. No duplicate page was created.                                                                                                 |
| Unknown paths and unknown/unpublished project slugs                                   | 404 with noindex; no redirect to the homepage.                                                                                                                                |
| `/secret-admin`                                                                       | Anonymous visitors redirect to login; authenticated session required. Noindex, nofollow, noarchive and private/no-store responses.                                            |
| `/secret-admin/login`                                                                 | Public login UI, noindex; server-side authentication and origin checks remain in place.                                                                                       |
| `/api/admin/content`, `/database`, `/media`, `/export`, `/import`, `/cloudinary-sign` | Protected APIs under `/api/admin`; unauthenticated reads return 401 where supported. Writes also require a permitted origin and session. Noindex headers, no sitemap entries. |
| `/api/admin/login`                                                                    | Authentication endpoint, protected by origin checks and rate limiting, noindex.                                                                                               |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`                                            | Search/discovery resources, excluded from content sitemap.                                                                                                                    |
| `/social/[key]`                                                                       | PNG share cards for the six main pages and published project slugs; 1200×630, noindex, unknown key returns 404.                                                               |
| `/icon.svg`, static CSS/JS/fonts/images                                               | Public rendering assets remain crawlable.                                                                                                                                     |

## Problems found and changes made

1. **Canonical inconsistency:** metadata and sitemap depended on a value that
   fell back to localhost. `lib/site.ts` now owns the verified production origin
   and six principal routes. A preview or stale environment variable cannot
   change canonicals. `next.config.ts` permanently redirects the known Vercel
   alternative and `www` host, preserving paths and queries, and normalizes
   trailing slashes. The legacy experience path is redirected before rendering.
2. **Incomplete metadata:** child pages had basic titles/descriptions, project
   pages had partial OG overrides, and `/og.svg` was a nonexistent fallback.
   `lib/seo.ts` now produces complete, unique metadata for every public page and
   project. `htmlLimitedBots: /.*/` keeps asynchronous metadata in the response
   head for every consumer; this intentionally trades some metadata wait time
   for predictable HTML without JavaScript.
3. **Incomplete entity information:** the homepage's isolated Person object was
   replaced by linked Person/WebSite/page/project/breadcrumb graphs. The common
   JSON-LD component escapes `<` to prevent content from terminating the script.
4. **False freshness signals:** the sitemap previously stamped current time on
   all principal URLs. It now uses the same route catalog and published project
   data as the application. `lastmod` is omitted because administrative edits
   and reordering are not reliable significant-content timestamps.
5. **Placeholder social identity:** generic LinkedIn/GitHub homepages and Alex
   Parker handles were present in seed data. Verified owner URLs now replace
   them; the unverified Instagram placeholder is unpublished. `publicSocials()`
   also resolves old database records safely for navigation, footer, contact,
   schema and llms.txt, without modifying the live database.
6. **Public content hygiene:** public profile/settings reads now filter
   unpublished records. Project pages, sitemap, share cards and llms.txt include
   only published projects. Verified Unoverse source URL was added to the JSON
   seed; no private repository or remote content store was accessed or changed.
7. **Content structure:** hero introductions identify the person/community and
   real work. Styled heading fragments retain word spaces in text extraction.
   Project gallery cards use H3 below their section H2, screenshot alternatives
   describe their context, project breadcrumbs are visible, and incomplete tab
   roles were replaced with ordinary labeled filter controls.
8. **Internal connections:** meaningful links connect Home/About to HackShastra,
   Hackathons to projects/community, the HackShastra website case study to its
   community page, and project pages to neighboring work. No thin keyword pages
   or repetitive FAQ blocks were introduced.

## Search intent, GEO and AEO

The focused research and page-by-page keyword/topic map are in
[`SEO_RESEARCH.md`](SEO_RESEARCH.md), with primary sources and limitations.
Branded professional discovery belongs on Home; background/practice on About;
work evaluation on Projects; specific product questions on individual case
studies; mentoring/judging roles on Hackathons; community context on HackShastra;
and professional contact on Contact. The community and its website case study
serve distinct purposes.

The implementation uses clear factual descriptions, crawlable source links,
consistent identity and readable HTML to support retrieval and attribution.
`llms.txt` is generated from public content as an optional navigation aid. It
does not guarantee discovery, indexing, ranking or AI citations. No AI-specific
schema, hidden answers or keyword stuffing was added.

The existing `User-agent: *` public crawl policy is deliberately preserved.
Googlebot/Bingbot search indexing and OAI-SearchBot/PerplexityBot search retrieval
can access public pages under that group. There are no permissive agent-specific
overrides that bypass private-route exclusions. GPTBot/ClaudeBot model-training
preferences are a separate policy choice; this SEO change does not silently
introduce a new training opt-out or claim that retrieval and training are the
same. Authentication protects private content regardless of robots compliance.

Existing owner-maintained community metrics and dated experience were retained;
team-reported reach/partner figures were not promoted into schema as independently
verified facts. No new educational credential was added.

## Structured data and sharing

`components/seo-json-ld.tsx` serializes server-rendered JSON-LD. `lib/seo.ts`
provides stable entity IDs and matching canonical URLs:

- Person and WebSite: actual profile, description, image and resolved owner
  profiles; no invented employer, qualification, rating or award.
- About: ProfilePage with the Person as main entity.
- Contact: ContactPage. Projects and Hackathons: CollectionPage.
- HackShastra: WebPage about the official Organization, with the visible
  co-founder relationship. This remains Tanmay's portfolio page, not an official
  organization homepage or a claim of sole ownership.
- Projects: WebPage with SoftwareSourceCode when a public source repository is
  available, otherwise CreativeWork. Actual title, description, tags, image,
  creator and source/live URLs; no fake release date or product review.
- BreadcrumbList on nested pages, including Home → Projects → project.

Every page references its own generated PNG at `/social/<page-key> or /social/project-<slug>`.
Cards use a consistent dark/red/gold design, actual page/project title, subject
and canonical domain. They need no external image service or new dependency.
Project keys are namespaced so a project named `about` cannot receive the About
page's preview. Project cards and `llms.txt` use `no-store` so unpublishing is
not delayed by a CDN cache; the six fixed page cards can be cached independently.
The Home, HackShastra and longest project card were visually inspected; PNG routes and dimensions were
checked. Social platform caches need refreshing after deployment.

## Performance and motion

- Kept the Next.js App Router's dynamic server rendering. Main content and
  links are present before hydration; no SSR/SSG migration was necessary.
- Request-scoped React caching deduplicates repository reads shared by layout,
  metadata and page. It does not create a persistent content cache or delay
  visibility of admin edits across requests.
- Removed six automatic Poppins weight preloads. Local fonts retain
  `font-display: swap`; the Inter body font remains preloaded.
- A responsive, meaningful hero image now renders on the server and preloads.
  WebGL enhancement starts after that image has painted and uses the same
  selected image source. The portrait remains visible if enhancement fails.
- Cloudinary transformations now resize after existing transformations so a
  source `w_1200` cannot undo mobile sizing. Automatic format/quality, responsive
  sizes and below-fold lazy loading are retained/improved; Next image delivery
  accepts AVIF and WebP.
- Three.js transition scene/capture/audio warmup now follows navigation intent,
  rather than competing with initial content on every load. Browser verification
  confirmed zero transition WebGL contexts on initial home load.
- Spider transitions retain fail-open behavior and cleanup. Reduced-motion
  preferences also suppress portrait intro/bursts/pointer effects and respond
  to preference changes. The current source contains no active first-visit
  Spider preloader—only legacy references/tests—so none was removed or invented.
- Existing Vercel Analytics is preserved once, excluded from admin routes.
  No additional analytics vendor or tracking script was added. Production
  collection and any account-level consent settings require owner verification.

### Measurement honesty

| Measurement                           | Before                          | After           | Target                                                  |
| ------------------------------------- | ------------------------------- | --------------- | ------------------------------------------------------- |
| Lighthouse SEO                        | Unavailable                     | Unavailable     | ≥95                                                     |
| Lighthouse Accessibility              | Unavailable                     | Unavailable     | ≥95                                                     |
| Lighthouse Best Practices             | Unavailable                     | Unavailable     | ≥95                                                     |
| Lighthouse mobile/desktop Performance | Unavailable                     | Unavailable     | ≥90 where realistic                                     |
| Field LCP / INP / CLS                 | No property/CrUX data available | Not established | LCP ≤2.5s; INP ≤200ms; CLS ≤0.1 at p75 per device class |

Lighthouse was not installed, outbound access was unavailable, and no reliable
before-build measurement existed. Functional Chrome runs with image fixtures
are not substitute performance measurements. Live image compression, bandwidth,
interaction latency and animation cost still need production measurement.

## Deploy and verify

1. Deploy this repository revision through the existing Vercel project. No
   remote push, deployment, DNS change or live MongoDB mutation was performed.
2. Make `takneekitanmay.tech` the primary Vercel domain; attach the alternative
   and `www` hosts only where DNS/TLS are configured. Confirm HTTPS certificates
   and permanent redirects. Keep unknown preview hosts protected; preview
   builds with `VERCEL_ENV=preview` emit `X-Robots-Tag: noindex, nofollow`.
3. Set `ADMIN_ORIGIN=https://takneekitanmay.tech`; retain strong server-only
   admin/session secrets and the existing production MongoDB/Cloudinary
   settings. No credentials belong in `NEXT_PUBLIC_*`. Canonical configuration
   comes from `lib/site.ts`; the documented site URL matches it.
4. In the live admin content store, compare the seven projects and social
   profiles with the repository. If MongoDB is enabled, seed-file changes do
   not update it. Set Unoverse's source to
   `https://github.com/tanmay-tiwari-20/Unoverse`, use the verified GitHub and
   LinkedIn URLs, and keep an unknown Instagram profile unpublished. Confirm
   team-reported metrics and any event/source links requiring owner review.
5. Run `npm run build`, then test the deployed response:
   `npm run audit:seo -- https://takneekitanmay.tech --external --out artifacts/seo/live-audit.json`.
   Review all external 4xx/5xx/redirect results in context; rate limits and
   access denials do not prove a link is broken. Confirm image loads visually.
6. Check `/`, `/about`, `/projects`, every project, `/hackathons`, `/hackshastra`,
   `/contact`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, a social PNG and an
   unknown path on the actual deployment. Verify an alternate-domain deep link
   ends at the matching preferred URL without loops; public assets remain
   crawlable and private pages remain inaccessible anonymously.
7. Use [Schema Markup Validator](https://validator.schema.org/) for schema
   vocabulary/structure and [Rich Results Test](https://search.google.com/test/rich-results)
   for Google's supported features. Valid Schema.org data does not necessarily
   qualify for a Google rich result.
8. Run Chrome Lighthouse mobile and desktop on Home, About, Projects, one
   representative project, Hackathons, HackShastra and Contact; retain HTML/JSON
   results and fix reproducible failures. Use PageSpeed Insights/CrUX or real
   user measurements for field vitals; INP is not inferred from a local TBT score.

## Google Search Console: exact owner actions

1. Open [Search Console](https://search.google.com/search-console/). Add a
   **Domain property** for `takneekitanmay.tech` (no protocol/path).
2. Copy Google's unique TXT record into the domain's DNS, wait for propagation,
   then click Verify. Keep the record. A URL-prefix property for
   `https://takneekitanmay.tech/` is an alternative when DNS access is unavailable;
   it covers only that prefix and needs its own supported verification method.
3. Under Sitemaps, submit **https://takneekitanmay.tech/sitemap.xml**. Confirm
   successful fetch and inspect discovered URL counts; discovery is not indexing.
4. Use URL Inspection on Home, About, Projects, all seven project pages,
   Hackathons, HackShastra and Contact. Run Test Live URL; verify the rendered
   page, robots access, successful response and user/Google-selected canonical.
   Request indexing for important changed pages after a successful live test.
5. Review Page indexing exclusions, duplicates, soft 404s and crawl failures;
   review Core Web Vitals by device. Use Performance reports to examine branded
   queries, project queries, organic landing pages, impressions, clicks and CTR.
6. Current Google guidance also documents **Settings → Search generative AI →
   Include** and a **Generative AI performance** report when sufficient
   impressions exist. Verify the property's setting and use the actual report,
   not assumptions about citations. See the current sources in `SEO_RESEARCH.md`.

## Bing Webmaster Tools: exact owner actions

1. Sign in at [Bing Webmaster Tools](https://www.bing.com/webmasters/). Import
   the verified Search Console property if offered, or add
   `https://takneekitanmay.tech/` manually.
2. Complete the offered ownership method (DNS, verification file or meta tag).
   Copy the account's real verification value; none was invented in source.
3. Submit **https://takneekitanmay.tech/sitemap.xml** under Sitemaps and confirm
   Bing can fetch it. Inspect the same primary/project URLs with URL Inspection.
4. Review Site Explorer, crawl/indexing reports and available Site Scan results;
   fix genuine exclusions or broken destinations before repeated submission.
5. Review Search Performance and, where available, AI Performance citation and
   grounding-query reports. IndexNow is not required for this small portfolio
   and was not added without a reliable content-publish integration.

## Access still required and remaining limitations

- Vercel deployment/domain settings, DNS administration, Google Search Console
  and Bing Webmaster property access were not connected.
- Production MongoDB content, production Cloudinary responses and Vercel
  Analytics collection remain externally unverified. Use existing credentials
  in the provider's settings; do not paste secrets into the report or repository.
- Check Vercel Web Analytics for page views/referrers and contact landing-page
  journeys. Email clicks are intent, not confirmed delivered inquiries. Custom
  contact events were not added without a configured measurement/consent plan.
- Both shell and web-connector live-site fetches failed in this environment.
  Automatic approval review rejected an escalated read-only HTTPS check because
  the review itself failed (`content-blocked`); it did not determine the site
  unsafe. This does not prove downtime. External checks remain the final owner
  action after deployment.

## Important files and repeatable checks

Configuration: `lib/site.ts`, `lib/seo.ts`, `app/layout.tsx`, `next.config.ts`,
`proxy.ts`, `.env.example`. Search resources: `app/sitemap.ts`, `app/robots.ts`,
`app/llms.txt/route.ts`, `app/social/[key]/route.tsx`. Public content: all page
files, relevant About/Work/Hackathons/HackShastra/Home components and JSON seeds.
Performance: `lib/db/repository.ts`, `lib/cloudinary/urls.ts`,
`components/hero-portrait.tsx`, `components/animations/page-transition.tsx`,
`components/animations/dither-veil.tsx`.

Tests: `scripts/seo-audit.mjs`, `scripts/seo.test.ts`,
`scripts/seo-browser.mjs`, `scripts/image-delivery.test.ts`, and the existing
content, admin and Spider regression suites. Run `npm run test:seo`,
`npm run typecheck`, `npm run lint`, `npm run build`, and `npm run audit:seo`
against a running production server. The browser script accepts the installed
Playwright module and Chrome executable via environment variables; fixtures
are documented in its header. No production dependency was added.
