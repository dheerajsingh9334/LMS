import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; quizId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { answers, score } = await req.json();

    // Get quiz details
    const quiz = await db.quiz.findUnique({
      where: {
        id: params.quizId,
        isPublished: true,
      },
      include: {
        chapter: {
          select: {
            course: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Check if user has purchased the course or is the instructor
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    const isPurchased = !!purchase && purchase.paymentStatus === "completed";
    const isInstructor = quiz.chapter.course.userId === user.id;

    if (!isPurchased && !isInstructor) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Check if user already has an attempt (each user can only attempt once)
    const existingAttempt = await db.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: user.id,
          quizId: params.quizId,
        },
      },
    });

    if (existingAttempt) {
      // Update existing attempt (for retakes)
      const updatedAttempt = await db.quizAttempt.update({
        where: {
          id: existingAttempt.id,
        },
        data: {
          score,
          answers,
          createdAt: new Date(), // Update timestamp for retake
        },
      });

      return NextResponse.json(updatedAttempt);
    } else {
      // Create new attempt
      const attempt = await db.quizAttempt.create({
        data: {
          userId: user.id,
          quizId: params.quizId,
          score,
          answers,
        },
      });

      return NextResponse.json(attempt);
    }
  } catch (error) {
    console.error("[QUIZ_ATTEMPT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}