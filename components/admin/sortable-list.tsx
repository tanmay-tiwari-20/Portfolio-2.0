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
}: {
  collection: string;
  items: T[];
  onChange: (items: T[]) => void;
  onNotify: (message: string, type: "success" | "error") => void;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  async function move(from: number, to: number) {
    if (busy.current || from === to || to < 0 || to >= items.length) return;
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
      if (!response.ok) throw new Error("The new order could not be saved.");
      onNotify("Content order saved.", "success");
    } catch {
      onChange(previous);
      onNotify("Could not save the new order. Your previous order was restored.", "error");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="admin-sortable-list" aria-busy={saving}>
      {items.length === 0 && <p className="admin-empty-state">No content yet. Use the button above to add the first item.</p>}
      {items.map((item, index) => (
        <div
          className="admin-sortable-row"
          key={item.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            if (Number.isInteger(from)) void move(from, index);
          }}
        >
          <div className="admin-sort-controls" aria-label={`Reorder item ${index + 1}`}>
            <button
              type="button"
              className="admin-order-button"
              aria-label={`Move item ${index + 1} up`}
              title="Move up"
              disabled={saving || index === 0}
              onClick={() => void move(index, index - 1)}
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              className="admin-order-button admin-drag-handle"
              aria-label={`Drag item ${index + 1} to reorder`}
              title="Drag to reorder"
              draggable={!saving}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(index));
              }}
            >
              <GripVertical size={16} />
            </button>
            <button
              type="button"
              className="admin-order-button"
              aria-label={`Move item ${index + 1} down`}
              title="Move down"
              disabled={saving || index === items.length - 1}
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
