# SEO research and search-intent decisions

Reviewed 6 November 2026, Asia/Calcutta. This document records relevant sources and
the reasoning behind the implementation. It is not a keyword-volume study, a
ranking report, or evidence that a search engine has indexed the deployment.

## Identity and evidence

The user confirmed `https://takneekitanmay.tech` as the main deployment and
`https://takneekitanmay.vercel.app` as the alternative. The custom domain is the
preferred canonical origin; preserving paths when redirecting the alternative
avoids maintaining two competing copies.

Repository evidence: `data/profile.json`, `data/experiences.json`,
`data/projects.json`, `data/hackathons.json`, `data/community-events.json`,
`data/hackshastra.ts`, and the existing source notes in
`docs/HACKSHASTRA_RESEARCH.md`. The work page is `/projects`, not `/work`.
The old `/experience` path redirects permanently to `/about`.

Focused public searches covered `"Tanmay Tiwari" "HackShastra"`,
`"takneekitanmay" portfolio`, and `"Tanmay Tiwari" "Unoverse"`.
They surfaced the following useful primary evidence:

- [HackShastra About](https://www.hackshastra.in/about) names Tanmay Tiwari
  among the five founders/architects and explains the community's development.
- [Tanmay's LinkedIn profile](https://in.linkedin.com/in/tanmay-tiwari20)
  connects the same name, Delhi location, HackShastra and education. Repository
  dates take precedence over stale event biography text for past employment.
- [Unoverse source repository](https://github.com/tanmay-tiwari-20/Unoverse)
  is public and supports the project's real-time 3D UNO description and stack.
- [HackShastra Pre-Meetup organizer page](https://luma.com/n17f71yg) identifies
  Tanmay and HackShastra as hosts. This supports a specific event relationship,
  not a generic claim that every listed event was organized by Tanmay.
- [hackCBS 8.0 lineup](https://hackcbs-8.devfolio.co/lineup) provides contextual
  evidence for the developer/community identity. Do not turn an old event
  biography into a claim of current employment.

Name-only searches also surface unrelated people. Consistent full name,
canonical URL, owner profile URLs, project sources and visible community
context are the appropriate disambiguation signals. Social network homepage
URLs and placeholder handles are not valid `sameAs` identifiers.

No search volume, difficulty, ranking position, backlinks or AI citation counts
were available. The opportunities below are a relevance-led strategy based on
actual work and observable entity context, not measured demand estimates.

## Page-by-page intent map

The words in this table guide descriptive titles and useful visible content;
they should not be repeated mechanically or inserted as meta keywords.

| Canonical path                          | Main intent and topic                                          | Supporting/long-tail queries                                                           | Useful content and internal connections                                                                       |
| --------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/`                                     | Branded professional discovery: Tanmay Tiwari, Takneeki Tanmay | Who is Tanmay Tiwari? Tanmay Tiwari creative developer; full-stack developer portfolio | Concise identity, actual skills, selected projects; links to About, Work, Hackathons and HackShastra          |
| `/about`                                | Background and expertise: Tanmay Tiwari developer background   | What technologies does Tanmay Tiwari work with? Tanmay Tiwari education and experience | Verified biography and dated experience; link to project examples and community role                          |
| `/projects`                             | Work evaluation: Tanmay Tiwari projects                        | React and Next.js portfolio projects; full-stack and Three.js projects                 | Overview and crawlable links to all published project pages; avoid duplicating the home biography             |
| `/projects/unoverse`                    | Project discovery: Unoverse 3D multiplayer UNO                 | Unoverse Next.js Socket.IO; multiplayer UNO WebRTC voice chat                          | State what the game does, distinguish server-authoritative logic from 3D rendering, link live game and source |
| `/projects/spools`                      | Project discovery: Spools social app                           | MERN social app Circles; Spools real-time chat                                         | Explain posts, Circles, Spool series and chat; link source and related work                                   |
| `/projects/hackshastra-website`         | Technical case study: HackShastra website                      | HackShastra Next.js community platform; event management website                       | Explain the website project and actual stack; link `/hackshastra` for community context and official site     |
| `/projects/baithak`                     | Project discovery: Baithak meeting app                         | Baithak Next.js video meetings; Stream Video Clerk project                             | Explain meetings, scheduling, rooms and recordings; link live app/source                                      |
| `/projects/3d-shirt-showcaser`          | Technical demonstration: 3D Shirt Showcaser                    | React Three.js shirt customization; interactive 3D product visualization               | Describe texture/color customization and technologies without claiming commercial outcomes                    |
| `/projects/resumify`                    | Project discovery: Resumify resume review app                  | Resumify ATS feedback; React TypeScript resume review project                          | Explain upload, preview and feedback; present scoring as app behavior, not an employer-certified outcome      |
| `/projects/apple-iphone-15-pro-website` | Technical demonstration: iPhone 15 Pro website recreation      | React Three.js GSAP iPhone website recreation                                          | Clearly identify it as a recreation, with actual stack and source; do not imply Apple affiliation             |
| `/hackathons`                           | Role and experience discovery: Tanmay Tiwari hackathons        | Tanmay Tiwari hackathon mentor; hackathon judging and participation                    | Distinguish participant, mentor, judge and organizer records; connect to community/project context            |
| `/hackshastra`                          | Community context: Tanmay Tiwari and HackShastra               | What is HackShastra? Tanmay Tiwari HackShastra co-founder                              | Describe the community and Tanmay's relationship; official sources/events and website case study              |
| `/contact`                              | Professional contact: contact Tanmay Tiwari                    | Work with Tanmay Tiwari; Tanmay Tiwari GitHub LinkedIn                                 | Direct email and actual owner profiles; relevant invitation to collaborate                                    |

This separation prevents the community page and the community-website case
study from targeting the same purpose. Existing content can directly answer
natural questions in short introductions and descriptive headings; repeated
artificial FAQ sections are unnecessary.

## Technical decisions and current sources

| Decision                                                    | Source and practical application                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep Next.js server rendering and send real content in HTML | [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) supports server rendering for readers and crawlers that do not execute JavaScript. Inspect HTTP HTML, meaningful anchors and HTTP statuses; avoid a framework migration.                                                                                                                                                    |
| Use one canonical production URL per page                   | [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) recommends consistent canonical signals and absolute canonical URLs. Align metadata, sitemap and permanent host redirects.                                                                                                                                                                                                               |
| Use accurate sitemap freshness only                         | [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [lastmod guidance](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping) tie lastmod to significant actual changes. Do not stamp the current time on every sitemap request; omit freshness when it cannot be maintained.                                                                                                |
| Base GEO on accessible, useful content                      | [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) says ordinary SEO requirements apply; no special AI markup or machine-readable file is required. Content should be textual, internally linked and consistent with its structured data.                                                                                                                                                                       |
| Keep schema factual and specific                            | [Schema.org SoftwareSourceCode](https://schema.org/SoftwareSourceCode) describes code and its repository; use it only when the project has a real public source URL. A CreativeWork remains appropriate when no source repository is supplied. Use Person, WebSite, suitable page types and meaningful breadcrumbs.                                                                                                                                          |
| Do not expect FAQ rich results                              | [Google documentation updates](https://developers.google.com/search/updates) state that FAQ rich results stopped appearing on 7 May 2026 and their documentation was removed on 15 June 2026. Do not manufacture FAQs or schema to chase this retired feature.                                                                                                                                                                                               |
| Separate retrieval crawling from training                   | [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) identifies PerplexityBot as search discovery and Perplexity-User as user-directed retrieval, neither as foundation-model training. Training policy is a separate decision. Public-page access does not grant access to authenticated data.                                                                                                                 |
| Treat llms.txt as an optional navigation aid                | [Google AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) explicitly states that Google ignores llms.txt for rankings and visibility. If provided for other systems, keep it concise, public, factual and generated from published content.                                                                                                                                                            |
| Measure actual user experience                              | [web.dev Web Vitals](https://web.dev/articles/vitals) sets good targets at LCP ≤2.5s, INP ≤200ms and CLS ≤0.1, all at the 75th percentile split by mobile/desktop. A local Lighthouse run cannot establish a field pass or directly measure real-user INP.                                                                                                                                                                                                   |
| Verify ownership and submit the sitemap                     | [Google ownership verification](https://support.google.com/webmasters/answer/9008080) and [Bing add/verify help](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b) describe the required owner action. Submitting a sitemap does not mean its pages are indexed.                                                                                                                                                                            |
| Measure supported AI exposure rather than assume it         | [Bing's AI Performance announcement](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/) describes citations and grounding-query reporting for Microsoft experiences. Use actual property reports once access exists. Google now provides a [Generative AI performance report](https://support.google.com/webmasters/answer/16984139) with impression data once the site has sufficient impressions. |

After ownership verification, check **Settings → Search generative AI** in
Search Console and confirm **Include my site's links and content in Search
generative AI features**, the default. A child property can inherit or override
its parent's choice. This control is separate from AI training and from
ordinary Search indexing. The current [Google Help page](https://support.google.com/webmasters/answer/16908024)
states the control rolled out worldwide on 31 August 2026. The separate
[Generative AI performance report](https://support.google.com/webmasters/answer/16984139)
reports impressions for AI Overviews and AI Mode and may be absent until there
are enough impressions. These current help pages supersede older guidance
that described AI measurement only through the combined Web report.

No educational claim was added: the repository does not supply complete,
confirmed institution, degree and date details. Ask the owner to verify these
before publishing them, rather than infer a qualification from a profile link.

IndexNow is optional for this small portfolio. Its [official FAQ](https://www.indexnow.org/faq)
describes notifications of content changes; it does not replace a sitemap or
guarantee indexing. No integration should be added without a reliable publish
hook, owner-hosted key and a demonstrated need for rapid change notification.

## Validation scope and limitations

`scripts/seo-audit.mjs` performs repeatable HTTP-response checks against a
running production build. It uses Next's installed HTML parser, adds no new
production dependency and intentionally does not execute JavaScript. It
checks sitemap discovery, public metadata, page content/landmarks, links,
local assets, schema JSON and selected schema invariants, robots access,
missing-page statuses, permanent redirects and anonymous private-route access.
`--external` additionally requests external destinations and image assets.
`--skip-remote-images` explicitly skips Next image proxies whose upstream is
remote; the JSON report lists these skipped URLs. This permits local asset
verification when the server has no network access, without certifying image
delivery. The normal default continues to check image proxies and report failures.
HTTP 401/403/429 and transient server failures on external services are
reported as limitations requiring manual review, rather than proof of a broken
public link. This script is not a complete Schema.org, HTML conformance or
browser accessibility validator.

Live response inspection was attempted for both deployment domains, the Work
page and robots.txt. The web connector reported those URLs as inaccessible.
Shell HTTPS access also failed in the sandbox; an escalation was not executed
because automatic approval review could not complete (`content-blocked`, a
review failure, not a determination that the read-only request was unsafe).
These results do not establish site downtime or indexing status. No live
Lighthouse, Search Console, Bing property, rich-result or AI citation results
are inferred from them. Re-run the audit and platform validators on the final
deployment after network/account access is available.
