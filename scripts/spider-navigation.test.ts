import assert from "node:assert/strict";
import test from "node:test";
import {
  getNavigationTarget,
  routeKey,
  type NavigationAttributes,
  type NavigationClick,
} from "../components/animations/spider-transition/navigation";

const current = "https://portfolio.example/projects?view=grid#selected";
const click: NavigationClick = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
};

function target(
  href: string,
  attributes: NavigationAttributes = {},
  event: Partial<NavigationClick> = {},
) {
  return getNavigationTarget(href, current, attributes, { ...click, ...event });
}

test("ordinary page links resolve relative URLs and retain destination hashes", () => {
  assert.equal(
    target("/about#the-person")?.href,
    "https://portfolio.example/about#the-person",
  );
  assert.equal(target("projects/example")?.pathname, "/projects/example");
  assert.equal(target("//portfolio.example/contact")?.pathname, "/contact");
  assert.equal(target("/contact", { target: "_self" })?.pathname, "/contact");
  assert.equal(target("/contact", { target: "_SELF" })?.pathname, "/contact");
});

test("same-page anchors and current-route clicks do not start a transition", () => {
  for (const href of ["", "#", "#different", "/projects?view=grid", current]) {
    assert.equal(target(href), null, href);
  }
});

test("query changes are real navigations while route keys ignore fragments", () => {
  assert.equal(target("?view=theater")?.search, "?view=theater");
  assert.equal(target("/projects")?.search, "");
  assert.equal(routeKey(current), "/projects?view=grid");
  assert.equal(routeKey("/about#the-person"), "/about");
  assert.equal(
    routeKey("/projects?tag=web%20apps#one"),
    "/projects?tag=web%20apps",
  );
});

test("modified, non-primary, and already-handled clicks preserve browser behavior", () => {
  for (const modifier of [
    "metaKey",
    "ctrlKey",
    "shiftKey",
    "altKey",
    "defaultPrevented",
  ] as const) {
    assert.equal(target("/contact", {}, { [modifier]: true }), null, modifier);
  }
  assert.equal(target("/contact", {}, { button: 1 }), null);
  assert.equal(target("/contact", {}, { button: 2 }), null);
});

test("downloads and alternate browsing contexts are never intercepted", () => {
  assert.equal(target("/resume.pdf", { download: true }), null);
  for (const context of ["_blank", "_parent", "_top", "portfolio-preview"]) {
    assert.equal(target("/contact", { target: context }), null, context);
  }
  assert.equal(target("/contact", { download: false })?.pathname, "/contact");
});

test("external and non-HTTP links retain their native behavior", () => {
  for (const href of [
    "https://example.org/about",
    "http://portfolio.example/about",
    "https://portfolio.example:444/about",
    "mailto:hello@example.org",
    "tel:+123456789",
    "javascript:void(0)",
    "data:text/plain,example",
    "blob:https://portfolio.example/example",
  ]) {
    assert.equal(target(href), null, href);
  }
});

test("API exports bypass animation but all page routes remain eligible", () => {
  assert.equal(target("/api"), null);
  assert.equal(target("/api/admin/export?format=json"), null);
  assert.equal(target("/projects/../api/admin/export"), null);
  assert.equal(target("/secret-admin")?.pathname, "/secret-admin");
  assert.equal(target("/experience")?.pathname, "/experience");
  assert.equal(target("/api-design")?.pathname, "/api-design");
});

test("malformed destinations or current URLs fail without throwing", () => {
  assert.equal(target("https://[broken"), null);
  assert.equal(getNavigationTarget("/contact", "not a URL", {}, click), null);
});
