"use client";

import { CheckCircle2, Lock, PlayCircle, HelpCircle, FileText, Clock, AlertCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EnhancedChapter {
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  isAccessible: boolean;
  isActive: boolean;
  videoCompleted: boolean;
  quizzes: Array<{
    id: string;
    title: string;
    position: number;
    isCompleted: boolean;
    timeline?: number;
    isAccessible: boolean;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: Date;
    isCompleted: boolean;
    isLate: boolean;
    isAccessible: boolean;
  }>;
}

interface EnhancedSidebarItemProps {
  chapter: EnhancedChapter;
  courseId: string;
}

export const EnhancedSidebarItem = ({
  chapter,
  courseId,
}: EnhancedSidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = pathname?.includes(chapter.id);
  const Icon = chapter.isCompleted 
    ? CheckCircle2 
    : chapter.isAccessible 
    ? PlayCircle 
    : Lock;

  const onClick = () => {
    if (chapter.isAccessible) {
      router.push(`/courses/${courseId}/chapters/${chapter.id}`);
    }
  };

  const formatDueDate = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays}d left`;
  };

  return (
    <div className="border-b">
      {/* Chapter Header */}
      <button
        onClick={onClick}
        type="button"
        className={cn(
          "flex items-center gap-x-2 text-slate-500 text-sm font-medium pl-6 pr-4 py-4 transition-all hover:text-slate-600 hover:bg-slate-300/20 w-full",
          isActive && "text-slate-700 bg-slate-200/20 hover:bg-slate-200/20 hover:text-slate-700",
          chapter.isCompleted && "text-emerald-700 hover:text-emerald-700",
          !chapter.isAccessible && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-x-2 py-1 flex-1">
          <span className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
            chapter.isCompleted && "bg-emerald-500 text-white",
            isActive && !chapter.isCompleted && "bg-slate-500 text-white",
            !chapter.isAccessible && "bg-gray-300 text-gray-600",
            chapter.isAccessible && !chapter.isCompleted && !isActive && "bg-gray-200 text-gray-700"
          )}>
            {chapter.position}
          </span>
          <Icon
            size={16}
            className={cn(
              "text-slate-500",
              isActive && "text-slate-700",
              chapter.isCompleted && "text-emerald-700",
              !chapter.isAccessible && "text-gray-400"
            )}
          />
          <span className="truncate">
            {chapter.title}
          </span>
        </div>
        <div className={cn(
          "ml-auto opacity-0 border-2 border-slate-700 h-full transition-all",
          isActive && "opacity-100",
          chapter.isCompleted && "border-emerald-700"
        )} />
      </button>

      {/* Chapter Content (Quizzes & Assignments) */}
      {isActive && (chapter.quizzes.length > 0 || chapter.assignments.length > 0) && (
        <div className="ml-8 mr-4 mb-2 space-y-1">
          {/* Video/Lecture */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-md text-xs",
            chapter.videoCompleted ? "text-emerald-700 bg-emerald-50" : "text-gray-600 bg-gray-50"
          )}>
            <div className="w-3 h-3 flex items-center justify-center">
              {chapter.videoCompleted ? (
                <CheckCircle2 className="h-2 w-2 text-emerald-600" />
              ) : (
                <PlayCircle className="h-2 w-2 text-gray-500" />
              )}
            </div>
            <span className="text-xs">📹</span>
            <span>Video Lecture</span>
          </div>
          
          {/* Quizzes */}
          {chapter.quizzes.map((quiz) => (
            <Link 
              key={quiz.id}
              href={quiz.isAccessible ? `/courses/${courseId}/chapters/${chapter.id}/quizzes/${quiz.id}` : '#'}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-xs transition-all",
                quiz.isCompleted ? "text-emerald-700 bg-emerald-50" : 
                quiz.isAccessible ? "text-blue-700 bg-blue-50 hover:bg-blue-100" : 
                "text-gray-500 bg-gray-50 cursor-not-allowed"
              )}
            >
              <div className="w-3 h-3 flex items-center justify-center">
                {quiz.isCompleted ? (
                  <CheckCircle2 className="h-2 w-2 text-emerald-600" />
                ) : quiz.isAccessible ? (
                  <HelpCircle className="h-2 w-2 text-blue-600" />
                ) : (
                  <Lock className="h-2 w-2 text-gray-400" />
                )}
              </div>
              <span className="text-xs">🧠</span>
              <span className="flex-1 truncate">{quiz.title}</span>
              {quiz.timeline && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-2 w-2" />
                  {quiz.timeline}min
                </span>
              )}
            </Link>
          ))}
          
          {/* Assignments */}
          {chapter.assignments.map((assignment) => (
            <Link 
              key={assignment.id}
              href={assignment.isAccessible ? `/courses/${courseId}/assignments/${assignment.id}` : '#'}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-xs transition-all",
                assignment.isCompleted ? "text-emerald-700 bg-emerald-50" : 
                assignment.isLate ? "text-red-700 bg-red-50" :
                assignment.isAccessible ? "text-purple-700 bg-purple-50 hover:bg-purple-100" : 
                "text-gray-500 bg-gray-50 cursor-not-allowed"
              )}
            >
              <div className="w-3 h-3 flex items-center justify-center">
                {assignment.isCompleted ? (
                  <CheckCircle2 className="h-2 w-2 text-emerald-600" />
                ) : assignment.isLate ? (
                  <AlertCircle className="h-2 w-2 text-red-600" />
                ) : assignment.isAccessible ? (
                  <FileText className="h-2 w-2 text-purple-600" />
                ) : (
                  <Lock className="h-2 w-2 text-gray-400" />
                )}
              </div>
              <span className="text-xs">📝</span>
              <span className="flex-1 truncate">{assignment.title}</span>
              <span className={cn(
                "text-xs px-1 py-0.5 rounded",
                assignment.isLate ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
              )}>
                {formatDueDate(assignment.dueDate)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};