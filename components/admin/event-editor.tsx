"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import { resolveHackShastraEvents } from "@/lib/hackshastra-content";
import type { CommunityEvent } from "@/lib/validators/schemas";

export default function EventEditor({
  value,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  value: Partial<CommunityEvent>;
  onChange: (event: Partial<CommunityEvent>) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const [posterError, setPosterError] = useState<string | null>(null);
  const preview = resolveHackShastraEvents([
    {
      id: "draft",
      createdAt: "",
      updatedAt: "",
      sortOrder: 0,
      title: "",
      date: "",
      venue: "",
      description: "",
      status: "upcoming",
      attendees: 0,
      ...value,
      isPublished: true,
    },
  ])[0];
  const invalidImage = Boolean(
    value.image?.url && !isCloudinaryImageUrl(value.image.url),
  );

  useEffect(() => {
    const previous = document.activeElement;
    title.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);

  return (
    <div
      className="admin-modal-overlay"
      data-lenis-prevent="true"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={dialog}
        className="admin-modal-box"
        data-lenis-prevent="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-editor-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
            ) ?? [],
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="event-editor-title" className="display text-[22px]">
              {value.id ? "Edit HackShastra Event" : "Add HackShastra Event"}
            </h2>
            <p className="form-help-text">
              Control the event details, artwork and visibility on your
              HackShastra page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="button button-secondary"
            aria-label="Close event editor"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSave();
          }}
        >
          <fieldset disabled={saving} className="contents">
            <div>
              <label className="form-label" htmlFor="event-title">
                Event title
              </label>
              <input
                ref={title}
                id="event-title"
                value={value.title ?? ""}
                onChange={(event) =>
                  onChange({ ...value, title: event.target.value })
                }
                className="form-input"
                required
                maxLength={180}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="event-date">
                  Event date
                </label>
                <input
                  id="event-date"
                  value={value.date ?? ""}
                  onChange={(event) =>
                    onChange({ ...value, date: event.target.value })
                  }
                  placeholder="DD-MM-YYYY"
                  className="form-input"
                  required
                  maxLength={120}
                  aria-describedby="event-date-help"
                />
                <p id="event-date-help" className="form-help-text">
                  Use DD-MM-YYYY for chronological ordering, or the known
                  month/year.
                </p>
              </div>
              <div>
                <label className="form-label" htmlFor="event-status">
                  Status
                </label>
                <select
                  id="event-status"
                  value={value.status ?? "upcoming"}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      status: event.target.value as CommunityEvent["status"],
                    })
                  }
                  className="form-select"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="event-display-date">
                Date shown in the event index
              </label>
              <input
                id="event-display-date"
                value={preview.date}
                onChange={(event) =>
                  onChange({ ...value, displayDate: event.target.value })
                }
                className="form-input"
                maxLength={120}
                aria-describedby="event-display-date-help"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p id="event-display-date-help" className="form-help-text">
                  Use a date range or month/year. Clear this field to hide the
                  date.
                </p>
                <button
                  type="button"
                  className="text-xs underline underline-offset-4"
                  onClick={() => onChange({ ...value, displayDate: undefined })}
                >
                  Use default date
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="event-category">
                  Event type
                </label>
                <input
                  id="event-category"
                  value={preview.category ?? ""}
                  onChange={(event) =>
                    onChange({ ...value, category: event.target.value })
                  }
                  placeholder="Meetup, hackathon, technology expo…"
                  className="form-input"
                  maxLength={80}
                />
                <button
                  type="button"
                  className="mt-2 text-xs underline underline-offset-4"
                  onClick={() => onChange({ ...value, category: undefined })}
                >
                  Use default type
                </button>
              </div>
              <div>
                <label className="form-label" htmlFor="event-role">
                  HackShastra’s involvement
                </label>
                <input
                  id="event-role"
                  value={preview.role}
                  onChange={(event) =>
                    onChange({ ...value, role: event.target.value })
                  }
                  placeholder="Organizer, campus chapter, collaboration…"
                  className="form-input"
                  maxLength={180}
                />
                <button
                  type="button"
                  className="mt-2 text-xs underline underline-offset-4"
                  onClick={() => onChange({ ...value, role: undefined })}
                >
                  Use default involvement
                </button>
              </div>
            </div>
            <p className="form-help-text">
              Existing verified details appear by default. Clear a type or
              involvement field to hide it.
            </p>
            <div>
              <label className="form-label" htmlFor="event-venue">
                Venue / location{" "}
                <span className="form-label-optional">Optional</span>
              </label>
              <input
                id="event-venue"
                value={value.venue ?? ""}
                onChange={(event) =>
                  onChange({ ...value, venue: event.target.value })
                }
                className="form-input"
                maxLength={240}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="event-description">
                Description
              </label>
              <textarea
                id="event-description"
                value={preview.description}
                onChange={(event) =>
                  onChange({ ...value, description: event.target.value })
                }
                className="form-textarea"
                rows={3}
                maxLength={2000}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="event-link">
                Event page link{" "}
                <span className="form-label-optional">Optional</span>
              </label>
              <input
                id="event-link"
                type="url"
                value={value.link ?? ""}
                onChange={(event) =>
                  onChange({ ...value, link: event.target.value })
                }
                placeholder="https://..."
                pattern="https://.*"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="event-poster-url">
                Event photograph / poster URL{" "}
                <span className="form-label-optional">Optional</span>
              </label>
              <input
                id="event-poster-url"
                type="url"
                value={value.image?.url ?? ""}
                onChange={(event) => {
                  const url = event.target.value.trim();
                  setPosterError(null);
                  onChange({
                    ...value,
                    image: url
                      ? { url, alt: value.image?.alt ?? "" }
                      : undefined,
                  });
                }}
                placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                className="form-input"
                aria-describedby="event-poster-help"
              />
              <p id="event-poster-help" className="form-help-text">
                Paste a public HTTPS Cloudinary image URL. Clear it to remove
                the artwork.
              </p>
              {invalidImage && (
                <p className="form-error-text" role="alert">
                  Enter a valid HTTPS Cloudinary image URL.
                </p>
              )}
              {value.image?.url && !invalidImage && (
                <>
                  <label className="form-label mt-4" htmlFor="event-image-alt">
                    Image description
                  </label>
                  <input
                    id="event-image-alt"
                    value={value.image.alt}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        image: { ...value.image!, alt: event.target.value },
                      })
                    }
                    placeholder="Describe the photograph or identify the official poster"
                    className="form-input"
                    maxLength={300}
                  />
                  <div className="event-poster-preview">
                    {posterError === value.image.url ? (
                      <p className="form-help-text" role="status">
                        The image could not be loaded. Check the URL; the public
                        page will use its event fallback until the image is
                        available.
                      </p>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={value.image.url}
                        alt={
                          value.image.alt ||
                          `${value.title || "Event"} artwork preview`
                        }
                        onError={() => setPosterError(value.image!.url)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="event-attendees">
                Attendees count
              </label>
              <input
                id="event-attendees"
                type="number"
                min={0}
                step={1}
                value={value.attendees ?? 0}
                onChange={(event) =>
                  onChange({ ...value, attendees: Number(event.target.value) })
                }
                className="form-input"
              />
              <p className="form-help-text">
                Stored with your event record; not shown in the public event
                index.
              </p>
            </div>
            <label className="flex min-h-12 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={value.isPublished !== false}
                onChange={(event) =>
                  onChange({ ...value, isPublished: event.target.checked })
                }
              />
              Published on the HackShastra page
            </label>
            <div className="mt-3 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="button button-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || invalidImage}
                className="button button-primary"
              >
                {saving ? "Saving…" : "Save event"} <Check size={16} />
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
