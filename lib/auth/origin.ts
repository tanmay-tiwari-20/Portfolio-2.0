import "next/dist/compiled/server-only";
/** All admin mutations are same-origin JSON requests, including login/logout. */
export function allowedAdminOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin || origin === "null") return false;
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  try {
    // Configure this server-only value when a reverse proxy changes req.url's origin.
    // Do not trust arbitrary forwarded host/protocol headers to authorize mutations.
    const configured = process.env.ADMIN_ORIGIN?.trim();
    const expected = new URL(configured || req.url);
    if (
      configured &&
      (expected.pathname !== "/" ||
        expected.search ||
        expected.hash ||
        expected.username ||
        expected.password)
    )
      return false;
    if (process.env.NODE_ENV === "production" && expected.protocol !== "https:")
      return false;
    return origin === expected.origin;
  } catch {
    return false;
  }
}
