import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

// Reuse Next's installed HTML parser; this check adds no production dependency.
const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/node-html-parser");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const origin = new URL(
  args.find((arg) => /^https?:\/\//.test(arg)) || "http://127.0.0.1:3000",
).origin;
const canonicalOrigin = new URL(
  option("--canonical", "https://takneekitanmay.tech"),
).origin;
const checkExternal = args.includes("--external");
const checkAssets = !args.includes("--skip-assets");
const skipRemoteImages = args.includes("--skip-remote-images");
const outputPath = option("--out", "artifacts/seo/audit.json");
const requiredPaths = [
  "/",
  "/about",
  "/projects",
  "/hackathons",
  "/hackshastra",
  "/contact",
];
const report = {
  checkedAt: new Date().toISOString(),
  origin,
  canonicalOrigin,
  method:
    "HTTP response HTML without JavaScript execution; not a browser, Lighthouse, full HTML conformance, or search-engine schema certification.",
  pages: [],
  redirects: [],
  assets: [],
  externalLinks: [],
  errors: [],
  warnings: [],
};
const issue = (kind, message) => report[kind].push(message);
const cleanText = (node) => node?.text.replace(/\s+/g, " ").trim() || "";
const canonicalFor = (pathname) =>
  `${canonicalOrigin}${pathname === "/" ? "" : pathname.replace(/\/$/, "")}`;
const comparableUrl = (url) => new URL(url).href.replace(/\/$/, "");
const internal = (url) => [origin, canonicalOrigin].includes(url.origin);
const pageDocuments = new Map();
const externalLinks = new Set();
const assetUrls = new Set();
const internalLinks = [];
const request = async (pathname, options = {}) => {
  const response = await fetch(new URL(pathname, origin), {
    signal: AbortSignal.timeout(30000),
    redirect: "manual",
    headers: {
      "user-agent": "PortfolioSeoAudit/1.0",
      accept: "text/html,application/xml;q=0.9,*/*;q=0.8",
    },
    ...options,
  });
  return { response, text: await response.text() };
};
const attribute = (doc, selector, name = "content") =>
  doc.querySelector(selector)?.getAttribute(name) || "";
const validAbsolute = (url) => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

function validateSchema(doc, pathname) {
  const types = [];
  const seenIds = new Set();
  const nodes = doc.querySelectorAll('script[type="application/ld+json"]');
  if (!nodes.length)
    issue("errors", `${pathname}: JSON-LD missing in response HTML`);
  for (const node of nodes) {
    try {
      const json = JSON.parse(node.rawText);
      for (const document of Array.isArray(json) ? json : [json]) {
        if (
          ![
            "https://schema.org",
            "https://schema.org/",
            "http://schema.org",
          ].includes(document["@context"])
        ) {
          issue(
            "errors",
            `${pathname}: missing or unexpected Schema.org context`,
          );
        }
        const graph = document["@graph"] || [document];
        for (const entity of graph) {
          const entityTypes = Array.isArray(entity["@type"])
            ? entity["@type"]
            : [entity["@type"]];
          types.push(...entityTypes.filter(Boolean));
          if (!entityTypes.filter(Boolean).length)
            issue("errors", `${pathname}: schema graph entity has no type`);
          if (entity["@id"]) {
            if (seenIds.has(entity["@id"]))
              issue(
                "errors",
                `${pathname}: duplicate schema entity ${entity["@id"]}`,
              );
            seenIds.add(entity["@id"]);
            if (!validAbsolute(entity["@id"]))
              issue(
                "errors",
                `${pathname}: schema identifier is not absolute HTTPS`,
              );
          }
          if (entityTypes.includes("BreadcrumbList")) {
            for (const [index, item] of (
              entity.itemListElement || []
            ).entries()) {
              if (
                item.position !== index + 1 ||
                !item.name ||
                !validAbsolute(
                  typeof item.item === "string"
                    ? item.item
                    : item.item?.["@id"],
                )
              ) {
                issue(
                  "errors",
                  `${pathname}: invalid breadcrumb position, name, or URL`,
                );
              }
            }
          }
          if (entityTypes.includes("Person")) {
            if (!entity.name || !validAbsolute(entity.url))
              issue("errors", `${pathname}: Person lacks name or absolute URL`);
            for (const link of entity.sameAs || []) {
              if (!validAbsolute(link) || new URL(link).pathname === "/")
                issue(
                  "errors",
                  `${pathname}: sameAs is not a profile URL: ${link}`,
                );
            }
          }
          if (
            entityTypes.includes("SoftwareSourceCode") &&
            !validAbsolute(entity.codeRepository)
          ) {
            issue(
              "errors",
              `${pathname}: SoftwareSourceCode lacks a public codeRepository URL`,
            );
          }
          if (entity.aggregateRating || entity.review)
            issue(
              "warnings",
              `${pathname}: review/rating schema requires manual source verification`,
            );
        }
      }
    } catch (error) {
      issue("errors", `${pathname}: invalid JSON-LD: ${error.message}`);
    }
  }
  if (
    !types.some((type) =>
      [
        "WebPage",
        "ProfilePage",
        "AboutPage",
        "ContactPage",
        "CollectionPage",
      ].includes(type),
    )
  ) {
    issue("errors", `${pathname}: page entity missing in JSON-LD`);
  }
  return types;
}

