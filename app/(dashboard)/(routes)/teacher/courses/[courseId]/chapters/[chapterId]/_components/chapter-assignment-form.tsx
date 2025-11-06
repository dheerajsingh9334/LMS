"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chapter, Assignment } from "@prisma/client";
import { PlusCircle, FileText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ChapterAssignmentFormProps {
  initialData: Chapter & { 
    assignments: (Assignment & {
      _count: {
        submissions: number;
      };
    })[] 
  };
  courseId: string;
  chapterId: string;
}

export const ChapterAssignmentForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterAssignmentFormProps) => {
  const router = useRouter();

  const handleCreateAssignment = () => {
    // Navigate to the create assignment page with chapter pre-selected
    router.push(`/teacher/courses/${courseId}/assignments/new?chapterId=${chapterId}`);
  };

  const handleEditAssignment = (assignmentId: string) => {
    router.push(`/teacher/courses/${courseId}/assignments/${assignmentId}`);
  };

  return (
    <div className="relative mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Chapter assignments
        <Button onClick={handleCreateAssignment} variant="ghost">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add an assignment
        </Button>
      </div>

      <div
        className={cn(
          "text-sm mt-2",
          (!initialData.assignments || initialData.assignments.length === 0) &&
            "text-slate-500 italic"
        )}
      >
        {!initialData.assignments || initialData.assignments.length === 0 ? (
          "No assignments"
        ) : (
          <div className="space-y-2 mt-4">
            {initialData.assignments.map((assignment) => {
              const isPastDue = new Date() > new Date(assignment.dueDate);
              
              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between gap-x-2 bg-white border rounded-md p-3 hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => handleEditAssignment(assignment.id)}
                >
                  <div className="flex items-center gap-x-2 flex-1">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {assignment.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(assignment.dueDate), "PPp")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {assignment.isPublished ? (
                      <Badge className="bg-green-500">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    {isPastDue && assignment.isPublished && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {assignment._count.submissions} submission{assignment._count.submissions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Assignments are optional and won&apos;t affect chapter completion
      </p>
    </div>
  );
};
