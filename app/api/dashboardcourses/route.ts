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

type DashboardCourses = {
  completedCourses: CourseWithProgress[];
  coursesInProgress: CourseWithProgress[];
  additionalCourses: CourseWithProgress[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  try {
    // Fetch purchased course IDs for the user
    const purchasedCourses = await db.purchase.findMany({
      where: {
        userId: userId,
      },
      select: {
        courseId: true,
      },
    });

    // Extract courseIds from purchasedCourses
    const purchasedCourseIds = purchasedCourses.map((purchase) => purchase.courseId);

    // Fetch courses that the user has purchased
    const allCourses = await db.course.findMany({
      where: {
        id: {
          in: purchasedCourseIds,
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
        const {progressPercentage} = await getProgress(userId, course.id);
        return {
          ...course,
          progress: progressPercentage,
        } as CourseWithProgress;
      })
    );

    // Filter completed and in-progress courses based on progress
    const completedCourses = coursesWithProgress.filter((course) => course.progress === 100);
    const coursesInProgress = coursesWithProgress.filter((course) => (course.progress ?? 0) < 100);

    
    const totalCourses = completedCourses.length + coursesInProgress.length;

    // Fetch additional courses if needed to reach at least 6 courses
    let additionalCourses: CourseWithProgress[] = [];
    if (totalCourses < 6) {
      const extraCoursesNeeded = 6 - totalCourses;
      const additionalCourseEntities = await db.course.findMany({
        where: {
          id: {
            notIn: purchasedCourseIds,
          },
          isPublished: true,
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
        take: extraCoursesNeeded,
      });

      additionalCourses = additionalCourseEntities.map((course) => {
        return {
          ...course,
          progress: null,
        } as CourseWithProgress;
      });
    }

    const dashboardCourses: DashboardCourses = {
      completedCourses,
      coursesInProgress,
      additionalCourses,
    };

    return NextResponse.json(dashboardCourses, { status: 200 });
  } catch (error) {
    console.error("[GET_DASHBOARD_COURSES]", error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard courses',
      completedCourses: [],
      coursesInProgress: [],
      additionalCourses: [],
    }, { status: 500 });
  }
}
