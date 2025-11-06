import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get assignment and verify ownership
    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
      },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    // Check if user is the course owner/teacher
    if (assignment.course.userId !== user.id && assignment.teacherId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all submissions for this assignment
    const submissions = await db.assignmentSubmission.findMany({
      where: {
        assignmentId: params.assignmentId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        grader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMISSIONS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}