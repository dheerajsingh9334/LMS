"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, PlayCircle, HelpCircle, FileText, CheckCircle, Clock } from "lucide-react";
import { Chapter, Quiz, Assignment, ChapterVideo } from "@prisma/client";
import { CourseSidebarItem } from "./course-sidebar-item";
import { cn } from "@/lib/utils";

type ChapterWithProgress = Chapter & {
  userProgress: { isCompleted: boolean }[] | null;
  videos: ChapterVideo[];
  quizzes: (Quiz & {
    quizAttempts: any[];
  })[];
  assignments: (Assignment & {
    submissions: any[];
  })[];
};

interface CollapsibleChapterItemProps {
  chapter: ChapterWithProgress;
  courseId: string;
  position: number;
  isAccessible: boolean;
  lockReason?: string;
  purchased: boolean;
  isInstructor: boolean;
}

export const CollapsibleChapterItem = ({
  chapter,
  courseId,
  position,
  isAccessible,
  lockReason,
  purchased,
  isInstructor,
}: CollapsibleChapterItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isChapterCompleted = !!chapter.userProgress?.[0]?.isCompleted;
  const showSubItems = (purchased || isInstructor) && isAccessible;
  const hasSubItems = chapter.videos.length > 0 || chapter.quizzes.length > 0 || chapter.assignments.length > 0;
  
  const handleToggle = () => {
    if (hasSubItems && showSubItems) {
      setIsExpanded(!isExpanded);
    }
  };

  // Calculate chapter progress
  const totalItems = chapter.videos.length + chapter.quizzes.length + chapter.assignments.length;
  let completedItems = 0;
  
  // Count completed videos (we'll assume video is completed if chapter is completed)
  if (isChapterCompleted) {
    completedItems += chapter.videos.length;
  }
  
  // Count completed quizzes
  completedItems += chapter.quizzes.filter(quiz => quiz.quizAttempts.length > 0).length;
  
  // Count completed assignments
  completedItems += chapter.assignments.filter(assignment => {
    const submission = assignment.submissions[0];
    return submission?.status === "graded";
  }).length;

  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="w-full">
      {/* Chapter Header */}
      <div 
        className={cn(
          "flex items-center gap-x-2 text-slate-500 text-sm font-[500] pl-6 transition-all hover:text-slate-600 hover:bg-slate-300/20",
          isChapterCompleted && "text-emerald-700 hover:text-emerald-700",
          !isAccessible && "text-slate-400 cursor-not-allowed"
        )}
      >
        {/* Expandable Arrow */}
        {hasSubItems && showSubItems && (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-slate-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        
        {/* Chapter Number */}
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
          isChapterCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
        )}>
          {isChapterCompleted ? <CheckCircle className="w-4 h-4" /> : position}
        </div>
        
        {/* Chapter Title and Progress */}
        <div 
          className="flex-1 cursor-pointer py-4"
          onClick={() => {
            if (isAccessible) {
              window.location.href = `/courses/${courseId}/chapters/${chapter.id}`;
            }
          }}
        >
          <div className="font-medium">{chapter.title}</div>
          {totalItems > 0 && (
            <div className="text-xs text-slate-400 mt-1">
              {completedItems}/{totalItems} items • {progressPercentage}%
            </div>
          )}
        </div>
      </div>

      {/* Sub-items */}
      {isExpanded && showSubItems && hasSubItems && (
        <div className="ml-8 border-l-2 border-slate-200 pl-4 pb-2">
          {/* Chapter Videos */}
          {chapter.videos.map((video, index) => (
            <div key={`video-${video.id}`} className="relative">
              <div className="flex items-center gap-x-2 text-slate-500 text-sm py-2 pl-2 hover:text-slate-600 hover:bg-slate-300/20 transition-all cursor-pointer rounded">
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-3 h-px bg-slate-300"></div>
                <PlayCircle className="w-4 h-4" />
                <span className="flex-1">{video.title}</span>
                {video.duration && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(video.duration / 60)}m
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Chapter Quizzes */}
          {chapter.quizzes.map((quiz) => {
            const isCompleted = quiz.quizAttempts.length > 0;
            return (
              <div key={`quiz-${quiz.id}`} className="relative">
                <div 
                  className={cn(
                    "flex items-center gap-x-2 text-slate-500 text-sm py-2 pl-2 hover:text-slate-600 hover:bg-slate-300/20 transition-all cursor-pointer rounded",
                    isCompleted && "text-emerald-600"
                  )}
                  onClick={() => {
                    window.location.href = `/courses/${courseId}/chapters/${chapter.id}/quiz/${quiz.id}`;
                  }}
                >
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-3 h-px bg-slate-300"></div>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <HelpCircle className="w-4 h-4" />
                  )}
                  <span className="flex-1">{quiz.title}</span>
                  <span className="text-xs text-slate-400">{quiz.timeline}min</span>
                </div>
              </div>
            );
          })}
          
          {/* Chapter Assignments */}
          {chapter.assignments.map((assignment) => {
            const submission = assignment.submissions[0];
            const isSubmitted = !!submission;
            const isGraded = submission?.status === "graded";
            const submissionStatus = isGraded ? "graded" : isSubmitted ? "submitted" : "pending";
            
            // Show assignment title with draft indicator for instructors
            const assignmentLabel = assignment.isPublished 
              ? assignment.title 
              : isInstructor 
              ? `${assignment.title} (Draft)` 
              : assignment.title;
            
            return (
              <div key={`assignment-${assignment.id}`} className="relative">
                <div 
                  className={cn(
                    "flex items-center gap-x-2 text-slate-500 text-sm py-2 pl-2 hover:text-slate-600 hover:bg-slate-300/20 transition-all cursor-pointer rounded",
                    isGraded && "text-emerald-600",
                    !assignment.isPublished && !isInstructor && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (assignment.isPublished || isInstructor) {
                      window.location.href = `/courses/${courseId}/chapters/${chapter.id}/assignment/${assignment.id}`;
                    }
                  }}
                >
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-3 h-px bg-slate-300"></div>
                  {isGraded ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <div className="flex-1">
                    <span>{assignmentLabel}</span>
                    {submissionStatus !== "pending" && (
                      <span className={cn(
                        "ml-2 px-2 py-0.5 rounded text-xs",
                        submissionStatus === "graded" ? "bg-green-100 text-green-800" :
                        submissionStatus === "submitted" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      )}>
                        {submissionStatus}
                      </span>
                    )}
                  </div>
                  {assignment.dueDate && (
                    <span className="text-xs text-slate-400">
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};