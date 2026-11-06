import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import LoginForm from "@/components/admin/login-form";
import { currentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in · Portfolio Studio",
  robots: { index: false, follow: false },
};

export default async function AdminLogin() {
  if (await currentAdmin()) redirect("/secret-admin");

  return (
    <main className="admin-login flex min-h-svh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10 sm:py-7">
        <div className="admin-brand flex items-center gap-3">
          <span className="admin-brand-mark" aria-hidden="true">
            TT<span>.</span>
          </span>
          <div>
            <strong>Portfolio</strong>
            <span>Content studio</span>
          </div>
        </div>
        <Link
          href="/"
          className="admin-back-link inline-flex min-h-11 items-center gap-2 text-[13px]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to portfolio
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <section
          className="admin-login-panel w-full max-w-[420px]"
          aria-labelledby="login-title"
        >
          <div className="admin-login-icon mb-7" aria-hidden="true">
            <LockKeyhole size={22} strokeWidth={1.6} />
          </div>
          <p className="admin-kicker mb-3">YOUR WORKSPACE</p>
          <h1
            id="login-title"
            className="mb-3 text-[30px] leading-tight font-semibold tracking-[-0.045em] sm:text-[34px]"
          >
            Welcome back.
          </h1>
          <p className="mb-8 max-w-[350px] text-[14px] leading-relaxed text-[var(--spidey-muted)]">
            A little space to keep your portfolio moving. Sign in to manage your
            work and stories.
          </p>
          <LoginForm />
        </section>
      </div>

      <footer className="px-5 py-6 text-center text-[12px] text-[var(--spidey-muted)]">
        Tanmay Tiwari{" "}
        <span aria-hidden="true" className="px-2">
          /
        </span>{" "}
        Portfolio administration
      </footer>
    </main>
  );
}
