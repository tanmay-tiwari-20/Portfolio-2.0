# Admin workspace implementation and verification

Implemented on 6 November 2026. The existing Next.js routes, content schemas, repositories, and signed-cookie architecture are retained.

## Password and deployment setup

Set `ADMIN_PASSWORD` to your own normal password string in the ignored server `.env` or the deployment platform's Production environment variables. Keep the existing `SESSION_SECRET` configured with at least 32 random characters. No manual hash or database password record is needed. `.env.example` contains only placeholders, which cannot authenticate. The actual `.env` was not modified.

Restart or redeploy after changing environment variables. Remove the old `ADMIN_PASSWORD_HASH` setting. On Vercel, use Project Settings → Environment Variables → Production; Docker Compose already loads `.env`. Both secrets are server-only and must not use a public prefix.

Set `ADMIN_ORIGIN=https://your-public-domain` to the exact public HTTPS origin when a reverse proxy terminates TLS; this is recommended for production generally. The browser uses relative `/api/admin/*` URLs and host-only cookies. Keep the frontend and API on the same origin.

For Vercel/serverless or multiple Node processes, keep `MONGODB_URI` configured and give the database user read/write access to `admin_auth`. This uses the existing MongoDB service for session identifiers and throttling counters, not passwords. Without MongoDB, use one Node process and a persistent writable `DATA_DIR`. The private auth-state file is excluded from source control, Docker build context, and portfolio backups.

## Authentication behavior

- Exact password comparison uses equal-length SHA-256 digests and `timingSafeEqual`; secrets and submitted passwords are never returned or logged.
- Missing, empty, or placeholder configuration disables sign-in, with a generic client error and a clear server configuration message.
- Signed sessions have fresh random identifiers and an eight-hour expiry. Cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` in production.
- Protected pages and API handlers check persistent session state. Logout revokes the session before clearing the cookie; copied logged-out cookies cannot authenticate. Password or signing-secret changes invalidate existing tokens.
- Login allows six attempts per client in 15 minutes, with an additional shared 60-attempt cap and `Retry-After` responses. Parsing is bounded to 8 KB.
- Origin and Fetch Metadata checks protect every admin mutation, including login and logout. Admin responses use `Cache-Control: no-store, private`.

## Interface changes

The login and dashboard use a scoped charcoal/red design with the portfolio's fonts and icons. The login has an accessible password visibility control, validation, pending state, and client-side navigation. Public navigation, cinematic transitions, and analytics do not run on admin pages.

The workspace has a compact sidebar, mobile navigation drawer, contextual toolbar, real collection counts, refresh, export, storage status, and sign-out controls. Projects, Experience, Hackathons, Community Events, Social Links, and About & images retain their existing operations. Lists stack on phones; controls provide visible focus and comfortable touch targets.

Project, experience, hackathon, and social forms use focus-managed dialogs. Event and About editors share the visual treatment. Editors protect unsaved changes, prevent duplicate saves, retain input after failures, and display backend-confirmed success. About exposes discard and busy states. Uploads retain image metadata and show errors without discarding drafts. Ordering supports drag and keyboard controls with rollback on failure.

A content API bug was also corrected: partial project publication/feature updates no longer apply defaults that reset unrelated fields or ordering.

## Verification results

| Check | Result |
| --- | --- |
| Isolated development server | Started and served login/dashboard successfully |
| Auth unit/store tests | 9 passed |
| Content, About, event, Mongo patch and routing regression tests | 27 passed |
| HTTP auth: development | Passed |
| HTTP auth: local production standalone server | Passed, including Secure cookie flags and revoked-cookie rejection |
| Missing production password | Generic 503, no cookie; protected routes rejected |
| Browser acceptance | All 10 groups passed; zero JavaScript runtime errors |
| Responsive widths | 320, 375, 430, 768, 1024, 1440, 1920 and 2560 px |
| Responsive coverage | Login, all six sections, all five editor dialogs, mobile drawer and keyboard focus |
| Editing coverage | Create/update/delete in all five lists; publish/feature/reorder; About discard, failed-save retention and successful save |
| Production build | Passed with MongoDB disabled for local verification |
| Frontend secret check | 57 built client assets scanned; no generated test password or signing secret found |
| TypeScript and changed-file ESLint | Passed |

Browser tests used generated credentials and a disposable copy of the content. Repository data and live services were not edited. Representative screenshots and JSON reports are in [`artifacts/admin-verification`](../artifacts/admin-verification). All 96 screenshots are retained in the ignored `.next-admin-test/verification/screenshots` folder.

Repository-wide ESLint still reports three pre-existing errors in untouched files: `app/not-found.tsx`, `components/admin/content-editor.tsx` (an unused legacy editor), and `components/home-profile-philosophy.tsx`, plus existing warnings. Changed files lint cleanly.

The first build using the existing environment failed because MongoDB DNS/network access timed out during sitemap generation. The final build passed using the local JSON adapter. External image requests returned `ERR_NETWORK_ACCESS_DENIED` in the browser environment; image delivery and real Cloudinary uploads were not verified. Intentional invalid-login and failed-save tests also produced expected 401/500 responses.

The local production HTTP test simulated an HTTPS public origin in front of an HTTP upstream. It verifies cookie flags and runtime authentication, but does not establish real browser TLS/proxy behavior on the deployed domain. Actual production login, live MongoDB access, and Cloudinary credentials remain to be checked after deploying the environment variables.

## Repeating local checks

Use `npm run test:auth` for the auth unit suite. Run `node scripts/admin-test-server.mjs` to start a separate development server on port 3137 with generated credentials and temporary data; it will not replace an existing server on port 3000. Stop this process after testing. It uses an ignored separate Next output directory.

Run `scripts/admin-browser.mjs` with `ADMIN_TEST_DATA_ISOLATED=1`, and set `ADMIN_PLAYWRIGHT_MODULE` / `ADMIN_BROWSER_EXECUTABLE` if Playwright is supplied outside this repository. It reads the test server's private runtime file automatically. The harness refuses non-loopback servers. Browser tooling is not added to production dependencies.

`scripts/admin-auth-http.mjs` exports `runAdminAuthChecks` for the isolated server. `scripts/admin-test-server.mjs --production` runs the built standalone server; use `ADMIN_TEST_PORT` to choose another port. `--missing-password` starts the same disposable configuration with authentication disabled. These helpers never read or change the real password.
