import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Admin sends direct messages to specific users
export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.id || user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { recipientIds, title, body } = await req.json();

    if (
      !title ||
      !body ||
      !Array.isArray(recipientIds) ||
      recipientIds.length === 0
    ) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const senderId = user.id;

    const data = recipientIds.map((recipientId: string) => ({
      senderId,
      recipientId,
      title,
      body,
    }));

    const created = await db.userMessage.createMany({ data });

    return NextResponse.json({ count: created.count });
  } catch (error) {
    console.log("[ADMIN_MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
