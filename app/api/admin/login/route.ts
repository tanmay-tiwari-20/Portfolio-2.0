import { NextResponse } from "next/server";
import { authConfigurationError, passwordMatches } from "@/lib/auth/config";
import { allowedAdminOrigin } from "@/lib/auth/origin";
import { clearSession, createSession } from "@/lib/auth/session";
import { clearClientAttempts, consumeLoginAttempt } from "@/lib/auth/store";

export const runtime = "nodejs";
const unavailable = () =>
  NextResponse.json(
    { error: "Sign-in is temporarily unavailable. Please try again later." },
    { status: 503 },
  );

async function boundedBody(req: Request): Promise<string | null> {
  if (!req.body || Number(req.headers.get("content-length")) > 8192)
    return null;
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > 8192) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(req: Request) {
  if (!allowedAdminOrigin(req))
    return NextResponse.json(
      { error: "Request not allowed." },
      { status: 403 },
    );
  const configurationError = authConfigurationError();
  if (configurationError) {
    console.error(`[Admin auth] ${configurationError}`);
    return unavailable();
  }
  try {
    // A global cap also applies, so spoofed client forwarding headers cannot bypass throttling.
    const client = (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    ).slice(0, 128);
    const retryAfter = await consumeLoginAttempt(client);
    if (retryAfter)
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    if (
      !req.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    ) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    // Bound parsing work before accepting any submitted field.
    const raw = await boundedBody(req);
    if (raw === null)
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const password =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as { password?: unknown }).password
        : undefined;
    if (!passwordMatches(password))
      return NextResponse.json(
        { error: "The password is incorrect. Please try again." },
        { status: 401 },
      );
    await clearClientAttempts(client);
    await createSession(process.env.ADMIN_EMAIL?.trim() || "admin");
    return NextResponse.json({ ok: true });
  } catch {
    console.error(
      "[Admin auth] Sign-in could not complete. Check authentication storage availability.",
    );
    return unavailable();
  }
}

export async function DELETE(req: Request) {
  if (!allowedAdminOrigin(req))
    return NextResponse.json(
      { error: "Request not allowed." },
      { status: 403 },
    );
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch {
    console.error(
      "[Admin auth] Sign-out could not complete. Check authentication storage availability.",
    );
    return NextResponse.json(
      { error: "Unable to sign out. Please try again." },
      { status: 503 },
    );
  }
}
