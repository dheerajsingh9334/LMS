import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eventBus, EventName } from "@/lib/events";
import "@/lib/events/init";

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

    // Emit assignment graded event
    eventBus.emit(EventName.ASSIGNMENT_GRADED, {
      assignmentId: params.assignmentId,
      assignmentTitle: submission.assignment.title || "Assignment",
      courseId: params.courseId,
      studentId: submission.studentId,
      grade: Math.round(finalScore),
      maxGrade: submission.assignment.maxScore || 100,
      feedback: values.feedback,
      timestamp: new Date(),
      triggeredBy: userId!,
    });

    return NextResponse.json(gradedSubmission);
  } catch (error) {
    console.log("[GRADE_SUBMISSION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
