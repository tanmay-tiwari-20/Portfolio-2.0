import { v2 as cloudinary } from "cloudinary";
import { repos } from "@/lib/db";
function collectPublicIds(value: unknown, output = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) collectPublicIds(item, output);
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) {
    if (key === "publicId" && typeof item === "string") output.add(item);
    else collectPublicIds(item, output);
  }
  return output;
}

export async function isImageReferenced(publicId: string) {
  const records = await Promise.all(Object.values(repos).map((repo) => repo.getAll()));
  return collectPublicIds(records).has(publicId);
}

export async function cleanupOrphanedImages(before: unknown, after: unknown) {
  const oldIds = collectPublicIds(before);
  const keepIds = collectPublicIds(after);
  const records = await Promise.all(Object.values(repos).map((repo) => repo.getAll()));
  collectPublicIds(records, keepIds);
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return;
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  for (const publicId of oldIds) if (!keepIds.has(publicId)) {
    try { await cloudinary.uploader.destroy(publicId); }
    catch (error) { console.error("Cloudinary orphaned asset", publicId, error); }
  }
}
