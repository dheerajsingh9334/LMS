import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; assignmentId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      submissionId,
      score,
      feedback
    } = await req.json();

    // Get assignment details
    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
      },
      include: {
        course: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    // Check if user is the instructor
    if (assignment.course.userId !== user.id) {
      return new NextResponse("Access denied - Only instructor can grade", { status: 403 });
    }

    // Validate score
    if (typeof score !== "number" || score < 0 || score > assignment.maxScore) {
      return new NextResponse(`Score must be between 0 and ${assignment.maxScore}`, { status: 400 });
    }

    // Get submission
    const submission = await db.assignmentSubmission.findUnique({
      where: {
        id: submissionId,
      },
    });

    if (!submission) {
      return new NextResponse("Submission not found", { status: 404 });
    }

    if (submission.assignmentId !== params.assignmentId) {
      return new NextResponse("Submission does not belong to this assignment", { status: 400 });
    }

    // Update submission with grade
    const gradedSubmission = await db.assignmentSubmission.update({
      where: {
        id: submissionId,
      },
      data: {
        status: "graded",
        score,
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedBy: user.id,
      },
    });

    return NextResponse.json(gradedSubmission);
  } catch (error) {
    console.error("[ASSIGNMENT_GRADE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}