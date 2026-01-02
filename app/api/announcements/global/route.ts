import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get latest active global announcement (for dashboard banner)
export async function GET() {
  try {
    const announcement = await db.globalAnnouncement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcement ?? null);
  } catch (error) {
    console.log("[GLOBAL_ANNOUNCEMENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Create a new global announcement (admin only)
export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.id || user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content, isActive = true } = await req.json();

    if (!title || !content) {
      return new NextResponse("Missing title or content", { status: 400 });
    }

    const createdBy = user.id;

    const announcement = await db.globalAnnouncement.create({
      data: {
        title,
        content,
        createdBy,
        isActive,
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.log("[GLOBAL_ANNOUNCEMENT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
