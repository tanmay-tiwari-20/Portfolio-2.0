import { revalidatePath } from "next/cache";
import { cleanupOrphanedImages } from "@/lib/cloudinary/cleanup";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { currentAdmin } from "@/lib/auth/session";
import { repos } from "@/lib/db";
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
export async function GET(req:Request){if(!await currentAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});const key=new URL(req.url).searchParams.get("collection") as Key|null;if(!key||!(key in entries))return NextResponse.json({error:"Unknown collection"},{status:400});return NextResponse.json(await entries[key].repo.getAll())}
export async function POST(req: Request) {
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowedOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.collection !== "string" ||
    !Object.hasOwn(entries, body.collection)
  ) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const entry = entries[body.collection as Key];
  const now = new Date().toISOString();
  const item = body.item && typeof body.item === "object" && !Array.isArray(body.item)
    ? body.item as Record<string, unknown>
    : {};
  // These values are owned by the server. The create form intentionally only
  // submits editable content fields, so supply metadata before validating.
  const parsed = entry.schema.safeParse({
    ...item,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content", details: parsed.error.flatten() }, { status: 400 });
  }

  const created = await entry.repo.create(parsed.data as never);
  refresh();
  return NextResponse.json(created, { status: 201 });
}
export async function PATCH(req:Request){if(!await currentAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});if(!allowedOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});const body=await req.json().catch(()=>null);if(!body||!(body.collection in entries)||typeof body.id!=="string")return NextResponse.json({error:"Invalid request"},{status:400});const entry=entries[body.collection as Key];const before=await entry.repo.getById(body.id);const parsed=entry.schema.partial().safeParse(body.patch);if(!parsed.success)return NextResponse.json({error:"Invalid content",details:parsed.error.flatten()},{status:400});const result=await entry.repo.update(body.id,parsed.data as never);if(!result)return NextResponse.json({error:"Not found"},{status:404});await cleanupOrphanedImages(before,result);refresh();return NextResponse.json(result)}
export async function DELETE(req:Request){if(!await currentAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});if(!allowedOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});const body=await req.json().catch(()=>null);if(!body||!(body.collection in entries)||typeof body.id!=="string")return NextResponse.json({error:"Invalid request"},{status:400});const repo=entries[body.collection as Key].repo;const before=await repo.getById(body.id);const ok=await repo.delete(body.id);if(ok){await cleanupOrphanedImages(before,null);refresh()}return NextResponse.json({ok})}
export async function PUT(req:Request){if(!await currentAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});if(!allowedOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});const body=await req.json().catch(()=>null);if(!body||!(body.collection in entries)||!Array.isArray(body.ids)||body.ids.some((x:unknown)=>typeof x!=="string"))return NextResponse.json({error:"Invalid request"},{status:400});const rows=await entries[body.collection as Key].repo.reorder(body.ids);refresh();return NextResponse.json(rows)}



