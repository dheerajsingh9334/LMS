import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; assignmentId: string; submissionId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    if (!submission || submission.assignment.course.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    // Apply late penalty if applicable
    let finalScore = values.score;
    if (submission.isLate && submission.assignment.allowLateSubmission) {
      const penaltyAmount =
        (values.score * submission.assignment.latePenalty * submission.daysLate) / 100;
      finalScore = Math.max(0, values.score - penaltyAmount);
    }

    const gradedSubmission = await db.assignmentSubmission.update({
      where: {
        id: params.submissionId,
      },
      data: {
        score: Math.round(finalScore),
        feedback: values.feedback,
        gradedAt: new Date(),
        gradedBy: userId,
        status: "graded",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(gradedSubmission);
  } catch (error) {
    console.log("[GRADE_SUBMISSION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
