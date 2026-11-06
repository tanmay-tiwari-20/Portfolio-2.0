"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function EditorDialog({
  title,
  children,
  onClose,
  busy = false,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="admin-modal-box"
      aria-labelledby={compact ? "confirmation-title" : "editor-title"}
      style={compact ? { maxWidth: 440 } : undefined}
      data-lenis-prevent="true"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const dialog = event.currentTarget;
        const controls = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header className="admin-modal-header">
        <div>
          <h2 id={compact ? "confirmation-title" : "editor-title"}>{title}</h2>
          {!compact && <p>Changes appear on your portfolio after you save.</p>}
        </div>
        <button
          type="button"
          className="admin-icon-button"
          aria-label="Close editor"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="admin-modal-body">{children}</div>
    </dialog>
  );
}
