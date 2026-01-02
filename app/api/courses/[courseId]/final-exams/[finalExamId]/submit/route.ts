import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; finalExamId: string } }
) {
  try {
    const user = await currentUser();
    const { answers } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = params.courseId;
    const finalExamId = params.finalExamId;

    // Check if course exists and user has access
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check if user purchased the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id!,
          courseId: courseId,
        },
      },
    });

    if (!purchase && course.userId !== user.id) {
      return new NextResponse("Not enrolled in this course", { status: 403 });
    }

    // Get final exam with questions
    const finalExam = await db.finalExam.findUnique({
      where: {
        id: finalExamId,
        courseId: courseId,
      },
      include: {
        questions: true,
      },
    });

    if (!finalExam) {
      return new NextResponse("Final exam not found", { status: 404 });
    }

    if (!finalExam.isPublished) {
      return new NextResponse("Final exam not available", { status: 403 });
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = finalExam.questions.length;

    for (const question of finalExam.questions) {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= finalExam.passingScore;

    // Determine grade based on score
    let grade = "F";
    if (score >= 97) grade = "A+";
    else if (score >= 93) grade = "A";
    else if (score >= 90) grade = "A-";
    else if (score >= 87) grade = "B+";
    else if (score >= 83) grade = "B";
    else if (score >= 80) grade = "B-";
    else if (score >= 77) grade = "C+";
    else if (score >= 73) grade = "C";
    else if (score >= 70) grade = "C-";
    else if (score >= 67) grade = "D+";
    else if (score >= 65) grade = "D";

    // Create attempt record
    const attempt = await db.finalExamAttempt.create({
      data: {
        userId: user.id!,
        finalExamId: finalExam.id,
        courseId: courseId,
        questions: JSON.stringify(finalExam.questions),
        userAnswers: JSON.stringify(answers),
        score,
        passed,
        grade,
        completedAt: new Date(),
      },
    });

    // If passed, mark course as completed with certificate
    if (passed) {
      // Check if all chapters are completed
      const publishedChapters = await db.chapter.findMany({
        where: {
          courseId: courseId,
          isPublished: true,
        },
        select: {
          id: true,
        },
      });

      const completedChapters = await db.userProgress.findMany({
        where: {
          userId: user.id!,
          chapterId: {
            in: publishedChapters.map((chapter) => chapter.id),
          },
          isCompleted: true,
        },
      });

      if (completedChapters.length === publishedChapters.length) {
        // Create or update course completion
        await db.courseCompletion.upsert({
          where: {
            userId_courseId: {
              userId: user.id!,
              courseId: courseId,
            },
          },
          update: {
            completedAt: new Date(),
            finalExamScore: score,
            certificateEarned: true,
          },
          create: {
            userId: user.id!,
            courseId: courseId,
            completedAt: new Date(),
            finalExamScore: score,
            certificateEarned: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        grade: attempt.grade,
        completedAt: attempt.completedAt,
      },
    });
  } catch (error) {
    console.log("[FINAL_EXAM_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
