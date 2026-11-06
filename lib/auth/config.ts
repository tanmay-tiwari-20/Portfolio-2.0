import "next/dist/compiled/server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Node-only: never import authentication modules into a client component.
export const sessionLifetimeSeconds = 8 * 60 * 60;
export const sessionCookieName = "spider-session";
export const maxPasswordLength = 1024;

export function authConfigurationError(): string | null {
  if (!process.env.ADMIN_PASSWORD?.trim())
    return "ADMIN_PASSWORD is missing or empty.";
  if (process.env.ADMIN_PASSWORD === "replace_with_your_own_password")
    return "ADMIN_PASSWORD still contains the example placeholder.";
  if (process.env.ADMIN_PASSWORD.length > maxPasswordLength)
    return "ADMIN_PASSWORD exceeds the supported length.";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return "SESSION_SECRET must contain at least 32 characters.";
  }
  if (
    process.env.SESSION_SECRET === "replace-with-at-least-32-random-characters"
  )
    return "SESSION_SECRET still contains the example placeholder.";
  return null;
}

export function signingKey(): Uint8Array {
  if (authConfigurationError())
    throw new Error("Admin authentication is not configured.");
  // Rotating either server secret immediately invalidates previously signed cookies.
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update("portfolio-admin-v3\0")
    .update(process.env.ADMIN_PASSWORD!)
    .digest();
}

export function passwordMatches(submitted: unknown): boolean {
  if (
    authConfigurationError() ||
    typeof submitted !== "string" ||
    !submitted.length ||
    submitted.length > maxPasswordLength
  )
    return false;
  const digest = (value: string) =>
    createHash("sha256").update(value, "utf8").digest();
  // Equal-length digests make timingSafeEqual safe for arbitrary password lengths.
  return timingSafeEqual(
    digest(submitted),
    digest(process.env.ADMIN_PASSWORD!),
  );
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: sessionLifetimeSeconds,
  };
}
