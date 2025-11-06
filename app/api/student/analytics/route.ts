import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all purchased courses
    const purchases = await db.purchase.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                userProgress: {
                  where: {
                    userId,
                  },
                },
              },
            },
            category: true,
          },
        },
      },
    });

    // Get quiz attempts
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId,
      },
      include: {
        quiz: {
          include: {
            questions: true,
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get certificates
    const certificates = await db.certificate.findMany({
      where: {
        userId,
      },
    });

    // Calculate overview stats
    const totalCourses = purchases.length;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalProgress = 0;
    let totalWatchTime = 0;

    const courseProgress = purchases.map((purchase) => {
      const course = purchase.course;
      const totalChapters = course.chapters.length;
      const completedChapters = course.chapters.filter(
        (chapter) => chapter.userProgress.length > 0 && chapter.userProgress[0].isCompleted
      ).length;
      const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

      totalProgress += progress;

      if (progress === 100) {
        completedCourses++;
      } else if (progress > 0) {
        inProgressCourses++;
      }

      return {
        courseTitle: course.title,
        progress: Math.round(progress),
        chaptersCompleted: completedChapters,
        totalChapters,
      };
    });

    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

    // Quiz performance
    const quizPerformance = quizAttempts.slice(0, 10).map((attempt) => {
      const maxScore = attempt.quiz?.questions?.length || 100; // 1 point per question
      return {
        quizTitle: attempt.quiz?.chapter?.title || "Quiz",
        score: attempt.score,
        maxScore: maxScore,
        percentage: Math.round((attempt.score / maxScore) * 100),
        attempts: 1,
      };
    });

    // Weekly activity (last 7 days)
    const today = new Date();
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        watchTime: Math.floor(Math.random() * 120), // Placeholder
        chaptersCompleted: Math.floor(Math.random() * 5), // Placeholder
      };
    });

    // Category distribution
    const categoryMap = new Map<string, number>();
    purchases.forEach((purchase) => {
      const categoryName = purchase.course.category?.name || "Uncategorized";
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    return NextResponse.json({
      overview: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalWatchTime,
        averageProgress,
        certificatesEarned: certificates.length,
      },
      courseProgress,
      quizPerformance,
      weeklyActivity,
      categoryDistribution,
    });
  } catch (error) {
    console.error("[STUDENT_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
