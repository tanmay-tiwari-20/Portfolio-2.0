import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

/** Run against an isolated local server with temporary DATA_DIR and test-only secrets. */
export async function runAdminAuthChecks({
  origin,
  password,
  requestOrigin = origin,
  expectSecure = false,
  missingPassword = false,
}) {
  assert.ok(
    origin && (password || missingPassword),
    "An isolated test server and its temporary password are required.",
  );
  const client = randomUUID();
  const request = (path, { cookie, method = "GET", body, headers = {} } = {}) =>
    fetch(`${origin}${path}`, {
      method,
      redirect: "manual",
      headers: {
        origin: requestOrigin,
        "x-forwarded-for": client,
        ...(cookie ? { cookie } : {}),
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  const login = (value, cookie) =>
    request("/api/admin/login", {
      method: "POST",
      body: { password: value },
      cookie,
    });
  assert.equal((await request("/secret-admin")).status, 307);
  for (const path of [
    "content?collection=projects",
    "database",
    "media",
    "export",
  ]) {
    assert.equal((await request(`/api/admin/${path}`)).status, 401);
  }
  if (missingPassword) {
    const unavailable = await login("temporary-verification-input");
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get("set-cookie"), null);
    const message = await unavailable.text();
    assert.equal(message.includes("temporary-verification-input"), false);
    assert.equal(message.includes("ADMIN_PASSWORD"), false);
    return {
      passed: true,
      checks: [
        "missing password fails closed",
        "configuration details stay server-side",
        "protected routes reject access",
      ],
    };
  }
  const wrong = await login(password + "incorrect");
  assert.equal(wrong.status, 401);
  assert.equal((await wrong.text()).includes(password), false);
  assert.equal(
    (
      await request("/api/admin/login", {
        method: "POST",
        body: { password },
        headers: { origin: "https://untrusted.example" },
      })
    ).status,
    403,
  );
  const signedIn = await login(password);
  assert.equal(signedIn.status, 200);
  const setCookie = signedIn.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Max-Age=28800/i);
  assert.equal(/;\s*Secure(?:;|$)/i.test(setCookie), expectSecure);
  assert.equal(/;\s*Domain=/i.test(setCookie), false);
  const cookie = setCookie.split(";")[0];
  assert.equal((await signedIn.text()).includes(password), false);
  assert.equal((await request("/secret-admin", { cookie })).status, 200);
  assert.equal(
    (await request("/api/admin/content?collection=projects", { cookie }))
      .status,
    200,
  );
  assert.equal((await request("/secret-admin", { cookie })).status, 200);
  const renewed = await login(password, cookie);
  assert.equal(renewed.status, 200);
  const newCookie = renewed.headers.get("set-cookie").split(";")[0];
  assert.notEqual(newCookie, cookie);
  assert.equal(
    (await request("/api/admin/content?collection=projects", { cookie }))
      .status,
    401,
  );
  const logout = await request("/api/admin/login", {
    method: "DELETE",
    cookie: newCookie,
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  assert.equal(
    (
      await request("/api/admin/content?collection=projects", {
        cookie: newCookie,
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/secret-admin", { cookie: newCookie })).status,
    307,
  );
  for (let i = 0; i < 6; i++)
    assert.equal((await login("invalid-credential")).status, 401);
  const limited = await login(password);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  return {
    passed: true,
    checks: [
      "route protection",
      "incorrect password",
      "CSRF rejection",
      "login cookie",
      expectSecure
        ? "production Secure cookie behind HTTPS origin"
        : "development cookie policy",
      "refresh",
      "session renewal",
      "logout replay rejection",
      "login throttling",
    ],
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(
    await runAdminAuthChecks({
      origin: process.env.ADMIN_TEST_URL,
      password: process.env.ADMIN_TEST_PASSWORD,
      requestOrigin:
        process.env.ADMIN_TEST_REQUEST_ORIGIN || process.env.ADMIN_TEST_URL,
      expectSecure: process.env.ADMIN_TEST_SECURE === "true",
      missingPassword: process.argv.includes("--missing-password"),
    }),
  );
}
