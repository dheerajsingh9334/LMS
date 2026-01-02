import { Chapter, Course, UserProgress } from "@prisma/client";

import { db } from "@/lib/db";
import { CourseProgress } from "@/components/course-progress";
import { CourseSidebarItem } from "./course-sidebar-item";
import { checkPurchase } from "@/actions/Courses/get-purchase";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { getEnhancedChapterAccessibility } from "@/lib/chapter-access";
import { EnhancedSidebarItem } from "./enhanced-sidebar-item";

type progressProps = {
  progressPercentage: number;
  totalChapters: number;
  completedChapters: number;
};

interface EnhancedCourseSidebarProps {
  course: Course & {
    chapters: (Chapter & {
      userProgress: UserProgress[] | null;
    })[];
  };
  progress: progressProps;
  showContent?: boolean; // Toggle to show quizzes and assignments
}

export const EnhancedCourseSidebar = async ({
  course,
  progress,
  showContent = true,
}: EnhancedCourseSidebarProps) => {
  const user = await currentUser();
  let userId = user?.id ?? "";
  const purchased = await checkPurchase(userId, course.id);
  const isInstructor = course.userId === userId;

  // Get enhanced chapter accessibility with quizzes and assignments
  const enhancedChapterData = await getEnhancedChapterAccessibility(
    userId,
    course.id,
    purchased,
    isInstructor
  );

  const completionText = `(${progress.completedChapters}/${progress.totalChapters})`;

  // Calculate total items and completed items for enhanced progress
  // Only chapters and quizzes count toward progress; assignments are ignored.
  const totalItems = enhancedChapterData.reduce(
    (total, chapter) => total + 1 + chapter.quizzes.length,
    0
  );

  const completedItems = enhancedChapterData.reduce((total, chapter) => {
    let chapterItems = chapter.isCompleted ? 1 : 0;
    chapterItems += chapter.quizzes.filter((q) => q.isCompleted).length;
    return total + chapterItems;
  }, 0);

  const enhancedProgress =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="h-full w-80 border-r flex flex-col overflow-y-auto shadow-sm">
      <div className="p-8">
        <Logo />
      </div>
      <div className="px-8 flex flex-col border-b">
        <h1 className="font-semibold ">{course.title}</h1>
        {(purchased || isInstructor) && (
          <div className="mt-4">
            {showContent ? (
              <>
                <p className="text-sm text-gray-600">
                  Overall Progress: {completedItems} of {totalItems} items
                </p>
                <div className="py-4">
                  <CourseProgress variant="success" value={enhancedProgress} />
                </div>
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                  <span>
                    Chapters:{" "}
                    {enhancedChapterData.filter((ch) => ch.isCompleted).length}/
                    {enhancedChapterData.length}
                  </span>
                  <span>
                    Quizzes:{" "}
                    {enhancedChapterData.reduce(
                      (acc, ch) =>
                        acc + ch.quizzes.filter((q) => q.isCompleted).length,
                      0
                    )}
                    /
                    {enhancedChapterData.reduce(
                      (acc, ch) => acc + ch.quizzes.length,
                      0
                    )}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p>Completed Chapters {completionText}</p>
                <div className="py-4">
                  <CourseProgress
                    variant="success"
                    value={progress.progressPercentage}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col w-full">
        {enhancedChapterData.map((chapter) => {
          return showContent && (purchased || isInstructor) ? (
            <EnhancedSidebarItem
              key={chapter.id}
              chapter={chapter}
              courseId={course.id}
            />
          ) : (
            <CourseSidebarItem
              key={chapter.id}
              id={chapter.id}
              label={chapter.title}
              isCompleted={chapter.isCompleted}
              courseId={course.id}
              isLocked={!chapter.isAccessible}
              position={chapter.position}
              lockReason={
                chapter.isAccessible
                  ? undefined
                  : "Complete previous chapter first"
              }
            />
          );
        })}
      </div>
    </div>
  );
};
