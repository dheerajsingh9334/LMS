import { db } from "@/lib/db";
import { getProgress } from "./get-progress";
import type { CourseWithProgressWithCategory } from "@/types/course";

type GetCourses = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId,
}: GetCourses): Promise<CourseWithProgressWithCategory[]> => {
  try {
    // Optimized: Only select necessary fields
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        ...(title && {
          OR: [
            {
              title: {
                contains: title,
                mode: "insensitive", // Case-insensitive search by title
              },
            },
            {
              tags: {
                hasSome: [title], // Search in tags array
              },
            },
          ],
        }),
        categoryId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        isPublished: true,
        isFree: true,
        learningOutcomes: true,
        tags: true,
        // Course Landing Page Fields
        prerequisites: true,
        courseObjectives: true,
        highlights: true,
        projectsIncluded: true,
        whoIsThisFor: true,
        faqs: true,
        promoVideoUrl: true,
        promoVideoType: true,
        finalExamQuestions: true,
        finalExamEnabled: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
        purchases: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
        // Teacher/Instructor info
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          },
        },
        // Course ratings
        ratings: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parallel processing for better performance
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        if (course.purchases.length === 0) {
          return {
            ...course,
            progress: null,
          };
        }

        const { progressPercentage } = await getProgress(userId, course.id);

        return {
          ...course,
          progress: progressPercentage,
        };
      })
    );

    return coursesWithProgress as CourseWithProgressWithCategory[];
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
};
