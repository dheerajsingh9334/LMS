import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { score, feedback } = await req.json();

    // Validate score
    if (typeof score !== "number" || score < 0 || score > 100) {
      return new NextResponse("Invalid score", { status: 400 });
    }

    // Get submission and verify ownership
    const submission = await db.assignmentSubmission.findUnique({
      where: {
        id: params.submissionId,
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      return new NextResponse("Submission not found", { status: 404 });
    }

    // Check if user is the course owner/teacher
    if (submission.assignment.course.userId !== user.id && submission.assignment.teacherId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update submission with grade
    const updatedSubmission = await db.assignmentSubmission.update({
      where: {
        id: params.submissionId,
      },
      data: {
        score,
        feedback: feedback || null,
        status: "graded",
        gradedAt: new Date(),
        gradedBy: user.id,
      },
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("[SUBMISSION_GRADE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}