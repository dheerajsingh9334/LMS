"use client";

import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const CourseNotesPage = ({
  params
}: {
  params: { courseId: string }
}) => {
  const [notes, setNotes] = useState<any[]>([]);

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Notes</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Personal notes for this course
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>

        {notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                No notes yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 text-center max-w-md">
                Take notes while learning to help remember important concepts. 
                Your notes are private and only visible to you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {/* Notes will be displayed here */}
          </div>
        )}
      </div>
    </>
  );
};

export default CourseNotesPage;
