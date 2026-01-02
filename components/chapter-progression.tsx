"use client";

import { Chapter } from "@prisma/client";
import { CheckCircle2, Lock, PlayCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ChapterProgressionProps {
  chapters: Array<{
    id: string;
    title: string;
    position: number;
    isCompleted: boolean;
    isAccessible: boolean;
    isActive: boolean;
  }>;
  courseId: string;
}

export const ChapterProgression = ({ 
  chapters, 
  courseId 
}: ChapterProgressionProps) => {
  const pathname = usePathname();
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Sequential Learning Path</h3>
        <span className="text-sm text-gray-500 ml-2">
          (Complete chapters in order to unlock the next)
        </span>
      </div>
      
      <div className="space-y-3">
        {chapters.map((chapter, index) => {
          const isActive = pathname?.includes(chapter.id);
          chapter.isActive = isActive;
          const Icon = chapter.isCompleted 
            ? CheckCircle2 
            : chapter.isAccessible 
            ? PlayCircle 
            : Lock;
            
          const nextChapter = chapters[index + 1];
          const showConnector = index < chapters.length - 1;
          
          return (
            <div key={chapter.id} className="relative">
              {/* Chapter Item */}
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                chapter.isActive && "bg-blue-50 border border-blue-200",
                chapter.isCompleted && "bg-green-50",
                !chapter.isAccessible && "bg-gray-50 opacity-60"
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
                
                <Icon className={cn(
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
                        "font-medium hover:underline",
                        chapter.isCompleted && "text-green-700",
                        chapter.isActive && "text-blue-700 font-semibold",
                        !chapter.isCompleted && !chapter.isActive && "text-gray-700"
                      )}
                    >
                      {chapter.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-500">
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
                  </div>
                </div>
              </div>
              
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
      
      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {chapters.filter(ch => ch.isCompleted).length} of {chapters.length} completed
          </span>
          <span>
            {Math.round((chapters.filter(ch => ch.isCompleted).length / chapters.length) * 100)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(chapters.filter(ch => ch.isCompleted).length / chapters.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};