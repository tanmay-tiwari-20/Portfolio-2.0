import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { currentAdmin } from "@/lib/auth/session";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!await currentAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const section = String(body.section || "portfolio").replace(/[^a-z0-9-]/gi, "").slice(0, 48) || "portfolio";
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `portfolio/${section}`;
  const allowedFormats = "jpg,png,webp,gif,avif";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, allowed_formats: allowedFormats },
    process.env.CLOUDINARY_API_SECRET,
  );
  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
    allowedFormats,
  });
}
