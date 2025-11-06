import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string; pollId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the course owner
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // End the poll
    await db.livePoll.update({
      where: {
        id: params.pollId,
      },
      data: {
        isActive: false,
      }
    });

    return NextResponse.json({ message: "Poll ended successfully" });

  } catch (error) {
    console.error("Error ending poll:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string; pollId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the course owner
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the poll and its votes
    await db.livePoll.delete({
      where: {
        id: params.pollId,
      }
    });

    return NextResponse.json({ message: "Poll deleted successfully" });

  } catch (error) {
    console.error("Error deleting poll:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}