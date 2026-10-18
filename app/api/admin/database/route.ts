import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth/session";
import { testMongoConnection } from "@/lib/db/mongodb";

export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await testMongoConnection();
  return NextResponse.json(status);
}
