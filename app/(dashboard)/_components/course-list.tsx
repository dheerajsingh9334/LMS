"use client";

import { CourseCard } from "@/components/course-card";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CourseWithProgressWithCategory } from "@/types/course";

interface CoursesListProps {
  items: CourseWithProgressWithCategory[];
}

export const CoursesList = ({ items }: CoursesListProps) => {
  const path = usePathname();
  const isCollectionPage = path.includes("collection");
  const isInstructorPage = path.includes("instructors");
  return (
    <>
      <div
        className={cn(
          "grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 ",
          isCollectionPage ||
            (isInstructorPage && "md:grid-cols-3 lg:grid-cols-4")
        )}
      >
        {items.map((item) => {
          // Calculate average rating
          const averageRating =
            item.ratings && item.ratings.length > 0
              ? item.ratings.reduce((sum, r) => sum + r.rating, 0) /
                item.ratings.length
              : 0;

          return (
            <CourseCard
              key={item.id}
              id={item.id}
              title={item.title}
              imageUrl={item.imageUrl!}
              chaptersLength={item.chapters.length}
              progress={item.progress}
              category={item?.category?.name!}
              teacherId={item.user?.id || undefined}
              teacherName={item.user?.name || undefined}
              teacherImage={item.user?.image || undefined}
              averageRating={averageRating}
              totalRatings={item.ratings?.length || 0}
            />
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          No courses found
        </div>
      )}
    </>
  );
};
