import "next/dist/compiled/server-only";
import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  authConfigurationError,
  sessionLifetimeSeconds,
  signingKey,
} from "@/lib/auth/config";

const issuer = "portfolio-admin-v3";
const audience = "portfolio-admin";

export async function issueToken(email: string) {
  const id = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setJti(id)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(signingKey());
  return { token, id, expiresAt };
}

export async function readToken(token?: string) {
  if (!token || authConfigurationError()) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      issuer,
      audience,
    });
    if (
      typeof payload.email !== "string" ||
      typeof payload.jti !== "string" ||
      !payload.exp ||
      !payload.iat
    )
      return null;
    if (payload.exp - payload.iat > sessionLifetimeSeconds) return null;
    return { email: payload.email, id: payload.jti };
  } catch {
    return null;
  }
}

// Lightweight proxy gate. Backend handlers additionally check the session store.
export async function verifyToken(token?: string) {
  return (await readToken(token))?.email ?? null;
}
