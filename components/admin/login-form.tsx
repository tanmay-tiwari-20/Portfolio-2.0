"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowUpRight, AlertCircle, Mail } from "lucide-react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to sign in.");
      router.replace("/secret-admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 20 }}>
      <div>
        <label className="form-label">
          <Mail size={13} style={{ display: "inline", marginRight: 6 }} /> Admin Email
        </label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@example.com"
          className="form-input"
          required
        />
      </div>

      <div>
        <label className="form-label">
          <Lock size={13} style={{ display: "inline", marginRight: 6 }} /> Secret Passphrase
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          className="form-input"
          required
        />
      </div>

      <button
        type="submit"
        className="button button-primary"
        disabled={busy}
        style={{ width: "100%", marginTop: 8 }}
      >
        {busy ? "Authenticating..." : "Access Command Center"} <ArrowUpRight size={18} />
      </button>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(255, 30, 39, 0.12)",
            border: "1px solid var(--spidey-red)",
            color: "var(--spidey-red)",
            fontSize: 13,
            fontWeight: 500,
          }}
          role="alert"
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
