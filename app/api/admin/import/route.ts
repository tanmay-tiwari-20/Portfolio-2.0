import { revalidatePath } from "next/cache";
import { cleanupOrphanedImages } from "@/lib/cloudinary/cleanup";
import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth/session";
import { repos } from "@/lib/db";
import { experienceSchema, eventSchema, hackathonSchema, projectSchema, profileSchema, socialSchema, settingsSchema } from "@/lib/validators/schemas";

const map = { profile: [repos.profile, profileSchema], experiences: [repos.experiences, experienceSchema], projects: [repos.projects, projectSchema], events: [repos.events, eventSchema], hackathons: [repos.hackathons, hackathonSchema], socials: [repos.socials, socialSchema], settings: [repos.settings, settingsSchema] } as const;
export async function POST(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const data = await req.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ error: "Invalid backup" }, { status: 400 });
  const replacements = new Map<keyof typeof map, unknown[]>();
  for (const key of Object.keys(map) as (keyof typeof map)[]) {
    if (!(key in data)) continue;
    const values = (data as Record<string, unknown>)[key];
    if (!Array.isArray(values)) return NextResponse.json({ error: `${key} must be an array` }, { status: 400 });
    const [, schema] = map[key];
    const parsed = values.map((row) => schema.safeParse(row));
    const bad = parsed.find((result) => !result.success);
    if (bad && !bad.success) return NextResponse.json({ error: `Invalid ${key} data`, details: bad.error.flatten() }, { status: 400 });
    const ids = values.map((row) => (row as { id: string }).id);
    if (new Set(ids).size !== ids.length) return NextResponse.json({ error: `${key} contains duplicate IDs` }, { status: 400 });
    if (key === "projects") {
      const slugs = values.map((row) => (row as { slug: string }).slug);
      if (new Set(slugs).size !== slugs.length) return NextResponse.json({ error: "projects contains duplicate slugs" }, { status: 400 });
    }
    replacements.set(key, parsed.map((result) => result.success ? result.data : null));
  }
  const snapshots = new Map<keyof typeof map, unknown[]>();
  try {
    for (const key of replacements.keys()) snapshots.set(key, await map[key][0].getAll());
    for (const [key, rows] of replacements) await map[key][0].replaceAll(rows as never[]);
  } catch (error) {
    for (const [key, rows] of snapshots) {
      try { await map[key][0].replaceAll(rows as never[]); } catch (rollbackError) { console.error(`Backup rollback failed for ${key}`, rollbackError); }
    }
    console.error("Backup import failed and was rolled back", error);
    return NextResponse.json({ error: "Backup could not be imported; previous content was restored where possible." }, { status: 500 });
  }
  for (const [key, oldRows] of snapshots) await cleanupOrphanedImages(oldRows, replacements.get(key));
  for (const path of ["/", "/about", "/projects", "/hackshastra", "/hackathons", "/contact"]) revalidatePath(path);
  revalidatePath("/projects/[slug]", "page");
  return NextResponse.json({ ok: true });
}
