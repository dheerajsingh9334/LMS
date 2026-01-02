"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Lock,
  Video,
  FileText,
  ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CourseContent {
  chapters: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    isLocked: boolean;
    position: number;
    videos: Array<{
      id: string;
      title: string;
      isCompleted: boolean;
    }>;
    quizzes: Array<{
      id: string;
      title: string;
      isCompleted: boolean;
    }>;
    assignments: Array<{
      id: string;
      title: string;
      isCompleted: boolean;
    }>;
  }>;
}

interface CourseHierarchyProps {
  courseId: string;
  currentChapterId?: string;
  content: CourseContent;
  isPurchased: boolean;
}

export const CourseHierarchy = ({
  courseId,
  currentChapterId,
  content,
  isPurchased,
}: CourseHierarchyProps) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(currentChapterId ? [currentChapterId] : [])
  );

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getChapterProgress = (chapter: any) => {
    const totalItems =
      1 +
      chapter.videos.length +
      chapter.quizzes.length +
      chapter.assignments.length; // +1 for main video
    const completedItems =
      (chapter.isCompleted ? 1 : 0) +
      chapter.videos.filter((v: any) => v.isCompleted).length +
      chapter.quizzes.filter((q: any) => q.isCompleted).length +
      chapter.assignments.filter((a: any) => a.isCompleted).length;

    return Math.round((completedItems / totalItems) * 100);
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Course Content</h3>
        <p className="text-sm text-gray-600">
          {content.chapters.length} chapters • Track your psrogress
        </p>
      </div>

      <div className="divide-y">
        {content.chapters.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter.id);
          const isCurrent = currentChapterId === chapter.id;
          const progress = getChapterProgress(chapter);
          const hasContent =
            chapter.videos.length > 0 ||
            chapter.quizzes.length > 0 ||
            chapter.assignments.length > 0;

          return (
            <div key={chapter.id} className={cn("", isCurrent && "bg-blue-50")}>
              {/* Chapter Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => toggleChapter(chapter.id)}
                    disabled={!hasContent}
                  >
                    {hasContent ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    {chapter.isLocked && !isPurchased ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : chapter.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Play className="h-4 w-4 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <Link
                      href={`/courses/${courseId}/chapters/${chapter.id}`}
                      className={cn(
                        "block font-medium hover:text-blue-600 transition-colors",
                        isCurrent && "text-blue-600"
                      )}
                    >
                      {chapter.position}. {chapter.title}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {progress > 0 && (
                    <Badge variant={progress === 100 ? "default" : "secondary"}>
                      {progress}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Chapter Content - File System Style */}
              {isExpanded && hasContent && (
                <div className="pb-4 pl-8 pr-4 space-y-1">
                  {/* Videos - Show with tree structure */}
                  {chapter.videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-2 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">├─</span>
                        <Video className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="flex-1 text-gray-700">
                        {video.title}
                      </span>
                      {video.isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  ))}

                  {/* Quizzes - Show with tree structure */}
                  {chapter.quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center gap-2 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">├─</span>
                        <ClipboardList className="h-3.5 w-3.5 text-purple-500" />
                      </div>
                      <Link
                        href={`/courses/${courseId}/chapters/${chapter.id}/quiz/${quiz.id}`}
                        className="flex-1 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {quiz.title}
                      </Link>
                      {quiz.isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  ))}

                  {/* Assignments - Show with tree structure */}
                  {chapter.assignments.map((assignment, index, array) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-2 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">
                          {index === array.length - 1 &&
                          chapter.quizzes.length === 0 &&
                          chapter.videos.length > 0
                            ? "└─"
                            : "├─"}
                        </span>
                        <FileText className="h-3.5 w-3.5 text-orange-500" />
                      </div>
                      <Link
                        href={`/courses/${courseId}/assignments/${assignment.id}`}
                        className="flex-1 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {assignment.title}
                      </Link>
                      {assignment.isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
