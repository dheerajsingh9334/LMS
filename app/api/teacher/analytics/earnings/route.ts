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

    // Get earnings data for the last 12 months
    const courses = await db.course.findMany({
      where: {
        userId,
      },
      include: {
        purchases: {
          where: {
            paymentStatus: "completed",
          },
          select: {
            amount: true,
            createdAt: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate monthly earnings for the last 12 months
    const now = new Date();
    const monthlyEarnings = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthEarnings = courses.reduce((total, course) => {
        const monthPurchases = course.purchases.filter(
          purchase => 
            new Date(purchase.createdAt) >= date && 
            new Date(purchase.createdAt) < nextMonth
        );
        return total + monthPurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
      }, 0);

      monthlyEarnings.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        earnings: monthEarnings,
      });
    }

    // Get top performing courses
    const topCourses = courses
      .map(course => {
        const totalEarnings = course.purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
        const avgRating = course.ratings.length > 0 
          ? course.ratings.reduce((sum, rating) => sum + rating.rating, 0) / course.ratings.length 
          : 0;
        
        return {
          id: course.id,
          title: course.title,
          enrollments: course.purchases.length,
          earnings: totalEarnings,
          rating: avgRating.toFixed(1),
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return NextResponse.json({
      monthlyEarnings,
      topCourses,
    });
  } catch (error) {
    console.log("[EARNINGS_ANALYTICS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}