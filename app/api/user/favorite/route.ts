import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Course, Category, Chapter } from "@prisma/client";
import { getProgress } from '@/actions/Courses/get-progress';

type CourseWithProgress = Course & {
  category: Category | null;
  chapters: Chapter[];
  progress: number | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
    headline: string | null;
  } | null;
  ratings?: {
    rating: number;
  }[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  try {
    // Fetch favorite course IDs for the user
    const favoriteCourses = await db.favoriteCourse.findMany({
      where: {
        userId: userId,
      },
      select: {
        courseId: true,
      },
    });

    // Extract courseIds from favoriteCourses
    const favoriteCourseIds = favoriteCourses.map((favorite) => favorite.courseId);

    // Fetch courses that the user has favorited
    const allCourses = await db.course.findMany({
      where: {
        id: {
          in: favoriteCourseIds,
        },
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
        },
        // Include teacher/instructor info
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          }
        },
        // Include course ratings
        ratings: {
          select: {
            rating: true,
          }
        }
      },
    });

    // Prepare CourseWithProgress objects with progress information
    const coursesWithProgress: CourseWithProgress[] = await Promise.all(
        allCourses.map(async (course) => {
          const { progressPercentage } = await getProgress(userId, course.id);
          return {
            ...course,
            progress: progressPercentage,
          } as CourseWithProgress;
        })
      );

    return NextResponse.json({ favoriteCourses: coursesWithProgress }, { status: 200 });
  } catch (error) {
    console.error("[GET_FAVORITE_COURSES]", error);
    return NextResponse.json({
      error: 'Failed to fetch favorite courses',
      favoriteCourses: [],
    }, { status: 500 });
  }
}