function inspectPage(pathname, response, html) {
  const doc = parse(html);
  pageDocuments.set(pathname, doc);
  const titles = doc.querySelectorAll("title");
  const title = cleanText(titles[0]);
  const descriptions = doc.querySelectorAll('meta[name="description"]');
  const description = descriptions[0]?.getAttribute("content") || "";
  const canonicals = doc.querySelectorAll('link[rel="canonical"]');
  const canonical = canonicals[0]?.getAttribute("href") || "";
  const robots = attribute(doc, 'meta[name="robots"]');
  const h1s = doc.querySelectorAll("h1").map(cleanText);
  const headings = doc
    .querySelectorAll("h1,h2,h3,h4,h5,h6")
    .map((node) => ({ level: Number(node.tagName[1]), text: cleanText(node) }));
  const schemaTypes = validateSchema(doc, pathname);
  const result = {
    pathname,
    status: response.status,
    title,
    description,
    canonical,
    robots,
    h1s,
    headings,
    schemaTypes,
    htmlBytes: Buffer.byteLength(html),
  };
  report.pages.push(result);
  if (response.status !== 200)
    issue("errors", `${pathname}: HTTP ${response.status}; expected 200`);
  if (titles.length !== 1 || !title)
    issue(
      "errors",
      `${pathname}: expected one nonempty title; found ${titles.length}`,
    );
  if (descriptions.length !== 1 || !description)
    issue(
      "errors",
      `${pathname}: expected one nonempty description; found ${descriptions.length}`,
    );
  if (
    canonicals.length !== 1 ||
    !validAbsolute(canonical) ||
    comparableUrl(canonical) !== comparableUrl(canonicalFor(pathname))
  ) {
    issue(
      "errors",
      `${pathname}: canonical mismatch: ${canonical || "missing"}`,
    );
  }
  if (
    !robots ||
    /noindex|none/i.test(robots) ||
    /noindex|none/i.test(response.headers.get("x-robots-tag") || "")
  )
    issue("errors", `${pathname}: robots must permit indexing`);
  if (h1s.length !== 1 || !h1s[0])
    issue(
      "errors",
      `${pathname}: expected one nonempty H1; found ${h1s.length}`,
    );
  if (doc.querySelectorAll("main").length !== 1)
    issue("errors", `${pathname}: expected one main landmark`);
  if (attribute(doc, "html", "lang") !== "en")
    issue("errors", `${pathname}: English language declaration missing`);
  const mainText = cleanText(doc.querySelector("main"));
  if (mainText.length < 100)
    issue(
      "errors",
      `${pathname}: meaningful main content missing without JavaScript`,
    );
  for (let index = 1; index < headings.length; index++) {
    if (headings[index].level > headings[index - 1].level + 1)
      issue(
        "warnings",
        `${pathname}: heading level skips to H${headings[index].level}: ${headings[index].text}`,
      );
  }
  const metadata = [
    ['meta[property="og:title"]', "og:title"],
    ['meta[property="og:description"]', "og:description"],
    ['meta[property="og:type"]', "og:type"],
    ['meta[property="og:site_name"]', "og:site_name"],
    ['meta[name="twitter:card"]', "twitter:card"],
    ['meta[name="twitter:title"]', "twitter:title"],
    ['meta[name="twitter:description"]', "twitter:description"],
  ];
  for (const [selector, name] of metadata)
    if (!attribute(doc, selector))
      issue("errors", `${pathname}: ${name} missing`);
  const ogUrl = attribute(doc, 'meta[property="og:url"]');
  if (
    !validAbsolute(ogUrl) ||
    comparableUrl(ogUrl) !== comparableUrl(canonicalFor(pathname))
  )
    issue("errors", `${pathname}: og:url does not match canonical`);
  for (const selector of [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ]) {
    const image = attribute(doc, selector);
    if (!validAbsolute(image))
      issue(
        "errors",
        `${pathname}: missing absolute social image for ${selector}`,
      );
    else assetUrls.add(image);
  }
  if (
    !doc.querySelector('head link[rel="canonical"]') ||
    !doc.querySelector('head meta[property="og:image"]')
  )
    issue(
      "warnings",
      `${pathname}: canonical/social metadata is streamed outside head for this user agent`,
    );
  for (const image of doc.querySelectorAll("img")) {
    const src = image.getAttribute("src");
    if (!image.hasAttribute("alt"))
      issue("errors", `${pathname}: image lacks alt: ${src}`);
    const style = image.getAttribute("style") || "";
    if (
      !(image.getAttribute("width") && image.getAttribute("height")) &&
      !/position:\s*absolute/.test(style)
    )
      issue(
        "warnings",
        `${pathname}: image lacks dimensions or positioned fill: ${src}`,
      );
    if (src && !src.startsWith("data:"))
      assetUrls.add(new URL(src, origin).href);
  }
  for (const element of doc.querySelectorAll(
    'script[src],link[rel="stylesheet"],link[rel="preload"]',
  )) {
    const src = element.getAttribute("src") || element.getAttribute("href");
    if (src && !src.startsWith("data:"))
      assetUrls.add(new URL(src, origin).href);
  }
  for (const anchor of doc.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href");
    if (!href || /^(mailto:|tel:)/.test(href)) continue;
    if (
      !cleanText(anchor) &&
      !anchor.getAttribute("aria-label") &&
      !anchor.querySelector("img[alt]")
    )
      issue("warnings", `${pathname}: link has no accessible text: ${href}`);
    let url;
    try {
      url = new URL(href, `${origin}${pathname}`);
    } catch {
      issue("errors", `${pathname}: invalid href: ${href}`);
      continue;
    }
    if (!["https:", "http:"].includes(url.protocol)) {
      issue("errors", `${pathname}: unsupported link protocol: ${href}`);
      continue;
    }
    if (internal(url))
      internalLinks.push({
        from: pathname,
        pathname: url.pathname,
        hash: url.hash,
        href,
      });
    else externalLinks.add(url.href);
  }
}

