import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getMongoDb, isMongoConfigured } from "@/lib/db/mongodb";
import { prepareMongoPatch } from "@/lib/db/mongo-patch";
import { cache } from "react";

export interface Repository<T extends { id: string; sortOrder?: number }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, "id"> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  reorder(ids: string[], additionalOrderField?: keyof T & string): Promise<T[]>;
  replaceAll(items: T[]): Promise<T[]>;
}

const queues = new Map<string, Promise<unknown>>();
const dataRoot = () => path.resolve(process.env.DATA_DIR?.trim() || path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));

export class JsonFileRepository<T extends { id: string; sortOrder?: number; createdAt?: string; updatedAt?: string }> implements Repository<T> {
  constructor(private file: string, private schema: z.ZodType<T>, private seed: T[]) {}
  private path() { return path.join(/*turbopackIgnore: true*/ dataRoot(), this.file); }

  private async read(): Promise<T[]> {
    await fs.mkdir(dataRoot(), { recursive: true });
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(this.path(), "utf8"));
      return z.array(this.schema).parse(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await this.write(this.seed);
      return this.seed;
    }
  }

  private async write(rows: T[]) {
    const safe = z.array(this.schema).parse(rows);
    const file = this.path();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${nanoid(8)}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(safe, null, 2), "utf8");
    await fs.rename(tmp, file);
  }

  private async mutate<R>(fn: (rows: T[]) => Promise<[T[], R]> | [T[], R]): Promise<R> {
    const key = this.path();
    const prior = queues.get(key) || Promise.resolve();
    const next: Promise<R> = prior.catch(() => undefined).then(async (): Promise<R> => {
      const [rows, result] = await fn(await this.read());
      await this.write(rows);
      return result;
    });
    queues.set(key, next);
    try { return await next; }
    finally { if (queues.get(key) === next) queues.delete(key); }
  }

  getAll(): Promise<T[]> { return this.read(); }
  async getById(id: string): Promise<T | null> { return (await this.read()).find((x) => x.id === id) || null; }

  create(item: Omit<T, "id"> & { id?: string }): Promise<T> {
    const now = new Date().toISOString();
    const value = { ...item, id: item.id || nanoid(), createdAt: (item as Partial<T>).createdAt || now, updatedAt: (item as Partial<T>).updatedAt || now } as unknown as T;
    return this.mutate<T>((rows): [T[], T] => [[...rows, value], value]);
  }

  update(id: string, patch: Partial<T>): Promise<T | null> {
    return this.mutate<T | null>((rows): [T[], T | null] => {
      const index = rows.findIndex((x) => x.id === id);
      if (index < 0) return [rows, null];
      const valueToParse: Record<string, unknown> = { ...rows[index], ...patch, id, updatedAt: new Date().toISOString() };
      for (const [key, patchValue] of Object.entries(patch)) {
        if (patchValue === null) delete valueToParse[key];
      }
      const value = this.schema.parse(valueToParse);
      rows[index] = value;
      return [rows, value];
    });
  }

  delete(id: string): Promise<boolean> {
    return this.mutate<boolean>((rows): [T[], boolean] => {
      const rest = rows.filter((x) => x.id !== id);
      return [rest, rest.length !== rows.length];
    });
  }

  reorder(ids: string[], additionalOrderField?: keyof T & string): Promise<T[]> {
    return this.mutate<T[]>((rows): [T[], T[]] => {
      const byId = new Map(rows.map((row) => [row.id, row]));
      const selected: T[] = [];
      ids.forEach((id, sortOrder) => {
        const row = byId.get(id);
        if (row) selected.push({ ...row, sortOrder, ...(additionalOrderField ? { [additionalOrderField]: sortOrder } : {}) });
      });
      const used = new Set(selected.map((row) => row.id));
      const rest = rows.filter((row) => !used.has(row.id)).map((row, index) => ({ ...row, sortOrder: selected.length + index, ...(additionalOrderField ? { [additionalOrderField]: selected.length + index } : {}) }));
      const ordered: T[] = [...selected, ...rest];
      return [ordered, ordered];
    });
  }
  replaceAll(items: T[]): Promise<T[]> {
    return this.mutate<T[]>(() => [z.array(this.schema).parse(items), z.array(this.schema).parse(items)]);
  }
}

export class MongoRepository<T extends { id: string; sortOrder?: number }> implements Repository<T> {
  private indexEnsured = false;

  constructor(
    private collectionName: string,
    private schema: z.ZodType<T>
  ) {}

