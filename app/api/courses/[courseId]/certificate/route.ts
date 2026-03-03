import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventBus, EventName } from "@/lib/events";
import "@/lib/events/init";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id || !user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;

    // Check if student has purchased the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        chapters: {
          include: {
            quizzes: {
              where: {
                isPublished: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check if course is free or purchased
    if (!course.isFree && (!purchase || purchase.paymentStatus !== "completed")) {
      return new NextResponse("Course not purchased", { status: 403 });
    }

    // Calculate all quizzes in the course
    let totalQuizzes = 0;
    let allQuizIds: string[] = [];

    course.chapters.forEach((chapter) => {
      totalQuizzes += chapter.quizzes.length;
      allQuizIds.push(...chapter.quizzes.map((q) => q.id));
    });

    if (totalQuizzes === 0) {
      return new NextResponse("No quizzes available in this course", { status: 400 });
    }

    // Get all quiz attempts for this user in this course
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: user.id,
        quizId: {
          in: allQuizIds,
        },
      },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    const completedQuizzes = quizAttempts.length;

    // Check if all quizzes are completed
    if (completedQuizzes < totalQuizzes) {
      return new NextResponse(
        `Please complete all quizzes. Completed: ${completedQuizzes}/${totalQuizzes}`,
        { status: 400 }
      );
    }

    // Calculate total score
    let totalScore = 0;
    let achievedScore = 0;

    quizAttempts.forEach((attempt) => {
      const maxScore = attempt.quiz.questions.length; // 1 point per question
      totalScore += maxScore;
      achievedScore += attempt.score;
    });

    const percentage = totalScore > 0 ? (achievedScore / totalScore) * 100 : 0;

    // Check if certificate already exists
    const existingCertificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingCertificate) {
      return NextResponse.json(existingCertificate);
    }

    // Create certificate
    const certificate = await db.certificate.create({
      data: {
        userId: user.id,
        courseId: courseId,
        studentName: user.name || "Student",
        studentEmail: user.email || "",
        totalChapters: course.chapters.length,
        completedChapters: course.chapters.length,
        totalQuizzes,
        completedQuizzes,
        totalAssignments: 0,
        completedAssignments: 0,
        totalScore,
        achievedScore,
        percentage: Math.round(percentage * 100) / 100,
        verificationCode: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      },
    });

    // Emit certificate issued event
    eventBus.emit(EventName.CERTIFICATE_ISSUED, {
      certificateId: certificate.id,
      courseId,
      courseTitle: course.title || "Course",
      studentId: user.id,
      studentName: user.name || "Student",
      percentage: Math.round(percentage * 100) / 100,
      timestamp: new Date(),
      triggeredBy: user.id,
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.log("[CERTIFICATE_GENERATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const certificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
      include: {
        course: {
          select: {
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!certificate) {
      return new NextResponse("Certificate not found", { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.log("[CERTIFICATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
