import "next/dist/compiled/server-only";
import { cookies } from "next/headers";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/config";
import { issueToken, readToken } from "@/lib/auth/token";
import { addSession, revokeSession, sessionIsActive } from "@/lib/auth/store";
export { sessionCookieName } from "@/lib/auth/config";
export { verifyToken } from "@/lib/auth/token";

export async function createSession(email: string) {
  const jar = await cookies();
  const previous = await readToken(jar.get(sessionCookieName)?.value);
  if (previous) await revokeSession(previous.id);
  const { token, id, expiresAt } = await issueToken(email);
  await addSession(id, expiresAt * 1000);
  jar.set(sessionCookieName, token, sessionCookieOptions());
}

export async function currentAdmin() {
  const session = await readToken(
    (await cookies()).get(sessionCookieName)?.value,
  );
  if (!session) return null;
  try {
    return (await sessionIsActive(session.id)) ? session.email : null;
  } catch {
    console.error(
      "[Admin auth] Session storage is unavailable; access denied.",
    );
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  const session = await readToken(jar.get(sessionCookieName)?.value);
  if (session) await revokeSession(session.id);
  jar.set(sessionCookieName, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
