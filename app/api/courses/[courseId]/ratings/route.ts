import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    // Optimized: Only select rating field for calculation
    const ratings = await db.courseRating.findMany({
      where: {
        courseId: params.courseId,
      },
      select: {
        rating: true,
      },
    });

    // Calculate average rating
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    // Get user's rating if logged in
    let userRating = null;
    if (user?.id) {
      userRating = await db.courseRating.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: params.courseId,
          },
        },
      });
    }

    return NextResponse.json({
      averageRating,
      totalRatings,
      userRating,
    });
  } catch (error) {
    console.log("[COURSE_RATINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const { rating, review } = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return new NextResponse("Invalid rating. Must be between 1 and 5", { status: 400 });
    }

    // Check if user has purchased the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (!purchase) {
      return new NextResponse("You must purchase the course to rate it", { status: 403 });
    }

    // Create or update rating
    const courseRating = await db.courseRating.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
      update: {
        rating,
        review,
      },
      create: {
        userId: user.id,
        courseId: params.courseId,
        rating,
        review,
      },
    });

    return NextResponse.json(courseRating);
  } catch (error) {
    console.log("[COURSE_RATINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