  private async getCollection() {
    const db = await getMongoDb();
    if (!db) throw new Error("Could not connect to MongoDB");
    const col = db.collection(this.collectionName);

    if (!this.indexEnsured) {
      await col.createIndex({ id: 1 }, { unique: true });
      this.indexEnsured = true;
    }

    return col;
  }

  private cleanDoc(rawDoc: Record<string, unknown>): T {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = rawDoc;
    return this.schema.parse(rest);
  }

  async getAll(): Promise<T[]> {
    const col = await this.getCollection();
    const docs = await col.find({}).sort({ sortOrder: 1, createdAt: -1 }).toArray();
    return docs.map((d) => this.cleanDoc(d as Record<string, unknown>));
  }

  async getById(id: string): Promise<T | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return this.cleanDoc(doc as Record<string, unknown>);
  }

  async create(item: Omit<T, "id"> & { id?: string }): Promise<T> {
    const col = await this.getCollection();
    const now = new Date().toISOString();
    const doc = this.schema.parse({
      ...item,
      id: item.id || nanoid(),
      createdAt: now,
      updatedAt: now,
      sortOrder: item.sortOrder ?? 0,
    });
    await col.insertOne({ ...(doc as Record<string, unknown>) });
    return doc;
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const col = await this.getCollection();
    const current = await this.getById(id);
    if (!current) return null;

    const { updated, operation } = prepareMongoPatch(
      this.schema, current, patch, new Date().toISOString(),
    );
    // Another request may reorder or change an unrelated field after our read.
    // Do not write those values back from the stale validation snapshot.
    await col.updateOne({ id }, operation);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.getCollection();
    const res = await col.deleteOne({ id });
    return res.deletedCount > 0;
  }

  async reorder(ids: string[], additionalOrderField?: keyof T & string): Promise<T[]> {
    if (ids.length === 0) return this.getAll();
    const col = await this.getCollection();
    await col.bulkWrite(
      ids.map((id, sortOrder) => ({
        updateOne: { filter: { id }, update: { $set: { sortOrder, ...(additionalOrderField ? { [additionalOrderField]: sortOrder } : {}) } } },
      })),
      { ordered: true },
    );
    return this.getAll();
  }
  async replaceAll(items: T[]): Promise<T[]> {
    const col = await this.getCollection();
    const docs = z.array(this.schema).parse(items);
    const session = await (await getMongoDb())!.client.startSession();
    try {
      await session.withTransaction(async () => {
        await col.deleteMany({}, { session });
        if (docs.length) await col.insertMany(docs.map((x) => ({ ...x })), { session });
      });
    } finally { await session.endSession(); }
    return docs;
  }
}

export class UnifiedRepository<T extends { id: string; sortOrder?: number }> implements Repository<T> {
  private mongoRepo: MongoRepository<T>;
  private jsonRepo: JsonFileRepository<T>;

  constructor(
    collectionName: string,
    jsonFile: string,
    schema: z.ZodType<T>,
    seed: T[]
  ) {
    this.mongoRepo = new MongoRepository(collectionName, schema);
    this.jsonRepo = new JsonFileRepository(jsonFile, schema, seed);
  }

  private async getActiveRepo(): Promise<Repository<T>> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        if (db) return this.mongoRepo;
        throw new Error("MongoDB is configured but unavailable; refusing to write to a divergent JSON store.");
      } catch (err) {
        throw new Error("MongoDB is configured but unavailable; refusing to write to a divergent JSON store.", { cause: err });
      }
    }
    return this.jsonRepo;
  }

  // Deduplicate layout, metadata and page reads within a React request only.
  // Admin edits remain visible on the next request without cache invalidation.
  private readAll = cache(async (): Promise<T[]> => {
    const repo = await this.getActiveRepo();
    return repo.getAll();
  });

  async getAll(): Promise<T[]> { return this.readAll(); }

  async getById(id: string): Promise<T | null> {
    const repo = await this.getActiveRepo();
    return repo.getById(id);
  }

  async create(item: Omit<T, "id"> & { id?: string }): Promise<T> {
    const repo = await this.getActiveRepo();
    return repo.create(item);
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const repo = await this.getActiveRepo();
    return repo.update(id, patch);
  }

  async delete(id: string): Promise<boolean> {
    const repo = await this.getActiveRepo();
    return repo.delete(id);
  }

  async reorder(ids: string[], additionalOrderField?: keyof T & string): Promise<T[]> {
    const repo = await this.getActiveRepo();
    return repo.reorder(ids, additionalOrderField);
  }
  async replaceAll(items: T[]): Promise<T[]> { return (await this.getActiveRepo()).replaceAll(items); }
}
