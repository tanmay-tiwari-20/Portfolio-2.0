/** Local-only verification server. Uses generated test credentials and a separate data copy. */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp, mkdir, mkdtemp, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const mode = process.argv.includes("--production") ? "start" : "dev";
const missingPassword = process.argv.includes("--missing-password");
const port = process.env.ADMIN_TEST_PORT || "3137";
const folder = await mkdtemp(path.join(tmpdir(), "portfolio-admin-test-"));
await cp("data", folder, {
  recursive: true,
  filter: (source) => !source.includes(".admin-auth"),
});
const runtime = {
  baseURL: `http://localhost:${port}`,
  requestOrigin: `${mode === "start" ? "https" : "http"}://localhost:${port}`,
  password: randomBytes(24).toString("hex"),
  dataDir: folder,
};
const output = path.resolve(".next-admin-test/verification");
await mkdir(output, { recursive: true });
const runtimeFile = path.join(
  output,
  missingPassword
    ? "runtime-missing.json"
    : mode === "start"
      ? "runtime-production.json"
      : "runtime.json",
);
await writeFile(runtimeFile, JSON.stringify(runtime), { mode: 0o600 });
const child = spawn(
  process.execPath,
  mode === "start"
    ? [".next/standalone/server.js"]
    : ["node_modules/next/dist/bin/next", mode, "--port", port],
  {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      NODE_ENV: mode === "start" ? "production" : "development",
      ADMIN_TEST_MODE: mode === "dev" ? "1" : "0",
      ADMIN_PASSWORD: missingPassword ? "" : runtime.password,
      ADMIN_ORIGIN: runtime.requestOrigin,
      PORT: port,
      HOSTNAME: "localhost",
      SESSION_SECRET: randomBytes(40).toString("hex"),
      DATA_DIR: folder,
      MONGODB_URI: "",
      CLOUDINARY_API_SECRET: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_CLOUD_NAME: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
child.on("exit", async (code) => {
  await unlink(runtimeFile).catch(() => {});
  process.exit(code || 0);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
console.log(
  `Isolated admin ${mode} server: ${runtime.baseURL}. Credentials are temporary; repository content is unchanged.`,
);
