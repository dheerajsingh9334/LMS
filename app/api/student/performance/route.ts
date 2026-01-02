import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get enrolled courses (purchased)
    const purchases = await db.purchase.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                userProgress: {
                  where: {
                    userId: user.id,
                  },
                },
                quizzes: true,
              },
            },
          },
        },
      },
    });

    // Get quiz attempts
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: user.id,
      },
      include: {
        quiz: {
          include: {
            chapter: {
              include: {
                course: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalCourses = purchases.length;
    let completedCourses = 0;
    let totalChapters = 0;
    let completedChapters = 0;
    let totalQuizzes = 0;
    let completedQuizzes = quizAttempts.length;
    let totalQuizScore = 0;

    purchases.forEach((purchase) => {
      const course = purchase.course;
      const chapters = course.chapters;

      totalChapters += chapters.length;

      let courseCompleted = true;
      chapters.forEach((chapter) => {
        totalQuizzes += chapter.quizzes.length;

        if (chapter.userProgress.length > 0 && chapter.userProgress[0].isCompleted) {
          completedChapters++;
        } else {
          courseCompleted = false;
        }
      });

      if (courseCompleted && chapters.length > 0) {
        completedCourses++;
      }
    });

    // Calculate average quiz score
    quizAttempts.forEach((attempt) => {
      totalQuizScore += attempt.score;
    });

    const averageQuizScore =
      completedQuizzes > 0 ? Math.round(totalQuizScore / completedQuizzes) : 0;

    // Course progress breakdown
    const courseProgress = purchases.map((purchase) => {
      const course = purchase.course;
      const totalChapters = course.chapters.length;
      const completed = course.chapters.filter(
        (chapter) =>
          chapter.userProgress.length > 0 && chapter.userProgress[0].isCompleted
      ).length;

      const progress = totalChapters > 0 ? (completed / totalChapters) * 100 : 0;

      return {
        courseId: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        totalChapters,
        completedChapters: completed,
        progress: Math.round(progress),
      };
    });

    // Recent activity (quiz attempts)
    const recentActivity = quizAttempts.slice(0, 10).map((attempt) => ({
      quizTitle: attempt.quiz.title,
      courseTitle: attempt.quiz.chapter.course.title,
      score: attempt.score,
      createdAt: attempt.createdAt,
    }));

    return NextResponse.json({
      statistics: {
        totalCourses,
        completedCourses,
        totalChapters,
        completedChapters,
        totalQuizzes,
        completedQuizzes,
        averageQuizScore,
      },
      courseProgress,
      recentActivity,
    });
  } catch (error) {
    console.log("[STUDENT_PERFORMANCE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
