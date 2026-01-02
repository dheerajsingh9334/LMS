"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Video,
  ClipboardList,
  FileText,
  CheckCircle,
  Lock,
  GraduationCap,
  Award,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CollapsibleSidebarProps {
  chapters: any[];
  courseId: string;
  purchased: boolean;
  isInstructor: boolean;
  chapterAccessibility: any[];
  quizzes: any[];
  assignments: any[];
  finalExam?: any;
  finalExamCompleted: boolean;
  finalExamScore?: number | null;
  certificateTemplate?: any;
  hasCertificate: boolean;
  canAccessCertificate: boolean;
}

export const CollapsibleSidebar = ({
  chapters,
  courseId,
  purchased,
  isInstructor,
  chapterAccessibility,
  quizzes,
  assignments,
  finalExam,
  finalExamCompleted,
  finalExamScore,
  certificateTemplate,
  hasCertificate,
  canAccessCertificate,
}: CollapsibleSidebarProps) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set() // Start with all chapters collapsed to avoid hydration issues
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

  return (
    <div className="flex flex-col w-full">
      {chapters.map((chapter, index) => {
        const accessibility = chapterAccessibility.find(
          (ch) => ch.id === chapter.id
        );
        const chapterQuizzes = quizzes.filter(
          (quiz) => quiz.chapter.id === chapter.id
        );
        const chapterAssignments = assignments.filter(
          (assignment) => assignment.chapterId === chapter.id
        );
        const isChapterAccessible = accessibility?.isAccessible || false;
        const isExpanded = expandedChapters.has(chapter.id);
        const hasContent =
          chapter.chapterVideos?.length > 0 ||
          chapterQuizzes.length > 0 ||
          chapterAssignments.length > 0;

        // Calculate progress: only chapter completion and quizzes count, assignments are ignored.
        const totalItems = 1 + chapterQuizzes.length; // +1 for chapter itself
        let completedItems = chapter.userProgress?.[0]?.isCompleted ? 1 : 0;
        completedItems += chapterQuizzes.filter(
          (q) => q.quizAttempts.length > 0
        ).length;

        const progressPercentage =
          totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return (
          <div key={chapter.id} className="border-b border-gray-100">
            {/* Chapter Header */}
            <div className="flex items-center p-3">
              {/* Toggle Button */}
              {hasContent &&
                (purchased || isInstructor) &&
                isChapterAccessible && (
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="mr-2 p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}

              {/* Chapter Status Icon */}
              <div className="mr-2">
                {!isChapterAccessible ? (
                  <Lock className="w-4 h-4 text-gray-400" />
                ) : chapter.userProgress?.[0]?.isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <PlayCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>

              {/* Chapter Title */}
              <Link
                href={`/courses/${courseId}/chapters/${chapter.id}`}
                className={cn(
                  "flex-1 text-sm font-medium hover:text-blue-600 transition-colors",
                  !isChapterAccessible &&
                    "text-gray-400 cursor-not-allowed pointer-events-none"
                )}
              >
                {index + 1}. {chapter.title}
              </Link>

              {/* Progress Badge */}
              {progressPercentage > 0 && totalItems > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {progressPercentage}%
                </span>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded &&
              (purchased || isInstructor) &&
              isChapterAccessible && (
                <div className="pl-6 pb-2 space-y-1">
                  {/* Videos */}
                  {chapter.chapterVideos?.map(
                    (video: any, videoIndex: number) => (
                      <div
                        key={video.id}
                        className="flex items-center py-1.5 text-sm"
                      >
                        <span className="text-gray-400 text-xs mr-2">├─</span>
                        <Video className="w-3.5 h-3.5 text-blue-500 mr-2" />
                        <button
                          onClick={() => {
                            window.location.href = `/courses/${courseId}/chapters/${chapter.id}`;
                          }}
                          className="flex-1 text-left text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          {video.title}
                        </button>
                        {video.duration && (
                          <span className="text-xs text-gray-500 mr-2">
                            {Math.round(video.duration / 60)}m
                          </span>
                        )}
                      </div>
                    )
                  )}

                  {/* Quizzes */}
                  {chapterQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center py-1.5 text-sm"
                    >
                      <span className="text-gray-400 text-xs mr-2">├─</span>
                      <ClipboardList className="w-3.5 h-3.5 text-purple-500 mr-2" />
                      <Link
                        href={`/courses/${courseId}/chapters/${chapter.id}/quiz/${quiz.id}`}
                        className="flex-1 text-gray-700 hover:text-purple-600 transition-colors"
                      >
                        {quiz.title}
                      </Link>
                      {quiz.quizAttempts.length > 0 && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                  ))}

                  {/* Assignments */}
                  {chapterAssignments.map((assignment, assignIndex) => {
                    const submission = assignment.submissions[0];
                    const isSubmitted = !!submission;
                    const isGraded = submission?.status === "graded";
                    const isLast =
                      assignIndex === chapterAssignments.length - 1 &&
                      chapterQuizzes.length === 0;

                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center py-1.5 text-sm"
                      >
                        <span className="text-gray-400 text-xs mr-2">
                          {isLast ? "└─" : "├─"}
                        </span>
                        <FileText className="w-3.5 h-3.5 text-orange-500 mr-2" />
                        <Link
                          href={`/courses/${courseId}/assignments/${assignment.id}`}
                          className="flex-1 text-gray-700 hover:text-orange-600 transition-colors"
                        >
                          {assignment.title}
                          {!assignment.isPublished &&
                            isInstructor &&
                            " (Draft)"}
                        </Link>
                        {isGraded && (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        )}
                        {isSubmitted && !isGraded && (
                          <span className="text-xs text-blue-500 bg-blue-100 px-1 py-0.5 rounded">
                            Submitted
                          </span>
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
      {finalExam && (purchased || isInstructor) && (
        <div className="border-b border-gray-100">
          <div className="flex items-center p-3">
            <div className="mr-2">
              {finalExamCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <GraduationCap className="w-4 h-4 text-indigo-500" />
              )}
            </div>
            <Link
              href={`/courses/${courseId}/final-exam`}
              className="flex-1 text-sm font-medium hover:text-indigo-600 transition-colors"
            >
              🎓 Final Exam
            </Link>
            <div className="flex items-center gap-1">
              {finalExamCompleted && finalExamScore !== null && (
                <span className="text-xs text-gray-600 mr-1">
                  {finalExamScore}%
                </span>
              )}
              {finalExamCompleted ? (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Passed
                </span>
              ) : finalExam.questions?.length > 0 ? (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {finalExam.questions.length} Questions
                </span>
              ) : null}
            </div>
          </div>
          {finalExam && !finalExamCompleted && (
            <div className="px-3 pb-3">
              <p className="text-xs text-gray-500">
                {finalExam.description ||
                  `Complete all chapters to unlock the final exam (${finalExam.passingScore}% required to pass)`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Certificate Section - Always show for purchased/instructor users */}
      {(purchased || isInstructor) && (
        <div className="border-b border-gray-100">
          <div className="flex items-center p-3">
            <div className="mr-2">
              {hasCertificate ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : canAccessCertificate && certificateTemplate ? (
                <Award className="w-4 h-4 text-yellow-500" />
              ) : !certificateTemplate ? (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {canAccessCertificate && certificateTemplate ? (
              <Link
                href={`/courses/${courseId}/certificate`}
                className="flex-1 text-sm font-medium hover:text-yellow-600 transition-colors"
              >
                🏆 Certificate of Completion
              </Link>
            ) : (
              <span className="flex-1 text-sm font-medium text-gray-400 cursor-not-allowed">
                🏆 Certificate of Completion
                {!certificateTemplate && " (Not Set Up)"}
              </span>
            )}
            {hasCertificate && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Earned
              </span>
            )}
            {!certificateTemplate && isInstructor && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Setup Required
              </span>
            )}
          </div>
          <div className="px-3 pb-3">
            {!certificateTemplate ? (
              <p className="text-xs text-orange-500">
                {isInstructor
                  ? "Set up a certificate template in course settings to enable certificates"
                  : "Certificate not available - instructor needs to set up certificate template"}
              </p>
            ) : !canAccessCertificate ? (
              <p className="text-xs text-gray-500">
                Complete all chapters and pass the final exam to earn your
                certificate
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
