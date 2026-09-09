import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      db: "not_configured",
      message:
        "App is running. Set DATABASE_URL when you have Postgres — no code change required.",
    });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, db: "error", message: "Failed to create database client." },
      { status: 503 },
    );
  }

  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "ok" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database ping failed";
    return NextResponse.json(
      { ok: false, db: "error", message },
      { status: 503 },
    );
  }
}
