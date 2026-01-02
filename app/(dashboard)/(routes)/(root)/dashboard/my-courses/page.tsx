import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CoursesList } from "@/components/courses-list";

const MyCoursesPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  const purchases = await db.purchase.findMany({
    where: {
      userId: userId,
    },
    select: {
      course: {
        include: {
          category: true,
          chapters: {
            where: {
              isPublished: true,
            },
            select: {
              id: true,
            },
          },
          // Include teacher/instructor info
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              headline: true,
            },
          },
          // Include course ratings
          ratings: {
            select: {
              rating: true,
            },
          },
        },
      },
    },
  });

  const courses = purchases.map((purchase) => ({
    ...purchase.course,
    progress: null, // TODO: Calculate actual progress
  }));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text- text-slate-600 dark:text-slate-400">
          All courses you&apos;ve enrolled in
        </p>
      </div>
      <CoursesList items={courses} />
    </div>
  );
};

export default MyCoursesPage;
