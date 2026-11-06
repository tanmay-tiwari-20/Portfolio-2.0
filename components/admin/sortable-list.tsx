"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

type SortableItem = { id: string };

export default function SortableList<T extends SortableItem>({
  collection,
  items,
  onChange,
  onNotify,
  renderItem,
  disabled = false,
}: {
  collection: string;
  items: T[];
  onChange: (items: T[]) => void;
  onNotify: (message: string, type: "success" | "error") => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  async function move(from: number, to: number) {
    if (
      disabled ||
      busy.current ||
      from === to ||
      from < 0 ||
      from >= items.length ||
      to < 0 ||
      to >= items.length
    )
      return;
    const previous = items;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);

    busy.current = true;
    setSaving(true);
    onChange(next);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection,
          ids: next.map((row) => row.id),
          expectedIds: previous.map((row) => row.id),
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "The new order could not be saved.");
      }
      const saved = (await response.json()) as T[];
      onChange(saved);
      onNotify("Content order saved.", "success");
    } catch (error) {
      onChange(previous);
      onNotify(
        `${error instanceof Error ? error.message : "Could not save the new order."} Your previous order was restored.`,
        "error",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div
      className="admin-sortable-list"
      role="list"
      aria-label={`${collection} content`}
      aria-busy={saving}
    >
      {items.length === 0 && (
        <p className="admin-empty-state">
          No content yet. Use the button above to add the first item.
        </p>
      )}
      {items.map((item, index) => (
        <div
          className="admin-sortable-row"
          role="listitem"
          key={item.id}
          onDragOver={(event) => {
            if (
              !disabled &&
              !saving &&
              event.dataTransfer.types.includes("application/x-portfolio-order")
            ) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            try {
              const dragged = JSON.parse(
                event.dataTransfer.getData("application/x-portfolio-order"),
              );
              if (
                dragged.collection === collection &&
                typeof dragged.id === "string"
              ) {
                const from = items.findIndex((row) => row.id === dragged.id);
                if (from !== -1) void move(from, index);
              }
            } catch {
              // Ignore unrelated files, links and text dropped onto this list.
            }
          }}
        >
          <div
            className="admin-sort-controls"
            aria-label={`Reorder item ${index + 1}`}
          >
            <button
              type="button"
              className="admin-order-button"
              aria-label={`Move item ${index + 1} up`}
              title="Move up"
              disabled={disabled || saving || index === 0}
              onClick={() => void move(index, index - 1)}
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              className="admin-order-button admin-drag-handle"
              aria-label={`Drag item ${index + 1} to reorder`}
              title="Drag to reorder"
              disabled={disabled || saving}
              tabIndex={-1}
              draggable={!disabled && !saving}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(
                  "application/x-portfolio-order",
                  JSON.stringify({ collection, id: item.id }),
                );
              }}
            >
              <GripVertical size={16} />
            </button>
            <button
              type="button"
              className="admin-order-button"
              aria-label={`Move item ${index + 1} down`}
              title="Move down"
              disabled={disabled || saving || index === items.length - 1}
              onClick={() => void move(index, index + 1)}
            >
              <ArrowDown size={15} />
            </button>
          </div>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
