import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import Module, { createRequire } from "node:module";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { decodeJwt, SignJWT } from "jose";

// Match Next's server compilation alias for its bundled marker in this Node test runner.
// Client builds still resolve the marker to the throwing implementation.
const testRequire = createRequire(import.meta.url);
const markerPath = testRequire.resolve("next/dist/compiled/server-only");
const marker = new Module(markerPath);
marker.exports = {};
marker.loaded = true;
testRequire.cache[markerPath] = marker;

test("admin authentication rejects bad credentials, rotates sessions and throttles durably", async (t) => {
  const previous = { ...process.env };
  const root = await mkdtemp(path.join(tmpdir(), "portfolio-auth-test-"));
  const password = `${randomBytes(24).toString("base64url")} ! π`;
  process.env.ADMIN_PASSWORD = password;
  process.env.SESSION_SECRET = randomBytes(32).toString("hex");
  process.env.MONGODB_URI = "";
  process.env.DATA_DIR = root;
  process.env.ADMIN_ORIGIN = "";
  Object.assign(process.env, { NODE_ENV: "development" });
  const {
    authConfigurationError,
    passwordMatches,
    sessionCookieOptions,
    signingKey,
  } = await import("../lib/auth/config");
  const { allowedAdminOrigin } = await import("../lib/auth/origin");
  const { issueToken, readToken } = await import("../lib/auth/token");
  const store = await import("../lib/auth/store");
  try {
    await t.test(
      "plain password is exact, supports Unicode and rejects malformed input",
      () => {
        assert.equal(authConfigurationError(), null);
        assert.equal(passwordMatches(password), true);
        for (const input of [
          password + " ",
          password.trim(),
          "wrong",
          "",
          null,
          {},
          [],
          1,
          "x".repeat(1025),
        ]) {
          if (input !== password) assert.equal(passwordMatches(input), false);
        }
      },
    );
    await t.test(
      "missing or empty configuration fails closed without including secrets",
      () => {
        for (const value of [undefined, "", "  "]) {
          if (value === undefined) delete process.env.ADMIN_PASSWORD;
          else process.env.ADMIN_PASSWORD = value;
          assert.equal(passwordMatches(password), false);
          assert.equal(
            authConfigurationError(),
            "ADMIN_PASSWORD is missing or empty.",
          );
        }
        process.env.ADMIN_PASSWORD = password;
        process.env.ADMIN_PASSWORD = "replace_with_your_own_password";
        assert.equal(passwordMatches("replace_with_your_own_password"), false);
        process.env.ADMIN_PASSWORD = password;
        const secret = process.env.SESSION_SECRET;
        process.env.SESSION_SECRET = "short";
        assert.equal(passwordMatches(password), false);
        assert.match(authConfigurationError()!, /SESSION_SECRET/);
        process.env.SESSION_SECRET = secret;
      },
    );
    await t.test(
      "signed token has a fresh ID, fixed expiry and no credential data",
      async () => {
        const first = await issueToken("admin");
        const second = await issueToken("admin");
        assert.notEqual(first.id, second.id);
        assert.notEqual(first.token, second.token);
        assert.deepEqual(await readToken(first.token), {
          email: "admin",
          id: first.id,
        });
        const claims = decodeJwt(first.token);
        assert.equal(claims.exp! - claims.iat!, 8 * 60 * 60);
        assert.equal(JSON.stringify(claims).includes(password), false);
        assert.equal(
          JSON.stringify(claims).includes(process.env.SESSION_SECRET!),
          false,
        );
        assert.equal(await readToken(first.token.slice(0, -4) + "AAAA"), null);
        const expired = await new SignJWT({ email: "admin" })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuer("portfolio-admin-v3")
          .setAudience("portfolio-admin")
          .setJti(first.id)
          .setIssuedAt(1)
          .setExpirationTime(2)
          .sign(signingKey());
        assert.equal(await readToken(expired), null);
        process.env.ADMIN_PASSWORD = password + "changed";
        assert.equal(await readToken(first.token), null);
        process.env.ADMIN_PASSWORD = password;
        const previousSecret = process.env.SESSION_SECRET;
        process.env.SESSION_SECRET = randomBytes(32).toString("hex");
        assert.equal(await readToken(first.token), null);
        process.env.SESSION_SECRET = previousSecret;
      },
    );
    await t.test(
      "session refresh remains valid and revoked/expired identifiers fail",
      async () => {
        const session = await issueToken("admin");
        assert.equal(await store.sessionIsActive(session.id), false);
        await store.addSession(session.id, session.expiresAt * 1000);
        assert.equal(await store.sessionIsActive(session.id), true);
        assert.equal(await store.sessionIsActive(session.id), true);
        const file = await readFile(
          path.join(root, ".admin-auth.json"),
          "utf8",
        );
        assert.equal(file.includes(session.id), false);
        assert.equal(file.includes(password), false);
        assert.equal(file.includes(process.env.SESSION_SECRET!), false);
        await store.revokeSession(session.id);
        assert.equal(await store.sessionIsActive(session.id), false);
        await store.addSession("expired", Date.now() - 1);
        assert.equal(await store.sessionIsActive("expired"), false);
      },
    );
    await t.test(
      "concurrent attempts cannot bypass the client lockout and expiry restores access",
      async () => {
        const now = Date.now();
        const attempts = await Promise.all(
          Array.from({ length: 12 }, () =>
            store.consumeLoginAttempt("test-client", now),
          ),
        );
        assert.equal(attempts.filter((retry) => retry === 0).length, 6);
        assert.equal(attempts.filter((retry) => retry === 900).length, 6);
        assert.equal(
          await store.consumeLoginAttempt("test-client", now + 15 * 60_000 + 1),
          0,
        );
        await store.clearClientAttempts("test-client");
        assert.equal(
          await store.consumeLoginAttempt("test-client", now + 15 * 60_000 + 2),
          0,
        );
      },
    );
    await t.test(
      "a shared cap blocks attempts even when the submitted client address changes",
      async () => {
        process.env.DATA_DIR = path.join(root, "global-cap");
        const now = Date.now();
        for (let i = 0; i < 60; i++)
          assert.equal(await store.consumeLoginAttempt(`address-${i}`, now), 0);
        assert.equal(
          await store.consumeLoginAttempt("different-address", now),
          900,
        );
        process.env.DATA_DIR = root;
      },
    );
    await t.test(
      "origin checks reject missing, cross-site and spoofed proxy metadata",
      () => {
        const request = (origin?: string, extra: Record<string, string> = {}) =>
          new Request("http://localhost:3000/api/admin/login", {
            method: "POST",
            headers: { ...(origin ? { origin } : {}), ...extra },
          });
        assert.equal(
          allowedAdminOrigin(request("http://localhost:3000")),
          true,
        );
        assert.equal(allowedAdminOrigin(request()), false);
        assert.equal(allowedAdminOrigin(request("null")), false);
        assert.equal(
          allowedAdminOrigin(request("https://other.example")),
          false,
        );
        assert.equal(
          allowedAdminOrigin(
            request("http://localhost:3000", {
              "sec-fetch-site": "cross-site",
            }),
          ),
          false,
        );
        Object.assign(process.env, { NODE_ENV: "production" });
        assert.equal(
          allowedAdminOrigin(request("http://localhost:3000")),
          false,
        );
        process.env.ADMIN_ORIGIN = "https://portfolio.example";
        assert.equal(
          allowedAdminOrigin(request("https://portfolio.example")),
          true,
        );
        assert.equal(
          allowedAdminOrigin(
            request("https://evil.example", {
              "x-forwarded-host": "evil.example",
            }),
          ),
          false,
        );
        process.env.ADMIN_ORIGIN = "https://portfolio.example/admin";
        assert.equal(
          allowedAdminOrigin(request("https://portfolio.example")),
          false,
        );
        process.env.ADMIN_ORIGIN = "";
      },
    );
    await t.test(
      "production cookies are host-only, HttpOnly, Secure, Strict and expire in eight hours",
      () => {
        assert.deepEqual(sessionCookieOptions(), {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
          maxAge: 28800,
        });
        Object.assign(process.env, { NODE_ENV: "development" });
        assert.equal(sessionCookieOptions().secure, false);
      },
    );
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
    assert.ok(path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(root, { recursive: true, force: true });
  }
});
