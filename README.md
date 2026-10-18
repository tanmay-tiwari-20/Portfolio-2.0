# Tanmay — Personal Portfolio

A self-hosted Next.js portfolio with original comic-inspired art direction, server-rendered public pages, file-based content, a private admin area, and optional Cloudinary uploads.

## Setup

1. Install Node.js 22 or later and copy `.env.example` to `.env`.
2. Add a unique `SESSION_SECRET` of at least 32 characters, your `ADMIN_EMAIL`, and the bcrypt hash produced by `npm run hash-password`.
3. Run `npm install`, `npm run seed`, then `npm run dev`.
4. Visit `/secret-admin/login` to sign in. The admin path is excluded from navigation and robots; the session cookie and server checks provide the actual access control.

Starter profile information and external image URLs are examples. Update them in `/data` before publishing. JSON records are validated with Zod when read and written.

## Images with Cloudinary

Create a free Cloudinary account, then copy the cloud name, API key, and API secret from the Cloudinary Console into the matching environment variables. Keep `CLOUDINARY_API_SECRET` server-only. The admin signing endpoint returns a signature scoped to `portfolio/<section>` so the browser can upload directly without an upload preset. Media listing and deletion are protected by the admin session.

Images can use the signed fields stored with a content item: `url`, `publicId`, `width`, `height`, and `alt`. For production image crops, use Cloudinary delivery transformations (`f_auto,q_auto,c_fill,g_auto,w_<width>`); the public pages currently accept direct image URLs.

## Content and backup

JSON files live in `DATA_DIR` (defaults to `./data`). The repository adapter validates each record, creates missing seed files, serializes writes through a per-file process queue, and replaces files atomically. The admin dashboard provides a validated JSON editor for create, read, update, delete, and reorder across every collection, plus a Cloudinary media library and JSON backups.

Run `npm run seed` to populate absent files without overwriting existing content. `/api/admin/export` downloads all collections. `/api/admin/import` accepts a JSON backup in the same format and validates each collection before replacing it.

## Deploy with persistent storage

The Docker setup mounts a named persistent volume at `/app/data`:

```sh
docker compose up --build -d
```

On Railway or Render, attach a persistent disk and set `DATA_DIR` to its mount path. On a VPS, run the container or use PM2 with a mounted data directory. Back up `DATA_DIR` regularly and store credentials in the host's secret manager.

For read-only-filesystem platforms such as Vercel, make content edits locally, commit the JSON changes, and redeploy. Do not expect admin edits to persist to an ephemeral filesystem.

## Theme and motion

Change the palette and type in `app/globals.css`. All artwork is original CSS/SVG web geometry and abstract illustration. Motion uses Lenis with GSAP ScrollTrigger and honors `prefers-reduced-motion`; avoid adding movement that blocks reading or navigation.

## Contact form

Set `NEXT_PUBLIC_WEB3FORMS_KEY` from Web3Forms. The form validates fields in the browser, sends a honeypot value, and shows success/error feedback. No contact provider credentials are stored server-side.




