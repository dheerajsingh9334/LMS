"use client";

import { CheckCircle2, Lock, PlayCircle, BookOpen, FileText, HelpCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Quiz {
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  timeline?: number;
  isAccessible: boolean;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string; // ISO string to avoid hydration issues
  isCompleted: boolean;
  isLate: boolean;
  isAccessible: boolean;
}

interface EnhancedChapter {
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  isAccessible: boolean;
  isActive: boolean;
  quizzes: Quiz[];
  assignments: Assignment[];
  videoCompleted: boolean;
}

interface EnhancedChapterProgressionProps {
  chapters: EnhancedChapter[];
  courseId: string;
  showContent?: boolean; // Toggle to show/hide quizzes and assignments
}

export const EnhancedChapterProgression = ({ 
  chapters, 
  courseId,
  showContent = true
}: EnhancedChapterProgressionProps) => {
  const pathname = usePathname();
  
  const getTotalItems = () => {
    return chapters.reduce((total, chapter) => 
      total + 1 + chapter.quizzes.length + chapter.assignments.length, 0
    );
  };
  
  const getCompletedItems = () => {
    return chapters.reduce((total, chapter) => {
      let chapterItems = chapter.isCompleted ? 1 : 0;
      chapterItems += chapter.quizzes.filter(q => q.isCompleted).length;
      chapterItems += chapter.assignments.filter(a => a.isCompleted).length;
      return total + chapterItems;
    }, 0);
  };
  
  const formatDueDate = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Sequential Learning Path</h3>
        <span className="text-sm text-gray-500 ml-2">
          (Complete items in order to unlock next chapter)
        </span>
      </div>
      
      <div className="space-y-4">
        {chapters.map((chapter, chapterIndex) => {
          const isActive = pathname?.includes(chapter.id);
          chapter.isActive = isActive;
          
          const ChapterIcon = chapter.isCompleted 
            ? CheckCircle2 
            : chapter.isAccessible 
            ? PlayCircle 
            : Lock;
            
          const nextChapter = chapters[chapterIndex + 1];
          const showConnector = chapterIndex < chapters.length - 1;
          
          return (
            <div key={chapter.id} className="relative">
              {/* Chapter Item */}
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all border",
                chapter.isActive && "bg-blue-50 border-blue-200",
                chapter.isCompleted && "bg-green-50 border-green-200",
                !chapter.isAccessible && "bg-gray-50 opacity-60 border-gray-200"
              )}>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                  chapter.isCompleted && "bg-green-500 text-white",
                  chapter.isActive && !chapter.isCompleted && "bg-blue-500 text-white",
                  !chapter.isAccessible && "bg-gray-300 text-gray-600",
                  chapter.isAccessible && !chapter.isCompleted && !chapter.isActive && "bg-gray-200 text-gray-700"
                )}>
                  {chapter.position}
                </div>
                
                <ChapterIcon className={cn(
                  "h-5 w-5",
                  chapter.isCompleted && "text-green-600",
                  chapter.isActive && !chapter.isCompleted && "text-blue-600",
                  !chapter.isAccessible && "text-gray-400",
                  chapter.isAccessible && !chapter.isCompleted && !chapter.isActive && "text-gray-500"
                )} />
                
                <div className="flex-1">
                  {chapter.isAccessible ? (
                    <Link 
                      href={`/courses/${courseId}/chapters/${chapter.id}`}
                      className={cn(
                        "font-medium hover:underline block",
                        chapter.isCompleted && "text-green-700",
                        chapter.isActive && "text-blue-700 font-semibold",
                        !chapter.isCompleted && !chapter.isActive && "text-gray-700"
                      )}
                    >
                      {chapter.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-500 block">
                      {chapter.title}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1">
                    {chapter.isCompleted && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                    {chapter.isActive && !chapter.isCompleted && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                    {!chapter.isAccessible && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Locked
                      </span>
                    )}
                    
                    {/* Chapter Progress Summary */}
                    {showContent && (chapter.quizzes.length > 0 || chapter.assignments.length > 0) && (
                      <span className="text-xs text-gray-500">
                        • {chapter.quizzes.filter(q => q.isCompleted).length + chapter.assignments.filter(a => a.isCompleted).length + (chapter.videoCompleted ? 1 : 0)} of {1 + chapter.quizzes.length + chapter.assignments.length} items
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Chapter Content (Quizzes & Assignments) */}
              {showContent && chapter.isAccessible && (chapter.quizzes.length > 0 || chapter.assignments.length > 0) && (
                <div className="ml-11 mt-2 space-y-2">
                  {/* Video/Lecture */}
                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-sm",
                    chapter.videoCompleted ? "text-green-700 bg-green-50" : "text-gray-600 bg-gray-50"
                  )}>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {chapter.videoCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <PlayCircle className="h-3 w-3 text-gray-500" />
                      )}
                    </div>
                    <span className="text-xs">📹</span>
                    <span>Video Lecture</span>
                  </div>
                  
                  {/* Quizzes */}
                  {chapter.quizzes.map((quiz, quizIndex) => (
                    <div key={quiz.id} className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-sm transition-all",
                      quiz.isCompleted ? "text-green-700 bg-green-50" : 
                      quiz.isAccessible ? "text-blue-700 bg-blue-50 hover:bg-blue-100" : 
                      "text-gray-500 bg-gray-50"
                    )}>
                      <div className="w-4 h-4 flex items-center justify-center">
                        {quiz.isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : quiz.isAccessible ? (
                          <HelpCircle className="h-3 w-3 text-blue-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs">🧠</span>
                      {quiz.isAccessible ? (
                        <Link 
                          href={`/courses/${courseId}/chapters/${chapter.id}/quizzes/${quiz.id}`}
                          className="hover:underline flex-1"
                        >
                          {quiz.title}
                        </Link>
                      ) : (
                        <span className="flex-1">{quiz.title}</span>
                      )}
                      {quiz.timeline && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.timeline}min
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {/* Assignments */}
                  {chapter.assignments.map((assignment) => (
                    <div key={assignment.id} className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-sm transition-all",
                      assignment.isCompleted ? "text-green-700 bg-green-50" : 
                      assignment.isLate ? "text-red-700 bg-red-50" :
                      assignment.isAccessible ? "text-purple-700 bg-purple-50 hover:bg-purple-100" : 
                      "text-gray-500 bg-gray-50"
                    )}>
                      <div className="w-4 h-4 flex items-center justify-center">
                        {assignment.isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : assignment.isLate ? (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        ) : assignment.isAccessible ? (
                          <FileText className="h-3 w-3 text-purple-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs">📝</span>
                      {assignment.isAccessible ? (
                        <Link 
                          href={`/courses/${courseId}/assignments/${assignment.id}`}
                          className="hover:underline flex-1"
                        >
                          {assignment.title}
                        </Link>
                      ) : (
                        <span className="flex-1">{assignment.title}</span>
                      )}
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        assignment.isLate ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                      )}>
                        {formatDueDate(assignment.dueDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Connector Line */}
              {showConnector && (
                <div className="flex justify-center py-2">
                  <div className={cn(
                    "w-0.5 h-4",
                    chapter.isCompleted && nextChapter?.isAccessible 
                      ? "bg-green-300" 
                      : "bg-gray-300"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Enhanced Progress Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Chapters:</span>
              <span className="font-medium">
                {chapters.filter(ch => ch.isCompleted).length}/{chapters.length}
              </span>
            </div>
            {showContent && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quizzes:</span>
                  <span className="font-medium">
                    {chapters.reduce((acc, ch) => acc + ch.quizzes.filter(q => q.isCompleted).length, 0)}/
                    {chapters.reduce((acc, ch) => acc + ch.quizzes.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assignments:</span>
                  <span className="font-medium">
                    {chapters.reduce((acc, ch) => acc + ch.assignments.filter(a => a.isCompleted).length, 0)}/
                    {chapters.reduce((acc, ch) => acc + ch.assignments.length, 0)}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Overall Progress:</span>
              <span className="font-medium">
                {Math.round((getCompletedItems() / getTotalItems()) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">
                {getCompletedItems()}/{getTotalItems()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(getCompletedItems() / getTotalItems()) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};