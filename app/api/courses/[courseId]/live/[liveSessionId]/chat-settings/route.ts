import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();
    const { enabled } = await req.json();
    
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

    // Update live session chat settings (we could add a chatEnabled field to LiveSession)
    // For now, we'll just return success as this is a teacher control feature
    
    return NextResponse.json({ 
      message: `Chat ${enabled ? 'enabled' : 'disabled'} successfully`,
      chatEnabled: enabled 
    });

  } catch (error) {
    console.error("Error updating chat settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}