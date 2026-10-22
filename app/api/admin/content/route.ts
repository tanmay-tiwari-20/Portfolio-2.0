import { revalidatePath } from "next/cache";
import { cleanupOrphanedImages } from "@/lib/cloudinary/cleanup";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { currentAdmin } from "@/lib/auth/session";
import { repos } from "@/lib/db";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import {
  experienceSchema,
  eventSchema,
  hackathonSchema,
  projectSchema,
  profileSchema,
  socialSchema,
  settingsSchema,
} from "@/lib/validators/schemas";

const entries = {
  profile: { repo: repos.profile, schema: profileSchema },
  experiences: { repo: repos.experiences, schema: experienceSchema },
  projects: { repo: repos.projects, schema: projectSchema },
  events: { repo: repos.events, schema: eventSchema },
  hackathons: { repo: repos.hackathons, schema: hackathonSchema },
  socials: { repo: repos.socials, schema: socialSchema },
  settings: { repo: repos.settings, schema: settingsSchema },
} as const;
type Key = keyof typeof entries;
const reorderQueues = new Map<Key, Promise<void>>();

async function withReorderLock<T>(key: Key, operation: () => Promise<T>): Promise<T> {
  const previous = reorderQueues.get(key) ?? Promise.resolve();
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.catch(() => undefined).then(() => gate);
  reorderQueues.set(key, queued);
  await previous.catch(() => undefined);
  try {
    return await operation();
  } finally {
    release();
    if (reorderQueues.get(key) === queued) reorderQueues.delete(key);
  }
}

function isKey(value: unknown): value is Key {
  return typeof value === "string" && Object.hasOwn(entries, value);
}

function refresh() {
  for (const path of ["/", "/experience", "/projects", "/hackshastra", "/hackathons", "/contact"]) {
    revalidatePath(path);
  }
  revalidatePath("/projects/[slug]", "page");
}

function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}
export async function GET(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = new URL(req.url).searchParams.get("collection");
  if (!isKey(key)) return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  return NextResponse.json(await entries[key].repo.getAll());
}
export async function POST(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowedOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !isKey(body.collection)
  ) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const entry = entries[body.collection as Key];
  const now = new Date().toISOString();
  const item = body.item && typeof body.item === "object" && !Array.isArray(body.item)
    ? body.item as Record<string, unknown>
    : {};
  if (body.collection === "events" && item.image !== undefined && item.image !== null) {
    const imageUrl = (item.image as Record<string, unknown>)?.url;
    if (typeof imageUrl !== "string" || !isCloudinaryImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Event poster must be a valid HTTPS Cloudinary image URL" }, { status: 400 });
    }
  }
  if (body.collection === "hackathons" && item.role !== "Judge" && item.role !== "Mentor") {
    return NextResponse.json({ error: "Role must be Judge or Mentor" }, { status: 400 });
  }
  const existingItems = await entry.repo.getAll();
  const nextOrder = existingItems.reduce((max, row) => Math.max(max, row.sortOrder ?? -1), -1) + 1;
  // These values are owned by the server. The create form intentionally only
  // submits editable content fields, so supply metadata before validating.
  const parsed = entry.schema.safeParse({
    ...item,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    sortOrder: nextOrder,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content", details: parsed.error.flatten() }, { status: 400 });
  }

  const created = await entry.repo.create(parsed.data as never);
  refresh();
  return NextResponse.json(created, { status: 201 });
}
export async function PATCH(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowedOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || !isKey(body.collection) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const collection = body.collection as Key;
  const patch = body.patch && typeof body.patch === "object" && !Array.isArray(body.patch)
    ? body.patch as Record<string, unknown>
    : {};
  if (collection === "hackathons" && patch.role !== undefined && patch.role !== "Judge" && patch.role !== "Mentor") {
    return NextResponse.json({ error: "Role must be Judge or Mentor" }, { status: 400 });
  }
  const removalFields = Object.keys(patch).filter((field) => patch[field] === null);
  const parsedPatch = { ...patch };
  for (const field of removalFields) delete parsedPatch[field];
  if (collection === "events" && parsedPatch.image !== undefined) {
    const imageUrl = (parsedPatch.image as Record<string, unknown> | null)?.url;
    if (typeof imageUrl !== "string" || !isCloudinaryImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Event poster must be a valid HTTPS Cloudinary image URL" }, { status: 400 });
    }
  }

  const entry = entries[collection];
  const before = await entry.repo.getById(body.id);
  const parsed = entry.schema.partial().safeParse(parsedPatch);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content", details: parsed.error.flatten() }, { status: 400 });
  }
  const updates = { ...parsed.data, ...Object.fromEntries(removalFields.map((field) => [field, null])) };
  const result = await entry.repo.update(body.id, updates as never);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await cleanupOrphanedImages(before, result);
  refresh();
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowedOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || !isKey(body.collection) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const collection = body.collection as Key;
  const repo = entries[collection].repo;
  const before = await repo.getById(body.id);
  const ok = await repo.delete(body.id);
  if (ok) {
    await cleanupOrphanedImages(before, null);
    refresh();
  }
  return NextResponse.json({ ok });
}

export async function PUT(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowedOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !isKey(body.collection) ||
    !Array.isArray(body.ids) ||
    body.ids.some((id: unknown) => typeof id !== "string") ||
    !Array.isArray(body.expectedIds) ||
    body.expectedIds.some((id: unknown) => typeof id !== "string")
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const collection = body.collection as Key;
  const ids = body.ids as string[];
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Duplicate item ids are not allowed" }, { status: 400 });
  }
  const expectedIds = body.expectedIds as string[];
  if (new Set(expectedIds).size !== expectedIds.length) {
    return NextResponse.json({ error: "Invalid previous order" }, { status: 400 });
  }
  return withReorderLock(collection, async () => {
    const entry = entries[collection];
    const current = await entry.repo.getAll();
    const currentIds = current.map((row) => row.id);
    if (expectedIds.length !== currentIds.length || expectedIds.some((id, index) => id !== currentIds[index])) {
      return NextResponse.json({ error: "This list changed elsewhere. Refresh and try again." }, { status: 409 });
    }
    if (ids.length !== current.length || current.some((row) => !ids.includes(row.id))) {
      return NextResponse.json({ error: "Order must include every item in this collection exactly once" }, { status: 400 });
    }
    const rows = await entry.repo.reorder(ids);
    refresh();
    return NextResponse.json(rows);
  });
}



