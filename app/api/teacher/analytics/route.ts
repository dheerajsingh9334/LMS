import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get all teacher's courses
    const courses = await db.course.findMany({
      where: {
        userId: user.id,
      },
      include: {
        purchases: {
          where: {
            paymentStatus: "completed",
          },
        },
      },
    });

    // Calculate earnings
    const totalEarnings = courses.reduce((acc, course) => {
      const courseEarnings = course.purchases.reduce((sum, purchase) => {
        return sum + (purchase.amount || 0);
      }, 0);
      return acc + courseEarnings;
    }, 0);

    // Get sales count
    const totalSales = courses.reduce((acc, course) => {
      return acc + course.purchases.length;
    }, 0);

    // Course-wise breakdown
    const courseBreakdown = courses.map((course) => {
      const earnings = course.purchases.reduce((sum, purchase) => {
        return sum + (purchase.amount || 0);
      }, 0);

      return {
        courseId: course.id,
        title: course.title,
        sales: course.purchases.length,
        earnings,
        price: course.price || 0,
        isFree: course.isFree,
      };
    });

    // Recent purchases
    const recentPurchases = await db.purchase.findMany({
      where: {
        course: {
          userId: user.id,
        },
        paymentStatus: "completed",
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      totalEarnings,
      totalSales,
      courseBreakdown,
      recentPurchases,
    });
  } catch (error) {
    console.log("[TEACHER_ANALYTICS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
