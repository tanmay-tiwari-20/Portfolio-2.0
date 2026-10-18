import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/admin/login-form";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Spider Command Center // Login",
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
      <div style={{ width: "min(480px, 100%)" }}>
        <Link
          href="/"
          className="text-link"
          style={{ marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <ArrowLeft size={16} /> Back to public portfolio
        </Link>

        <section
          className="timeline-card"
          style={{
            margin: 0,
            padding: "42px 36px",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--spidey-red)",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 0 18px var(--spidey-red-glow)",
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="eyebrow" style={{ margin: 0, padding: "3px 10px", fontSize: 10 }}>
                SECURE AUTHENTICATION
              </div>
              <h1 className="display" style={{ fontSize: 28, margin: "4px 0 0" }}>
                Command Center
              </h1>
            </div>
          </div>

          <p style={{ color: "var(--spidey-text-dim)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
            Authenticate with your admin credentials to access live project management, database controls, and instant publishing.
          </p>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
