import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole, UserType } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalCourses,
      activeCourses,
      totalPurchases,
      completedPurchases,
      courseCompletions,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { userType: UserType.TEACHER } }),
      db.user.count({ where: { userType: UserType.STUDENT } }),
      db.course.count(),
      db.course.count({ where: { isPublished: true } }),
      db.purchase.count(),
      db.purchase.count({ where: { paymentStatus: "completed" } }),
      db.courseCompletion.count(),
    ]);

    const revenueAgg = await db.purchase.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: "completed" },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueAgg = await db.purchase.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: "completed",
        createdAt: { gte: startOfMonth },
      },
    });

    const totalRevenue = revenueAgg._sum.amount || 0;
    const monthlyRevenue = monthlyRevenueAgg._sum.amount || 0;

    const completionRate =
      completedPurchases > 0
        ? Math.round((courseCompletions / completedPurchases) * 100)
        : 0;

    // Fetch courses with instructor for per-course and per-teacher revenue
    const revenueCourses = await db.course.findMany({
      select: {
        id: true,
        title: true,
        isPublished: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchases: {
          select: {
            amount: true,
            paymentStatus: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    const courseEarnings = revenueCourses.map((course) => {
      const completed = course.purchases.filter(
        (p) => p.paymentStatus === "completed"
      );
      const enrollments = completed.length;
      const revenue = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
      const avgRating =
        course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) /
            course.ratings.length
          : 0;

      return {
        id: course.id,
        title: course.title,
        isPublished: course.isPublished,
        instructorId: course.user?.id || null,
        instructorName: course.user?.name || course.user?.email || "Unknown",
        enrollments,
        revenue,
        avgRating,
      };
    });

    // Top 5 courses by selected metric (default enrollments)
    const topCourses = [...courseEarnings]
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    // Aggregate revenue per teacher
    const teacherMap: Record<
      string,
      {
        teacherId: string;
        teacherName: string;
        revenue: number;
        enrollments: number;
      }
    > = {};

    for (const c of courseEarnings) {
      if (!c.instructorId) continue;
      if (!teacherMap[c.instructorId]) {
        teacherMap[c.instructorId] = {
          teacherId: c.instructorId,
          teacherName: c.instructorName,
          revenue: 0,
          enrollments: 0,
        };
      }
      teacherMap[c.instructorId].revenue += c.revenue;
      teacherMap[c.instructorId].enrollments += c.enrollments;
    }

    const teacherEarnings = Object.values(teacherMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    return NextResponse.json({
      totalUsers,
      totalTeachers,
      totalStudents,
      totalCourses,
      activeCourses,
      totalPurchases,
      totalEnrollments: completedPurchases,
      totalRevenue,
      monthlyRevenue,
      completionRate,
      topCourses,
      courseEarnings,
      teacherEarnings,
    });
  } catch (error) {
    console.log("[ADMIN_ANALYTICS_SUMMARY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
