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

    // Get recent reviews for teacher's courses
    const recentReviews = await db.courseRating.findMany({
      where: {
        course: {
          userId,
        },
        review: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
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

    const formattedReviews = recentReviews.map((review) => ({
      id: review.id,
      studentName: review.user.name || "Anonymous",
      courseTitle: review.course.title,
      rating: review.rating,
      review: review.review || "",
      date: new Date(review.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json({
      recentReviews: formattedReviews,
    });
  } catch (error) {
    console.log("[REVIEWS_ANALYTICS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}