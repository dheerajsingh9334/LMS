import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkPlagiarism } from "@/lib/plagiarism-check";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
      },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    if (!assignment.isPublished) {
      return new NextResponse("Assignment not available", { status: 403 });
    }

    // Check if student is enrolled
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: params.courseId,
        },
      },
    });

    if (!purchase && !assignment.course.isFree) {
      return new NextResponse("Not enrolled", { status: 403 });
    }

    const values = await req.json();

    // Calculate if late
    const now = new Date();
    const isLate = now > assignment.dueDate;
    const daysLate = isLate
      ? Math.ceil((now.getTime() - assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (isLate && !assignment.allowLateSubmission) {
      return new NextResponse("Submissions closed", { status: 403 });
    }

    // Upsert submission
    const submission = await db.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: params.assignmentId,
          studentId: userId,
        },
      },
      update: {
        submissionType: values.submissionType,
        fileUrl: values.fileUrl,
        fileName: values.fileName,
        fileSize: values.fileSize,
        linkUrl: values.linkUrl,
        textContent: values.textContent,
        isLate,
        daysLate,
        submittedAt: new Date(),
        status: "submitted",
        score: null,
        feedback: null,
        gradedAt: null,
        gradedBy: null,
      },
      create: {
        assignmentId: params.assignmentId,
        studentId: userId,
        submissionType: values.submissionType,
        fileUrl: values.fileUrl,
        fileName: values.fileName,
        fileSize: values.fileSize,
        linkUrl: values.linkUrl,
        textContent: values.textContent,
        isLate,
        daysLate,
      },
    });

    // Run plagiarism check if enabled and text submission
    if (assignment.enablePlagiarismCheck && values.submissionType === "text" && values.textContent) {
      try {
        await checkPlagiarism(submission.id, values.textContent);
      } catch (error) {
        console.error("[PLAGIARISM_CHECK_ERROR]", error);
        // Don't fail the submission if plagiarism check fails
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.log("[SUBMISSION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
      },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    const isTeacher = assignment.course.userId === userId;

    if (isTeacher) {
      // Teachers see all submissions
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
        },
        orderBy: {
          submittedAt: "desc",
        },
      });
      return NextResponse.json(submissions);
    } else {
      // Students see only their submission
      const submission = await db.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: params.assignmentId,
            studentId: userId,
          },
        },
      });
      return NextResponse.json(submission);
    }
  } catch (error) {
    console.log("[SUBMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
