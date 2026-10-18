"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, KeyRound } from "lucide-react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password.trim()) return;

    setBusy(true);
    setError("");

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Incorrect passphrase.");
      window.location.href = "/secret-admin";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Access denied.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 20 }}>
      <div>
        <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <KeyRound size={14} color="var(--spidey-red)" />
          <span>Secret Access Passphrase</span>
        </label>
        <div style={{ position: "relative" }}>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter passphrase..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: 44,
              fontSize: 15,
              borderRadius: "var(--radius-md)",
            }}
            required
            autoFocus
          />
          <Lock
            size={18}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--spidey-muted)",
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="button button-primary"
        disabled={busy}
        style={{ width: "100%", minHeight: 50, borderRadius: "var(--radius-pill)" }}
      >
        {busy ? "Verifying..." : "Unlock Workspace"} <ArrowRight size={18} />
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
