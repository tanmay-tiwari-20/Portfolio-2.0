import type { CommunityEvent } from "@/lib/validators/schemas";

/** Omitted fields stay untouched; an explicitly removed optional field is null. */
export function prepareEventPatch(
  item: Partial<CommunityEvent> | Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = { ...item };
  for (const field of ["image", "category", "role", "displayDate"] as const) {
    if (Object.hasOwn(item, field) && item[field] === undefined)
      patch[field] = null;
  }
  for (const field of [
    "id",
    "createdAt",
    "updatedAt",
    "sortOrder",
    "archiveOrder",
  ])
    delete patch[field];
  return patch;
}

/** New events append once an editor has chosen a manual archive order. */
export function nextEventArchiveOrder(
  records: readonly Pick<CommunityEvent, "archiveOrder">[],
): number | undefined {
  const positions = records.flatMap((record) =>
    record.archiveOrder === undefined ? [] : [record.archiveOrder],
  );
  return positions.length ? Math.max(...positions) + 1 : undefined;
}
