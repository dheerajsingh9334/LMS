import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string; messageId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the course owner (teacher)
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Toggle pin status
    const message = await db.liveChatMessage.findUnique({
      where: {
        id: params.messageId,
      }
    });

    if (!message) {
      return new NextResponse("Message not found", { status: 404 });
    }

    const updatedMessage = await db.liveChatMessage.update({
      where: {
        id: params.messageId,
      },
      data: {
        isPinned: !message.isPinned,
      }
    });

    return NextResponse.json({ 
      message: "Message pin status updated",
      isPinned: updatedMessage.isPinned 
    });

  } catch (error) {
    console.error("Error updating message pin status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string; messageId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the course owner (teacher) or message owner
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    const message = await db.liveChatMessage.findUnique({
      where: {
        id: params.messageId,
      }
    });

    if (!message) {
      return new NextResponse("Message not found", { status: 404 });
    }

    // Allow deletion if user is teacher or message owner
    if (!course && message.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.liveChatMessage.delete({
      where: {
        id: params.messageId,
      }
    });

    return NextResponse.json({ message: "Message deleted successfully" });

  } catch (error) {
    console.error("Error deleting message:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}