import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth/session";

const attempts = new Map<string, { count: number; until: number }>();
const limit = 6;
const lockMs = 15 * 60_000;

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();

    for (const [key, value] of attempts) {
      if (value.until < now - lockMs) attempts.delete(key);
    }

    const state = attempts.get(ip);
    if (state && state.until > now && state.count >= limit) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const password = body.password || "";
    const rawHash = process.env.ADMIN_PASSWORD_HASH;
    if (!rawHash || !/^\$2[aby]\$\d\d\$/.test(rawHash)) {
      return NextResponse.json({ error: "Admin password hash is not configured." }, { status: 503 });
    }
    const hash = rawHash.replace(/\\(\$)/g, "$1");

    const passwordOk = await bcrypt.compare(password, hash).catch(() => false);

    if (!passwordOk) {
      const count = state?.until && state.until > now ? state.count + 1 : 1;
      attempts.set(ip, { count, until: count >= limit ? now + lockMs : now + lockMs });
      return NextResponse.json(
        { error: "Incorrect passphrase. Access denied." },
        { status: 401 }
      );
    }

    attempts.delete(ip);

    const adminEmail = process.env.ADMIN_EMAIL || "tanmay@portfolio";
    await createSession(adminEmail);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Login Handler Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal authentication error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const { cookies } = await import("next/headers");
  (await cookies()).delete("spider-session");
  return NextResponse.json({ ok: true });
}
