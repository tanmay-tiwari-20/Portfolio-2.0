import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth/session";
import { testMongoConnection } from "@/lib/db/mongodb";

export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await testMongoConnection();
  return NextResponse.json({
    success: status.success,
    message: status.success
      ? "Connected to MongoDB."
      : process.env.MONGODB_URI?.trim()
        ? "Database connection unavailable. Check the server configuration."
        : "Using local JSON storage.",
    dbName: status.dbName,
    // Never send connection strings, even partially masked, to the browser.
    uriMasked: process.env.MONGODB_URI?.trim()
      ? "Configured on server"
      : "Not configured",
    collections: status.collections,
  });
}
