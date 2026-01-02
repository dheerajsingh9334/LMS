"use client";

import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { UniversalNotes } from "@/components/notes/universal-notes";

const CourseNotesPage = ({ params }: { params: { courseId: string } }) => {
  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Personal notes for this course
          </p>
        </div>

        <UniversalNotes
          courseId={params.courseId}
          context="GENERAL"
          className="mt-2"
        />
      </div>
    </>
  );
};

export default CourseNotesPage;
