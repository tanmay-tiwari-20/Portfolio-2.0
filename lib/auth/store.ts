import "next/dist/compiled/server-only";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getMongoDb, isMongoConfigured } from "@/lib/db/mongodb";

const stateSchema = z.object({
  version: z.number().int().nonnegative(),
  sessions: z.record(z.string(), z.number()),
  attempts: z.record(
    z.string(),
    z.object({ count: z.number().int(), until: z.number() }),
  ),
});
type State = z.infer<typeof stateSchema>;
const emptyState = (): State => ({ version: 0, sessions: {}, attempts: {} });
const windowMs = 15 * 60_000;
const perClientLimit = 6;
const globalLimit = 60;
const stateId = "admin-auth-v1";
const queues = new Map<string, Promise<unknown>>();
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const statePath = () =>
  path.join(
    /*turbopackIgnore: true*/ path.resolve(
      process.env.DATA_DIR?.trim() ||
        path.join(/*turbopackIgnore: true*/ process.cwd(), "data"),
    ),
    ".admin-auth.json",
  );

function prune(state: State, now: number) {
  for (const [id, expires] of Object.entries(state.sessions))
    if (expires <= now) delete state.sessions[id];
  for (const [key, attempt] of Object.entries(state.attempts))
    if (attempt.until <= now) delete state.attempts[key];
}

async function collection() {
  const db = await getMongoDb();
  if (!db) throw new Error("Authentication storage is unavailable.");
  return db.collection<State & { _id: string }>("admin_auth");
}

async function readFileState(file: string): Promise<State> {
  try {
    return stateSchema.parse(JSON.parse(await fs.readFile(file, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw new Error("Authentication storage is unavailable.");
  }
}

async function mutate<T>(operation: (state: State) => T): Promise<T> {
  if (isMongoConfigured()) {
    const store = await collection();
    try {
      await store.updateOne(
        { _id: stateId },
        { $setOnInsert: { ...emptyState() } },
        { upsert: true },
      );
    } catch (error) {
      // A concurrent first request may have inserted the unique state document.
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    // Compare-and-swap keeps throttles and session revocation shared across instances.
    for (let retry = 0; retry < 20; retry++) {
      const current = stateSchema.parse(await store.findOne({ _id: stateId }));
      const previousVersion = current.version;
      prune(current, Date.now());
      const result = operation(current);
      current.version++;
      const write = await store.replaceOne(
        { _id: stateId, version: previousVersion },
        current,
      );
      if (write.modifiedCount) return result;
    }
    throw new Error("Authentication storage is busy.");
  }

  // The JSON adapter is for one Node process on a persistent disk, like content storage.
  const file = statePath();
  const previous = queues.get(file) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const state = await readFileState(file);
      prune(state, Date.now());
      const result = operation(state);
      state.version++;
      await fs.mkdir(path.dirname(file), { recursive: true });
      const temporary = `${file}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
        await fs.rename(temporary, file);
      } finally {
        await fs.unlink(temporary).catch(() => undefined);
      }
      return result;
    });
  queues.set(file, next);
  try {
    return await next;
  } finally {
    if (queues.get(file) === next) queues.delete(file);
  }
}

export async function addSession(id: string, expires: number) {
  return mutate((state) => {
    // Bound private state even if a client repeatedly signs in successfully.
    const sessions = Object.entries(state.sessions).sort((a, b) => a[1] - b[1]);
    for (const [key] of sessions.slice(0, Math.max(0, sessions.length - 127)))
      delete state.sessions[key];
    state.sessions[digest(id)] = expires;
  });
}

export async function sessionIsActive(id: string): Promise<boolean> {
  const state = isMongoConfigured()
    ? stateSchema.parse(
        (await (await collection()).findOne({ _id: stateId })) ?? emptyState(),
      )
    : await readFileState(statePath());
  return (state.sessions[digest(id)] ?? 0) > Date.now();
}

export async function revokeSession(id: string) {
  return mutate((state) => {
    delete state.sessions[digest(id)];
  });
}

export async function consumeLoginAttempt(
  client: string,
  now = Date.now(),
): Promise<number> {
  return mutate((state) => {
    const key = digest(client);
    const keys = [
      [key, perClientLimit],
      ["global", globalLimit],
    ] as const;
    for (const [id, limit] of keys) {
      const attempt = state.attempts[id];
      if (attempt && attempt.until > now && attempt.count >= limit)
        return Math.max(1, Math.ceil((attempt.until - now) / 1000));
    }
    for (const [id] of keys) {
      const attempt = state.attempts[id];
      state.attempts[id] =
        attempt && attempt.until > now
          ? { ...attempt, count: attempt.count + 1 }
          : { count: 1, until: now + windowMs };
    }
    return 0;
  });
}

export async function clearClientAttempts(client: string) {
  return mutate((state) => {
    delete state.attempts[digest(client)];
  });
}
