"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!password.length) {
      setError("Enter your password to continue.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many attempts. Please wait a few minutes and try again."
            : response.status === 401 || response.status === 400
              ? "That password isn’t correct. Please try again."
              : "Sign-in is temporarily unavailable. Please try again later.",
        );
        submitting.current = false;
        setBusy(false);
        return;
      }
      setPassword("");
      router.replace("/secret-admin");
      router.refresh();
    } catch {
      setError("We couldn’t connect. Check your connection and try again.");
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" aria-busy={busy}>
      <div>
        <label htmlFor="admin-password" className="form-label">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="form-input admin-password-input"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            disabled={busy}
            maxLength={1024}
            required
          />
          <button
            type="button"
            className="admin-password-toggle absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            disabled={busy}
          >
            {visible ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {error && (
        <p
          id="login-error"
          className="admin-inline-error flex items-start gap-2.5"
          role="alert"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}
      <button
        type="submit"
        className="button button-primary admin-login-submit w-full"
        disabled={busy}
      >
        {busy ? (
          <>
            <LoaderCircle size={17} className="admin-spin" aria-hidden="true" />{" "}
            Signing in…
          </>
        ) : (
          <>
            Sign in to workspace <ArrowRight size={17} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
