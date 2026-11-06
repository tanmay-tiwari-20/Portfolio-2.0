# Tanmay — Personal Portfolio

A self-hosted Next.js portfolio with original comic-inspired art direction, server-rendered public pages, file-based content, a private admin area, and optional Cloudinary uploads.

## Setup

1. Install Node.js 22 or later and copy `.env.example` to `.env`.
2. Set `ADMIN_PASSWORD` to your own normal password string in the server's `.env`, and keep a fresh `SESSION_SECRET` of at least 32 random characters for signing cookies. No password hash command or credential database record is needed. `ADMIN_EMAIL` is optional and is only a session label. Missing or empty password configuration disables login. Restart the server after changing environment variables; rotating the password or session secret signs out existing sessions.
3. Run `npm install`, `npm run seed`, then `npm run dev`.
4. Visit `/secret-admin/login` to sign in. The admin path is excluded from navigation and robots; the session cookie and server checks provide the actual access control.

Starter profile information and external image URLs are examples. Update them in `/data` before publishing. JSON records are validated with Zod when read and written.

## Images with Cloudinary

Create a free Cloudinary account, then copy the cloud name, API key, and API secret from the Cloudinary Console into the matching environment variables. Keep `CLOUDINARY_API_SECRET` server-only. The admin signing endpoint returns a signature scoped to `portfolio/<section>` so the browser can upload directly without an upload preset. Media listing and deletion are protected by the admin session.

Images can use the signed fields stored with a content item: `url`, `publicId`, `width`, `height`, and `alt`. For production image crops, use Cloudinary delivery transformations (`f_auto,q_auto,c_fill,g_auto,w_<width>`); the public pages currently accept direct image URLs.

## Content and backup

JSON files live in `DATA_DIR` (defaults to `./data`). The repository adapter validates each record, creates missing seed files, serializes writes through a per-file process queue, and replaces files atomically. When `MONGODB_URI` is configured, MongoDB is authoritative and database errors fail the operation rather than silently writing to JSON. To move between stores, export a backup, switch configuration, and explicitly import it. MongoDB collections are not seeded automatically; import the supplied backup during setup. The admin dashboard provides validated content management, a Cloudinary media library, and JSON backups.

Run `npm run seed` to populate absent files without overwriting existing content. `/api/admin/export` downloads all collections. `/api/admin/import` accepts a JSON backup in the same format and validates each collection before replacing it.

## Deploy with persistent storage

The Docker setup mounts a named persistent volume at `/app/data`:

```sh
docker compose up --build -d
```

On Railway or Render, attach a persistent disk and set `DATA_DIR` to its mount path. On a VPS, run the container or use PM2 with a mounted data directory. Back up `DATA_DIR` regularly and store credentials in the host's secret manager.

On read-only-filesystem platforms such as Vercel, configure MongoDB for persistent content edits and authentication state. JSON mode requires a persistent writable disk and one Node process; files written to an ephemeral filesystem do not persist.

### Production admin login

Add `ADMIN_PASSWORD` and `SESSION_SECRET` to the deployment project's **server/runtime environment variables**, for the Production environment, then redeploy or restart. Docker Compose already reads these from `.env`; they must not be Docker build arguments. On Vercel, use Project Settings → Environment Variables. Railway/Render/VPS environment settings work in the same way. Never prefix either secret with `NEXT_PUBLIC_` or `VITE_`. Leave the placeholder in `.env.example`; use a unique password only in your ignored `.env` or host secret manager. Quote values containing `#`, spaces, or dollar signs as required by your environment manager.

The browser calls relative `/api/admin/*` endpoints on the portfolio's own domain. Set server-only `ADMIN_ORIGIN=https://your-portfolio-domain` to the exact public origin when using a TLS-terminating reverse proxy (also recommended for production). It must contain no path. Both the frontend and API must be served on that origin over HTTPS. Cookies are host-only, `HttpOnly`, `SameSite=Strict`, `Secure` in production, and expire after eight hours. No client build-time password variable is used.

Sessions contain a fresh random identifier and signed expiry. The server stores only hashed session identifiers and throttling counters, never the password. Logout revokes the identifier before clearing the cookie, preventing replay; protected pages and every admin API handler check the server's session state. Password checking compares equal-length SHA-256 digests in constant time. State-changing requests require a matching Origin and compatible Fetch Metadata, including login/logout. Login is limited to six attempts per client per 15 minutes, with an additional shared 60-attempt cap to limit distributed or spoofed-address attempts; HTTP 429 includes `Retry-After`.

When `MONGODB_URI` is configured, private session/throttle state is kept in the `admin_auth` collection with atomic updates shared across instances. Give the existing database user read/write access to this collection. A database outage fails authentication closed. No password record or new database service is required. With MongoDB configured, admin content editing and login can run on Vercel/serverless hosts. Without MongoDB, the private `.admin-auth.json` file lives in `DATA_DIR` on a persistent writable disk; run **one Node process** for this mode. Multi-process/serverless deployments must use the existing MongoDB adapter so revocation and throttles are shared. This private file is ignored by Git and excluded from portfolio backups.

After deployment, test correct/incorrect login, refresh and direct access to `/secret-admin`, a content save, and logout on the actual HTTPS domain. Local tests do not verify production environment variables, proxy routing, or live MongoDB/Cloudinary credentials. Existing cookies from the old hash-based login are invalidated by this migration. `ADMIN_PASSWORD_HASH` is no longer read and can be removed from deployment settings.

## Theme and motion

The GitHub contribution city has a daily refresh workflow at `.github/workflows/refresh-github-contributions.yml` (08:17 IST). Add the existing public-profile token as the repository Actions secret `GH_CONTRIBUTIONS_TOKEN`, and publish the workflow with the city files to `main`. It refreshes and validates the snapshot, commits only changed calendar data, and the connected Vercel Git integration deploys the new snapshot. A failed refresh leaves the last good city intact. See [the city setup report](docs/GITHUB_CONTRIBUTION_CITY.md) for one-time activation and verification.

Change the palette and type in `app/globals.css`. All artwork is original CSS/SVG web geometry and abstract illustration. Motion uses Lenis with GSAP ScrollTrigger and honors `prefers-reduced-motion`; avoid adding movement that blocks reading or navigation.

## Contact form

Set `NEXT_PUBLIC_WEB3FORMS_KEY` from Web3Forms. For Docker, pass it as a build argument (Compose reads it from the invoking environment or `.env`) because Next.js embeds public keys at build time. Without it, the form clearly reports delivery unavailable and directs visitors to email.




