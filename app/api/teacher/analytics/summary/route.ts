import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get teacher's courses
    const courses = await db.course.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        isPublished: true,
        createdAt: true,
        purchases: {
          select: {
            amount: true,
            userId: true,
            createdAt: true,
            paymentStatus: true,
          },
        },
        ratings: {
          select: {
            rating: true,
            review: true,
            createdAt: true,
          },
        },
        chapters: {
          select: {
            id: true,
            userProgress: {
              select: {
                isCompleted: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    // Calculate total earnings
    const totalEarnings = courses.reduce((total: number, course) => {
      const courseEarnings = course.purchases
        .filter((purchase: any) => purchase.paymentStatus === "completed")
        .reduce((sum: number, purchase: any) => sum + (purchase.amount || 0), 0);
      return total + courseEarnings;
    }, 0);

    // Calculate monthly earnings (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const monthlyEarnings = courses.reduce((total: number, course) => {
      const monthlyPurchases = course.purchases.filter(
        (purchase: any) => 
          purchase.paymentStatus === "completed" && 
          new Date(purchase.createdAt) >= currentMonth
      );
      const monthlySum = monthlyPurchases.reduce((sum: number, purchase: any) => sum + (purchase.amount || 0), 0);
      return total + monthlySum;
    }, 0);

    // Calculate average rating
    const allRatings = courses.flatMap(course => course.ratings);
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating.rating, 0) / allRatings.length 
      : 0;

    // Total reviews count
    const totalReviews = allRatings.filter(rating => rating.review && rating.review.trim()).length;

    // Total enrollments
    const totalEnrollments = courses.reduce((total: number, course) => {
      return total + course.purchases.filter((p: any) => p.paymentStatus === "completed").length;
    }, 0);

    // Monthly enrollments
    const monthlyEnrollments = courses.reduce((total: number, course) => {
      const monthlyPurchases = course.purchases.filter(
        (purchase: any) => 
          purchase.paymentStatus === "completed" && 
          new Date(purchase.createdAt) >= currentMonth
      );
      return total + monthlyPurchases.length;
    }, 0);

    // Calculate completion rate
    const allEnrolledUsers = new Set(
      courses.flatMap(course => 
        course.purchases
          .filter((p: any) => p.paymentStatus === "completed")
          .map((p: any) => ({ courseId: course.id, userId: p.userId || "" }))
      )
    );

    const completedCourses = courses.reduce((completed: number, course) => {
      const totalChapters = course.chapters.length;
      if (totalChapters === 0) return completed;

      const completedUsersForCourse = course.chapters.every((chapter: any) => 
        chapter.userProgress.some((progress: any) => progress.isCompleted)
      );

      // Count users who completed all chapters
      const userCompletions = new Set();
      course.chapters.forEach((chapter: any) => {
        chapter.userProgress.forEach((progress: any) => {
          if (progress.isCompleted) {
            userCompletions.add(progress.userId);
          }
        });
      });

      return completed + userCompletions.size;
    }, 0);

    const completionRate = allEnrolledUsers.size > 0 
      ? Math.round((completedCourses / allEnrolledUsers.size) * 100) 
      : 0;

    // Course stats
    const totalCourses = courses.length;
    const activeCourses = courses.filter(course => course.isPublished).length;

    // Mock data for views and time spent (you can implement actual tracking)
    const totalViews = courses.reduce((total: number, course) => {
      return total + course.purchases.length * 15; // Approximate views
    }, 0);

    const avgTimeSpent = "45 min"; // Mock data - implement actual tracking

    return NextResponse.json({
      totalEarnings,
      monthlyEarnings,
      averageRating,
      totalReviews,
      totalEnrollments,
      monthlyEnrollments,
      completionRate,
      totalCourses,
      activeCourses,
      totalViews,
      avgTimeSpent,
    });
  } catch (error) {
    console.log("[ANALYTICS_SUMMARY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}