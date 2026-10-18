import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  const source = path.resolve("data");
  const destination = path.resolve(process.env.DATA_DIR || "data");
  await mkdir(destination, { recursive: true });
  for (const name of ["profile.json", "experiences.json", "projects.json", "community-events.json", "hackathons.json", "social-links.json", "site-settings.json"]) {
    const target = path.join(destination, name);
    try {
      await access(target);
      console.log(`Kept ${name}`);
    } catch {
      await copyFile(path.join(source, name), target);
      console.log(`Seeded ${name}`);
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Could not seed portfolio data.");
  process.exitCode = 1;
});