function robotsGroups(text) {
  const groups = [];
  let group;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).toLowerCase();
    const value = line.slice(split + 1).trim();
    if (key === "user-agent") {
      if (!group || group.rules.length) {
        group = { agents: [], rules: [] };
        groups.push(group);
      }
      group.agents.push(value.toLowerCase());
    } else if (["allow", "disallow"].includes(key) && group && value)
      group.rules.push({ key, value });
  }
  return groups;
}
function permitted(groups, pathname, agent) {
  const specific = groups.filter((group) =>
    group.agents.some(
      (item) => item !== "*" && agent.toLowerCase().includes(item),
    ),
  );
  const candidates = specific.length
    ? specific
    : groups.filter((group) => group.agents.includes("*"));
  const matches = candidates
    .flatMap((group) => group.rules)
    .filter(({ value }) => {
      const expression = value
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")
        .replace(/\\\$$/, "$");
      return new RegExp(`^${expression}`).test(pathname);
    })
    .sort(
      (a, b) => b.value.length - a.value.length || (a.key === "allow" ? -1 : 1),
    );
  return matches[0]?.key !== "disallow";
}
async function checkUrl(url, collection, externalCheck = false) {
  const destination = new URL(url);
  if (internal(destination)) destination.host = new URL(origin).host;
  if (internal(new URL(url))) destination.protocol = new URL(origin).protocol;
  try {
    let response = await fetch(destination, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if ([405, 501].includes(response.status)) {
      response = await fetch(destination, {
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      await response.body?.cancel();
    }
    collection.push({ url, status: response.status, finalUrl: response.url });
    if (!response.ok)
      issue(
        externalCheck &&
          [401, 403, 429, 500, 502, 503, 504].includes(response.status)
          ? "warnings"
          : "errors",
        `${externalCheck ? "External link" : "Asset"}: HTTP ${response.status} ${url}`,
      );
  } catch (error) {
    collection.push({ url, error: error.message });
    issue(
      externalCheck || !internal(new URL(url)) ? "warnings" : "errors",
      `${externalCheck ? "External link" : "Asset"}: request unavailable ${url}: ${error.message}`,
    );
  }
}
async function batches(values, operation, size = 4) {
  for (let i = 0; i < values.length; i += size)
    await Promise.all(values.slice(i, i + size).map(operation));
}

try {
  const sitemap = await request("/sitemap.xml");
  if (sitemap.response.status !== 200)
    throw new Error(`Sitemap returned HTTP ${sitemap.response.status}`);
  const xml = parse(sitemap.text);
  if (
    !/<urlset\b[^>]*xmlns=["']http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9["']/.test(
      sitemap.text,
    )
  )
    issue("errors", "Sitemap urlset namespace missing");
  const urls = xml.querySelectorAll("url > loc").map(cleanText);
  if (!urls.length) throw new Error("Sitemap has no URLs");
  if (new Set(urls).size !== urls.length)
    issue("errors", "Sitemap has duplicate URLs");
  const paths = [];
  for (const url of urls) {
    const parsed = new URL(url);
    paths.push(parsed.pathname);
    if (
      parsed.origin !== canonicalOrigin ||
      parsed.search ||
      parsed.hash ||
      (parsed.pathname !== "/" && parsed.pathname.endsWith("/"))
    )
      issue("errors", `Noncanonical sitemap URL: ${url}`);
    if (/^\/(secret-admin|api|admin)(\/|$)/.test(parsed.pathname))
      issue("errors", `Private URL in sitemap: ${url}`);
  }
  for (const pathname of requiredPaths)
    if (!paths.includes(pathname))
      issue("errors", `Required public route absent from sitemap: ${pathname}`);
  for (const lastmod of xml.querySelectorAll("lastmod")) {
    const value = Date.parse(cleanText(lastmod));
    if (!Number.isFinite(value) || value > Date.now() + 86400000)
      issue("errors", `Invalid/future sitemap lastmod: ${cleanText(lastmod)}`);
  }
  report.sitemap = {
    status: sitemap.response.status,
    urls,
    lastmodCount: xml.querySelectorAll("lastmod").length,
  };
  for (const pathname of [...new Set([...requiredPaths, ...paths])]) {
    const { response, text } = await request(pathname);
    inspectPage(pathname, response, text);
    console.log(`${response.status} ${pathname}: ${report.pages.at(-1).title}`);
  }
  for (const key of ["title", "description"]) {
    const seen = new Map();
    for (const page of report.pages) {
      if (seen.has(page[key]))
        issue(
          "errors",
          `Duplicate ${key}: ${seen.get(page[key])} and ${page.pathname}`,
        );
      seen.set(page[key], page.pathname);
    }
  }
  for (const link of internalLinks) {
    let doc = pageDocuments.get(link.pathname);
    if (!doc) {
      const { response, text } = await request(link.pathname);
      if (response.status !== 200)
        issue(
          "errors",
          `${link.from}: internal link ${link.href} returned ${response.status}`,
        );
      doc = parse(text);
      pageDocuments.set(link.pathname, doc);
    }
    if (link.hash) {
      const id = decodeURIComponent(link.hash.slice(1));
      if (
        !doc
          .querySelectorAll("[id],[name]")
          .some(
            (element) =>
              element.getAttribute("id") === id ||
              element.getAttribute("name") === id,
          )
      )
        issue("errors", `${link.from}: broken anchor ${link.href}`);
    }
  }
  report.internalLinkCount = internalLinks.length;
  const robots = await request("/robots.txt");
  const groups = robotsGroups(robots.text);
  report.robots = { status: robots.response.status, text: robots.text };
  if (
    robots.response.status !== 200 ||
    !robots.text.includes(`${canonicalOrigin}/sitemap.xml`)
  )
    issue("errors", "Robots missing or sitemap directive incorrect");
  for (const pathname of paths)
    for (const agent of [
      "Googlebot",
      "Bingbot",
      "OAI-SearchBot",
      "PerplexityBot",
    ]) {
      if (!permitted(groups, pathname, agent))
        issue("errors", `Robots blocks public route ${pathname} for ${agent}`);
    }
  for (const pathname of ["/secret-admin", "/api/admin/content"])
    if (permitted(groups, pathname, "Googlebot"))
      issue(
        "warnings",
        `Robots permits unnecessary private-route crawling: ${pathname}`,
      );
  const llms = await request("/llms.txt");
  report.llms = { status: llms.response.status };
  if (
    llms.response.status === 200 &&
    (!llms.text.startsWith("# ") || !llms.text.includes(canonicalOrigin))
  )
    issue("errors", "llms.txt lacks identity or canonical links");
  if (llms.response.status !== 200)
    issue("warnings", "Optional llms.txt is not available");
  for (const pathname of [
    "/__seo_missing_page__",
    "/projects/__seo_missing_project__",
  ]) {
    const { response, text } = await request(pathname);
    report.redirects.push({ pathname, status: response.status });
    if (response.status !== 404)
      issue(
        "errors",
        `${pathname}: missing page must return HTTP 404, got ${response.status}`,
      );
    if (
      !/noindex/.test(attribute(parse(text), 'meta[name="robots"]')) &&
      !/noindex/.test(response.headers.get("x-robots-tag") || "")
    )
      issue("warnings", `${pathname}: explicit noindex absent on error page`);
  }
  for (const [pathname, target] of [
    ["/experience", "/about"],
    ["/experience/", "/about"],
    ["/about/", "/about"],
    ["/projects/unoverse/", "/projects/unoverse"],
  ]) {
    const { response } = await request(pathname);
    const location = response.headers.get("location");
    report.redirects.push({ pathname, status: response.status, location });
    if (
      ![301, 308].includes(response.status) ||
      !location ||
      new URL(location, origin).pathname !== target
    )
      issue("errors", `${pathname}: expected permanent redirect to ${target}`);
  }
  // Exercise host rules without following redirects to the public deployment.
  for (const host of ["takneekitanmay.vercel.app", "www.takneekitanmay.tech"]) {
    for (const [pathname, destination] of [
      [
        "/projects/unoverse?source=seo-audit",
        "/projects/unoverse?source=seo-audit",
      ],
      [
        "/projects/unoverse/?source=seo-audit",
        "/projects/unoverse?source=seo-audit",
      ],
      ["/about/", "/about"],
      ["/experience", "/about"],
      ["/experience/", "/about"],
    ]) {
      // Node fetch does not preserve an overridden Host header. Native HTTP
      // requests let a local server evaluate the same rule Vercel will receive.
      const response = await new Promise((resolve, reject) => {
        const url = new URL(pathname, origin);
        const send = url.protocol === "https:" ? httpsRequest : httpRequest;
        const req = send(url, { headers: { Host: host } }, (result) => {
          result.resume();
          resolve({
            status: result.statusCode,
            location: result.headers.location,
          });
        });
        req.on("error", reject);
        req.setTimeout(30000, () =>
          req.destroy(new Error("Host redirect check timed out")),
        );
        req.end();
      });
      const location = response.location;
      const target = `${canonicalOrigin}${destination}`;
      report.redirects.push({
        host,
        pathname,
        status: response.status,
        location,
      });
      if (![301, 308].includes(response.status) || location !== target)
        issue(
          "errors",
          `${host}${pathname}: expected permanent redirect to ${target}, got ${response.status} ${location}`,
        );
    }
  }
  const admin = await request("/secret-admin");
  if (
    ![302, 303, 307].includes(admin.response.status) ||
    !admin.response.headers.get("location")?.endsWith("/secret-admin/login")
  )
    issue("errors", "Anonymous admin request is not redirected to login");
  const login = await request("/secret-admin/login");
  const loginRobots = attribute(parse(login.text), 'meta[name="robots"]');
  if (
    !/noindex/.test(loginRobots) ||
    !/noindex/.test(login.response.headers.get("x-robots-tag") || "")
  )
    issue("errors", "Admin login must have noindex meta and X-Robots-Tag");
  for (const pathname of [
    "/api/admin/content",
    "/api/admin/database",
    "/api/admin/media",
    "/api/admin/export",
  ]) {
    const { response } = await request(pathname);
    if (response.status !== 401)
      issue("errors", `Anonymous ${pathname} must return 401`);
    if (!/noindex/.test(response.headers.get("x-robots-tag") || ""))
      issue("errors", `${pathname}: X-Robots-Tag noindex missing`);
  }
  const excludedAssetUrls = [...assetUrls].filter((url) => {
    const parsed = new URL(url);
    return (
      (skipRemoteImages &&
        parsed.pathname === "/_next/image" &&
        /^https?:\/\//.test(parsed.searchParams.get("url") || "")) ||
      (!checkExternal && !internal(parsed))
    );
  });
  report.skippedAssets = excludedAssetUrls;
  if (checkAssets)
    await batches(
      [...assetUrls].filter((url) => !excludedAssetUrls.includes(url)),
      (url) => checkUrl(url, report.assets),
    );
  if (checkExternal)
    await batches([...externalLinks], (url) =>
      checkUrl(url, report.externalLinks, true),
    );
  else
    report.externalLinks = [...externalLinks].map((url) => ({
      url,
      status: "not checked (use --external with network access)",
    }));
} catch (error) {
  issue("errors", `Audit could not finish: ${error.message}`);
}

report.errors = [...new Set(report.errors)];
report.warnings = [...new Set(report.warnings)];
report.passed = report.errors.length === 0;
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `\n${report.pages.length} pages; ${report.errors.length} errors; ${report.warnings.length} warnings. Report: ${outputPath}`,
);
for (const error of report.errors) console.error(`ERROR ${error}`);
for (const warning of report.warnings) console.warn(`WARN ${warning}`);
process.exitCode = report.passed ? 0 : 1;
