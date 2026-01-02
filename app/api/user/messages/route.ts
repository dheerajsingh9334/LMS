import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// List messages for the current user
export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const messages = await db.userMessage.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.log("[USER_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Mark all messages as read
export async function PATCH() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await db.userMessage.updateMany({
      where: { recipientId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.log("[USER_MESSAGES_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
