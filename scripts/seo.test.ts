import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import sourceProjects from "../data/projects.json";
import sourceProfile from "../data/profile.json";
import sourceSocials from "../data/social-links.json";
import {
  projectSchema,
  profileSchema,
  socialSchema,
} from "../lib/validators/schemas";
import {
  publicPages,
  SITE_ALIASES,
  SITE_URL,
  siteUrl,
  type PublicPage,
} from "../lib/site";
import {
  globalGraph,
  pageGraph,
  pageMetadata,
  projectGraph,
  projectMetadata,
  summarize,
} from "../lib/seo";
import SeoJsonLd from "../components/seo-json-ld";
import nextConfig from "../next.config";
import sitemap from "../app/sitemap";
import { GET as llms } from "../app/llms.txt/route";
import { GET as socialCard } from "../app/social/[key]/route";
import { repos } from "../lib/db";

const projects = sourceProjects.map((project) => projectSchema.parse(project));

test("public metadata has unique descriptive fields and production canonicals", () => {
  const entries = (Object.keys(publicPages) as PublicPage[]).map((key) => {
    const page = publicPages[key];
    const metadata = pageMetadata(key);
    assert.equal(metadata.alternates?.canonical, siteUrl(page.path));
    assert.equal(metadata.openGraph?.url, siteUrl(page.path));
    assert.equal(metadata.openGraph?.title, page.title);
    assert.equal(metadata.twitter?.title, page.title);
    assert.equal(metadata.twitter?.description, page.description);
    assert.deepEqual(metadata.title, { absolute: page.title });
    assert.ok(
      metadata.robots &&
        typeof metadata.robots === "object" &&
        metadata.robots.index === true,
    );
    assert.ok(page.description.length > 70);
    assert.ok(JSON.stringify(metadata).includes(`${SITE_URL}/social/${key}`));
    assert.ok(!/localhost|vercel\.app/.test(JSON.stringify(metadata)));
    return page;
  });
  assert.equal(new Set(entries.map((page) => page.title)).size, entries.length);
  assert.equal(
    new Set(entries.map((page) => page.description)).size,
    entries.length,
  );
  assert.equal(siteUrl("/about/"), `${SITE_URL}/about`);
  assert.equal(siteUrl(), `${SITE_URL}/`);
});

test("project metadata preserves identity and bounds human-readable summaries", () => {
  for (const project of projects) {
    const metadata = projectMetadata(project);
    assert.deepEqual(metadata.title, {
      absolute: `${project.title} | Tanmay Tiwari`,
    });
    assert.equal(
      metadata.alternates?.canonical,
      `${SITE_URL}/projects/${project.slug}`,
    );
    assert.equal(metadata.twitter?.description, metadata.description);
    assert.ok(
      JSON.stringify(metadata.openGraph).includes(
        `/social/project-${project.slug}`,
      ),
    );
    assert.ok(metadata.description && metadata.description.length <= 165);
    assert.ok(!/\s{2}/.test(metadata.description));
  }
  assert.equal(summarize("  A short\n description.  "), "A short description.");
});

test("source-code schema requires a supplied repository and omits unverified dates or ratings", () => {
  for (const githubUrl of [
    "",
    "https://github.com/tanmay-tiwari-20/Unoverse",
  ]) {
    const project = { ...projects[0], githubUrl };
    const graph = projectGraph(project)["@graph"];
    const work = graph.find(
      (node) => node["@id"] === `${SITE_URL}/projects/${project.slug}#project`,
    )!;
    assert.equal(
      work["@type"],
      githubUrl ? "SoftwareSourceCode" : "CreativeWork",
    );
    assert.equal(work.codeRepository, githubUrl || undefined);
    assert.equal(work.name, project.title);
    assert.equal(work.description, project.description);
    assert.equal(work.sameAs, project.liveUrl);
    for (const unsupported of [
      "aggregateRating",
      "review",
      "datePublished",
      "dateModified",
      "programmingLanguage",
      "relatedLink",
    ])
      assert.ok(!(unsupported in work));
    const breadcrumbs = graph.find(
      (node) => node["@type"] === "BreadcrumbList",
    )!;
    const items = breadcrumbs.itemListElement as {
      position: number;
      item: string;
    }[];
    assert.deepEqual(
      items.map((item) => item.position),
      [1, 2, 3],
    );
    assert.deepEqual(
      items.map((item) => item.item),
      [siteUrl(), siteUrl("/projects"), siteUrl(`/projects/${project.slug}`)],
    );
  }
});

test("person and page entities connect to stable identities and actual profile links", () => {
  const profile = profileSchema.parse(sourceProfile[0]);
  const socials = sourceSocials.map((social) => socialSchema.parse(social));
  const graph = globalGraph(profile, socials)["@graph"];
  const person = graph.find((node) => node["@type"] === "Person")!;
  assert.equal(person.name, profile.name);
  assert.equal(person.description, profile.bio);
  for (const href of person.sameAs as string[]) {
    assert.equal(new URL(href).protocol, "https:");
    assert.notEqual(new URL(href).pathname, "/");
    assert.ok(!/alex.?parker/i.test(href));
  }
  const about = pageGraph("about")["@graph"][0];
  assert.equal(about["@type"], "ProfilePage");
  assert.deepEqual(about.mainEntity, { "@id": `${SITE_URL}/#person` });
  const community = pageGraph("hackshastra")["@graph"].find(
    (node) => node["@type"] === "Organization",
  )!;
  assert.equal(community.url, "https://www.hackshastra.in/");
  assert.deepEqual(community.founder, { "@id": `${SITE_URL}/#person` });
});

