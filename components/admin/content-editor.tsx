"use client";
import { useCallback, useEffect, useState } from "react";
const collections = ["profile", "experiences", "projects", "events", "hackathons", "socials", "settings"] as const;
type Collection = typeof collections[number];
type Row = { id: string };
export default function ContentEditor() {
  const [collection, setCollection] = useState<Collection>("projects");
  const [source, setSource] = useState("[]");
  const [original, setOriginal] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (key: Collection) => {
    setCollection(key); setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/content?collection=${key}`);
      const rows = await response.json();
      if (!response.ok) throw new Error(rows.error || "Could not load records.");
      setOriginal(rows); setSource(JSON.stringify(rows, null, 2));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load records."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load("projects"); }, [load]);
  async function save() {
    setBusy(true); setMessage("");
    try {
      const rows: Row[] = JSON.parse(source);
      if (!Array.isArray(rows)) throw new Error("Content must be a JSON array.");
      const ids = new Set(rows.map(row => row.id));
      for (const old of original) if (!ids.has(old.id)) {
        const response = await fetch("/api/admin/content", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collection, id: old.id }) });
        if (!response.ok) throw new Error("Could not remove a record.");
      }
      for (const row of rows) {
        const exists = original.some(old => old.id === row.id);
        const response = await fetch("/api/admin/content", { method: exists ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exists ? { collection, id: row.id, patch: row } : { collection, item: row }) });
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Could not save all records."); }
      }
      const order = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collection, ids: rows.map(row => row.id) }) });
      if (!order.ok) throw new Error("Records saved, but ordering could not be updated.");
      setOriginal(rows); setMessage("Saved content changes.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check the JSON syntax and record fields."); }
    finally { setBusy(false); }
  }
  async function importBackup(file: File) {
    try {
      const data = JSON.parse(await file.text());
      const response = await fetch("/api/admin/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to import backup.");
      setMessage("Backup imported. Reload the collection to review it.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to import backup."); }
  }
  return <section className="admin-card" style={{ maxWidth: "none", margin: "24px 0" }}>
    <h2>Content editor</h2><p className="form-note">Edit the selected collection as JSON. Save creates, updates, removes, and reorders records after server validation.</p>
    <div className="editor-toolbar"><select value={collection} onChange={event => void load(event.target.value as Collection)}>{collections.map(item => <option key={item} value={item}>{item}</option>)}</select><button className="filter-chip" onClick={() => void load(collection)}>Reload</button><a className="filter-chip" href="/api/admin/export">Download backup</a><label className="filter-chip">Import backup<input type="file" accept="application/json,.json" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void importBackup(file); }}/></label></div>
    <textarea className="json-editor" value={source} onChange={event => setSource(event.target.value)} spellCheck={false} aria-label={`${collection} JSON`}/><button className="button button-primary" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save changes"}<span>↗</span></button>{message && <p className="form-note" role="status">{message}</p>}
  </section>;
}
