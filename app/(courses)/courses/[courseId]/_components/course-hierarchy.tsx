"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Play, CheckCircle2, Lock, Video, FileText, ClipboardList, Award, GraduationCap } from "lucide-react";
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
      duration?: number;
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
  finalExam?: {
    id: string;
    title: string;
    isCompleted: boolean;
    isLocked: boolean;
    lockReason?: string;
  };
  certificate?: {
    isAvailable: boolean;
    isEarned: boolean;
  };
}

interface CourseHierarchyProps {
  courseId: string;
  currentChapterId?: string;
  content: CourseContent;
  isPurchased: boolean;
  isInstructor: boolean;
}

export const CourseHierarchy = ({
  courseId,
  currentChapterId,
  content,
  isPurchased,
  isInstructor
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
    const totalItems = 1 + chapter.videos.length + chapter.quizzes.length + chapter.assignments.length; // +1 for main chapter content
    const completedItems = 
      (chapter.isCompleted ? 1 : 0) +
      chapter.videos.filter((v: any) => v.isCompleted).length +
      chapter.quizzes.filter((q: any) => q.isCompleted).length +
      chapter.assignments.filter((a: any) => a.isCompleted).length;
    
    return Math.round((completedItems / totalItems) * 100);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Course Content</h3>
        <p className="text-sm text-gray-600">
          {content.chapters.length} chapters • Track your progress
        </p>
      </div>

      <div className="divide-y">
        {content.chapters.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter.id);
          const isCurrent = currentChapterId === chapter.id;
          const progress = getChapterProgress(chapter);
          const hasContent = chapter.videos.length > 0 || chapter.quizzes.length > 0 || chapter.assignments.length > 0;

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
                    {chapter.isLocked && !isPurchased && !isInstructor ? (
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
                        isCurrent && "text-blue-600",
                        chapter.isLocked && !isPurchased && !isInstructor && "text-gray-400 cursor-not-allowed pointer-events-none"
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
              {isExpanded && hasContent && (isPurchased || isInstructor) && !chapter.isLocked && (
                <div className="pb-4 pl-8 pr-4 space-y-1">
                  {/* Videos - Show with tree structure */}
                  {chapter.videos.map((video, index) => (
                    <div key={video.id} className="flex items-center gap-2 py-1.5 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">├─</span>
                        <Video className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="flex-1 text-gray-700">{video.title}</span>
                      <div className="flex items-center gap-1">
                        {video.duration && (
                          <span className="text-xs text-gray-500">{formatDuration(video.duration)}</span>
                        )}
                        {video.isCompleted && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Quizzes - Show with tree structure */}
                  {chapter.quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center gap-2 py-1.5 text-sm">
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
                  {chapter.assignments.map((assignment, index, array) => {
                    const isLast = index === array.length - 1 && chapter.quizzes.length === 0;
                    return (
                      <div key={assignment.id} className="flex items-center gap-2 py-1.5 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">
                            {isLast ? "└─" : "├─"}
                          </span>
                          <FileText className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                        <Link
                          href={`/courses/${courseId}/chapters/${chapter.id}/assignment/${assignment.id}`}
                          className="flex-1 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          {assignment.title}
                        </Link>
                        {assignment.isCompleted && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Final Exam Section */}
        {content.finalExam && (isPurchased || isInstructor) && (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {content.finalExam.isLocked ? (
                  <Lock className="h-4 w-4 text-gray-400" />
                ) : content.finalExam.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                )}
              </div>
              
              <div className="flex-1">
                {content.finalExam.isLocked ? (
                  <span 
                    className="font-medium text-gray-400 cursor-not-allowed"
                    title={content.finalExam.lockReason}
                  >
                    Final Exam
                  </span>
                ) : (
                  <Link
                    href={`/courses/${courseId}/final-exam`}
                    className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                  >
                    Final Exam
                  </Link>
                )}
              </div>
              
              {content.finalExam.isCompleted && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Passed
                </Badge>
              )}
            </div>
            
            {content.finalExam.isLocked && content.finalExam.lockReason && (
              <p className="text-xs text-gray-500 mt-1 ml-9">
                {content.finalExam.lockReason}
              </p>
            )}
          </div>
        )}

        {/* Certificate Section */}
        {content.certificate && (isPurchased || isInstructor) && (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {!content.certificate.isAvailable ? (
                  <Lock className="h-4 w-4 text-gray-400" />
                ) : content.certificate.isEarned ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Award className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              
              <div className="flex-1">
                {content.certificate.isAvailable ? (
                  <Link
                    href={`/courses/${courseId}/certificate`}
                    className="font-medium text-gray-900 hover:text-yellow-600 transition-colors"
                  >
                    Certificate of Completion
                  </Link>
                ) : (
                  <span className="font-medium text-gray-400 cursor-not-allowed">
                    Certificate of Completion
                  </span>
                )}
              </div>
              
              {content.certificate.isEarned && (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                  Earned
                </Badge>
              )}
            </div>
            
            {!content.certificate.isAvailable && (
              <p className="text-xs text-gray-500 mt-1 ml-9">
                Complete all chapters and pass the final exam to earn your certificate
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};