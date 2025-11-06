import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get total students (purchases)
    const totalStudents = await db.purchase.count({
      where: {
        courseId: params.courseId,
      },
    });

    // Get total revenue
    const purchases = await db.purchase.findMany({
      where: {
        courseId: params.courseId,
        paymentStatus: "paid",
      },
      select: {
        amount: true,
      },
    });

    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get average rating
    const ratings = await db.courseRating.findMany({
      where: {
        courseId: params.courseId,
      },
      select: {
        rating: true,
      },
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Get completion rate
    const chapters = await db.chapter.findMany({
      where: {
        courseId: params.courseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    const totalChapters = chapters.length;

    if (totalStudents > 0 && totalChapters > 0) {
      const completedCourses = await db.userProgress.groupBy({
        by: ['userId'],
        where: {
          chapterId: {
            in: chapters.map(c => c.id),
          },
          isCompleted: true,
        },
        _count: {
          userId: true,
        },
        having: {
          userId: {
            _count: {
              gte: totalChapters,
            },
          },
        },
      });

      const completionRate = (completedCourses.length / totalStudents) * 100;

      // Get video analytics
      const videoAnalytics = await db.videoAnalytics.findMany({
        where: {
          courseId: params.courseId,
        },
        select: {
          watchTime: true,
          totalTime: true,
          progress: true,
          completedVideo: true,
          dropOffAt: true,
          device: true,
          createdAt: true,
        },
      });

      const totalWatchTime = videoAnalytics.reduce((sum, va) => sum + va.watchTime, 0);
      const averageProgress = videoAnalytics.length > 0
        ? videoAnalytics.reduce((sum, va) => sum + va.progress, 0) / videoAnalytics.length
        : 0;

      // Calculate drop-off points (group by chapter)
      const dropOffPoints: { [key: number]: number } = {};
      videoAnalytics.forEach(va => {
        if (va.dropOffAt) {
          const timeSlot = Math.floor(va.dropOffAt / 60); // Group by minute
          dropOffPoints[timeSlot] = (dropOffPoints[timeSlot] || 0) + 1;
        }
      });

      // Device statistics
      const deviceStats = videoAnalytics.reduce((acc, va) => {
        const device = va.device || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Get quiz analytics
      const quizzes = await db.quiz.findMany({
        where: {
          chapter: {
            courseId: params.courseId,
          },
        },
        select: {
          id: true,
        },
      });

      const quizAttempts = await db.quizAttempt.findMany({
        where: {
          quizId: {
            in: quizzes.map(q => q.id),
          },
        },
        select: {
          score: true,
        },
      });

      const totalQuizAttempts = quizAttempts.length;
      const averageQuizScore = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, qa) => sum + qa.score, 0) / quizAttempts.length
        : 0;
      const quizPassRate = quizAttempts.length > 0
        ? (quizAttempts.filter(qa => qa.score >= 70).length / quizAttempts.length) * 100
        : 0;

      // Get daily enrollments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyEnrollments = await db.purchase.groupBy({
        by: ['createdAt'],
        where: {
          courseId: params.courseId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      });

      // Format daily enrollments for chart
      const enrollmentsByDate = dailyEnrollments.map(de => ({
        date: de.createdAt.toISOString().split('T')[0],
        count: de._count.id,
      }));

      // Get daily revenue (last 30 days)
      const dailyRevenuePurchases = await db.purchase.findMany({
        where: {
          courseId: params.courseId,
          paymentStatus: "paid",
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      });

      const revenueByDate = dailyRevenuePurchases.reduce((acc, p) => {
        const date = p.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (p.amount || 0);
        return acc;
      }, {} as { [key: string]: number });

      const dailyRevenueData = Object.entries(revenueByDate).map(([date, amount]) => ({
        date,
        amount,
      }));

      // Get peak learning times
      const hourlyActivity = videoAnalytics.reduce((acc, va) => {
        const hour = new Date(va.createdAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as { [key: number]: number });

      return NextResponse.json({
        overview: {
          totalStudents,
          totalRevenue,
          averageRating: Number(averageRating.toFixed(2)),
          completionRate: Number(completionRate.toFixed(2)),
        },
        engagement: {
          totalWatchTime,
          averageProgress: Number(averageProgress.toFixed(2)),
          videoCompletionRate: videoAnalytics.length > 0
            ? (videoAnalytics.filter(va => va.completedVideo).length / videoAnalytics.length) * 100
            : 0,
        },
        dropOffPoints: Object.entries(dropOffPoints).map(([minute, count]) => ({
          minute: Number(minute),
          count,
        })),
        deviceStats,
        quizAnalytics: {
          totalAttempts: totalQuizAttempts,
          averageScore: Number(averageQuizScore.toFixed(2)),
          passRate: Number(quizPassRate.toFixed(2)),
        },
        dailyEnrollments: enrollmentsByDate,
        dailyRevenue: dailyRevenueData,
        peakLearningTimes: Object.entries(hourlyActivity).map(([hour, count]) => ({
          hour: Number(hour),
          count,
        })),
      });
    }

    // Return empty analytics if no students
    return NextResponse.json({
      overview: {
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
        completionRate: 0,
      },
      engagement: {
        totalWatchTime: 0,
        averageProgress: 0,
        videoCompletionRate: 0,
      },
      dropOffPoints: [],
      deviceStats: {},
      quizAnalytics: {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      },
      dailyEnrollments: [],
      dailyRevenue: [],
      peakLearningTimes: [],
    });
  } catch (error) {
    console.log("[ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
