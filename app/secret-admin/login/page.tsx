import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/admin/login-form";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Verification",
  robots: { index: false, follow: false },
};

export default function AdminLogin() {
  return (
    <main
      className="admin-shell-modern"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div style={{ width: "min(460px, 100%)" }}>
        <Link
          href="/"
          className="text-link"
          style={{ marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <ArrowLeft size={16} /> Return to portfolio
        </Link>

        <section
          className="timeline-card"
          style={{
            margin: 0,
            padding: "40px 32px",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
            borderColor: "rgba(255, 30, 39, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--spidey-red)",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 0 20px var(--spidey-red-glow)",
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div className="eyebrow" style={{ margin: 0, padding: "3px 10px", fontSize: 10 }}>
                AUTHENTICATION
              </div>
              <h1 className="display" style={{ fontSize: 26, margin: "4px 0 0" }}>
                Secret Access
              </h1>
            </div>
          </div>

          <p style={{ color: "var(--spidey-text-dim)", fontSize: 14, marginBottom: 26, lineHeight: 1.5 }}>
            Enter your passphrase to access live portfolio editing and database controls.
          </p>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
