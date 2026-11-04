import type { z } from "zod";

/** Validate the entire record, but write only fields owned by this operation. */
export function prepareMongoPatch<T extends { id: string }>(
  schema: z.ZodType<T>,
  current: T,
  patch: Partial<T> | Record<string, unknown>,
  updatedAt: string,
) {
  const submitted = patch as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...current, ...submitted };
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(submitted)) {
    if (key === "id" || key === "updatedAt") continue;
    if (value === null) {
      delete merged[key];
      unset[key] = "";
    }
  }
  merged.id = current.id;
  merged.updatedAt = updatedAt;
  const updated = schema.parse(merged);
  const validated = updated as Record<string, unknown>;
  const set: Record<string, unknown> = {
    updatedAt: validated.updatedAt ?? updatedAt,
  };
  for (const key of Object.keys(submitted)) {
    if (key === "id" || key === "updatedAt" || submitted[key] === null)
      continue;
    // Schema-stripped keys and removed fields must not reach $set. Nested
    // objects remain replacements, using their complete validated value.
    if (Object.hasOwn(validated, key)) set[key] = validated[key];
  }
  return {
    updated,
    operation: {
      $set: set,
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    },
  };
}
