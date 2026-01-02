import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("Admin endpoint removed", { status: 404 });
}