test("JSON-LD serialization cannot terminate its script element with editable content", () => {
  const maliciousText = '</script><script>alert("test")</script> & biography';
  const data = { "@context": "https://schema.org", description: maliciousText };
  const html = renderToStaticMarkup(createElement(SeoJsonLd, { data }));
  assert.equal((html.match(/<script/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  const json = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
  assert.deepEqual(JSON.parse(json), data);
  assert.ok(!json.includes("<"));
});

test("search files omit unpublished records without writing to the data store", async () => {
  const previousProjects = repos.projects.getAll;
  const previousProfiles = repos.profile.getAll;
  const previousSocials = repos.socials.getAll;
  const draft = {
    ...projects[0],
    id: "private-draft",
    slug: "private-seo-fixture",
    title: "Private SEO Fixture",
    isPublished: false,
  };
  try {
    repos.projects.getAll = async () => [projects[0], draft];
    repos.profile.getAll = async () => [profileSchema.parse(sourceProfile[0])];
    repos.socials.getAll = async () => [];
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    assert.equal(urls.length, Object.keys(publicPages).length + 1);
    assert.ok(urls.includes(siteUrl(`/projects/${projects[0].slug}`)));
    assert.ok(
      !urls.some((url) => /private|admin|api/.test(new URL(url).pathname)),
    );
    assert.ok(entries.every((entry) => entry.lastModified === undefined));
    const llmsResponse = await llms();
    const body = await llmsResponse.text();
    assert.equal(llmsResponse.status, 200);
    assert.equal(llmsResponse.headers.get("cache-control"), "no-store");
    assert.ok(body.includes(projects[0].title));
    assert.ok(!body.includes(draft.title));
    assert.ok(!body.includes(draft.slug));
  } finally {
    repos.projects.getAll = previousProjects;
    repos.profile.getAll = previousProfiles;
    repos.socials.getAll = previousSocials;
  }
});

test("alternate hosts and legacy paths redirect permanently without target-host loops", async () => {
  const redirects = await nextConfig.redirects!();
  for (const host of SITE_ALIASES) {
    const matching = redirects.filter((redirect) =>
      redirect.has?.some(
        (condition) =>
          condition.type === "host" &&
          new RegExp(`^${condition.value}$`).test(host),
      ),
    );
    assert.equal(matching.length, 4);
    const legacy = matching.find(
      (redirect) => redirect.source === "/experience",
    )!;
    const allPaths = matching.find(
      (redirect) => redirect.source === "/:path*",
    )!;
    assert.equal(legacy.destination, `${SITE_URL}/about`);
    assert.equal(
      matching.find((redirect) => redirect.source === "/experience/")
        ?.destination,
      `${SITE_URL}/about`,
    );
    assert.equal(
      matching.find((redirect) => redirect.source === "/:path+/")?.destination,
      `${SITE_URL}/:path+`,
    );
    assert.equal(allPaths.destination, `${SITE_URL}/:path*`);
    assert.ok(matching.every((redirect) => redirect.permanent === true));
    for (const redirect of matching)
      assert.ok(
        !redirect.has?.some(
          (condition) =>
            condition.type === "host" &&
            new RegExp(`^${condition.value}$`).test(new URL(SITE_URL).hostname),
        ),
      );
  }
  assert.ok(
    redirects.some(
      (redirect) =>
        !redirect.has &&
        redirect.source === "/experience" &&
        redirect.destination === "/about" &&
        redirect.permanent === true,
    ),
  );
  assert.equal(nextConfig.trailingSlash, false);
  assert.equal(nextConfig.skipTrailingSlashRedirect, true);
  const require = createRequire(import.meta.url);
  const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
  const slashRule = redirects.find(
    (redirect) => !redirect.has && redirect.source === "/:path+/",
  )!;
  const pattern = pathToRegexp(slashRule.source, [], { strict: true });
  assert.ok(pattern.test("/about/"));
  assert.ok(pattern.test("/projects/unoverse/"));
  assert.ok(!pattern.test("/about"));
  assert.ok(!pattern.test("/"));
});

test("social cards exclude drafts and isolate page keys from project slugs", async () => {
  const previous = repos.projects.getAll;
  const draft = {
    ...projects[0],
    slug: "unpublished-card",
    isPublished: false,
  };
  const sameNamed = { ...projects[0], slug: "about", title: "About project" };
  const request = new Request(`${SITE_URL}/social/project-about`);
  try {
    repos.projects.getAll = async () => [draft, sameNamed];
    const missing = await socialCard(request, {
      params: Promise.resolve({ key: "project-unpublished-card" }),
    });
    assert.equal(missing.status, 404);
    assert.equal(await missing.text(), "Not found");
    const project = await socialCard(request, {
      params: Promise.resolve({ key: "project-about" }),
    });
    assert.equal(project.status, 200);
    assert.equal(project.headers.get("cache-control"), "no-store");
    await project.body?.cancel();
    const page = await socialCard(request, {
      params: Promise.resolve({ key: "about" }),
    });
    assert.equal(page.status, 200);
    assert.match(page.headers.get("cache-control") || "", /s-maxage=86400/);
    await page.body?.cancel();
    assert.ok(
      JSON.stringify(projectMetadata(sameNamed)).includes(
        `${SITE_URL}/social/project-about`,
      ),
    );
    assert.ok(
      JSON.stringify(pageMetadata("about")).includes(
        `${SITE_URL}/social/about`,
      ),
    );
  } finally {
    repos.projects.getAll = previous;
  }
});
