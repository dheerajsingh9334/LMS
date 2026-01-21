import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  // Minimal, non-sensitive health information
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasAuthUrl = Boolean(process.env.NEXTAUTH_URL);
  const hasAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);

  return NextResponse.json({
    ok: true,
    env: {
      DATABASE_URL: hasDbUrl,
      NEXTAUTH_URL: hasAuthUrl,
      NEXTAUTH_SECRET: hasAuthSecret,
    },
    timestamp: new Date().toISOString(),
  });
}
