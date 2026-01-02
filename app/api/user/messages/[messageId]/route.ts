import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Mark a single message as read
export async function PATCH(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.userMessage.updateMany({
      where: { id: params.messageId, recipientId: user.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[USER_MESSAGE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
