"use client";

import { CheckCircle, Lock, PlayCircle, HelpCircle, FileText, Award, ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface CourseSidebarItemProps {
  label: string;
  id: string;
  isCompleted: boolean;
  courseId: string;
  isLocked: boolean;
  position?: number;
  lockReason?: string;
  type?: "chapter" | "quiz" | "assignment" | "certificate" | "final-exam";
  chapterId?: string;
  submissionStatus?: "pending" | "submitted" | "graded";
  hasSubItems?: boolean;
  progressPercentage?: number;
  isSubItem?: boolean;
  dueDate?: Date;
  maxScore?: number;
};

export const CourseSidebarItem = ({
  label,
  id,
  isCompleted,
  courseId,
  isLocked,
  position,
  lockReason,
  type = "chapter",
  chapterId,
  submissionStatus,
  hasSubItems = false,
  progressPercentage = 0,
  isSubItem = false,
  dueDate,
  maxScore,
}: CourseSidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();

  // Determine icon based on type and status
  let Icon: LucideIcon;
  if (isLocked) {
    Icon = Lock;
  } else if (isCompleted) {
    Icon = CheckCircle;
  } else if (type === "quiz") {
    Icon = HelpCircle;
  } else if (type === "assignment") {
    Icon = FileText;
  } else if (type === "certificate") {
    Icon = Award;
  } else if (type === "final-exam") {
    Icon = GraduationCap;
  } else {
    Icon = PlayCircle;
  }

  const isActive = pathname?.includes(id);

  const onClick = () => {
    if (!isLocked) {
      switch (type) {
        case "chapter":
          router.push(`/courses/${courseId}/chapters/${id}`);
          break;
        case "quiz":
          router.push(`/courses/${courseId}/chapters/${chapterId}/quiz/${id}`);
          break;
        case "assignment":
          router.push(`/courses/${courseId}/chapters/${chapterId}/assignment/${id}`);
          break;
        case "certificate":
          router.push(`/courses/${courseId}/certificate`);
          break;
        case "final-exam":
          router.push(`/courses/${courseId}/final-exam`);
          break;
        default:
          router.push(`/courses/${courseId}/chapters/${id}`);
      }
    }
  }

  // Get submission status styling
  const getSubmissionStatusStyle = () => {
    if (type === "assignment" && submissionStatus) {
      switch (submissionStatus) {
        case "graded":
          return "bg-green-100 text-green-800";
        case "submitted":
          return "bg-blue-100 text-blue-800";
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        default:
          return "";
      }
    }
    return "";
  };

  const getSubmissionStatusText = () => {
    if (type === "assignment" && submissionStatus) {
      switch (submissionStatus) {
        case "graded":
          return "Graded";
        case "submitted":
          return "Submitted";
        case "pending":
          return "Pending";
        default:
          return "";
      }
    }
    return "";
  };

  // Check if assignment is overdue
  const isOverdue = () => {
    if (type === "assignment" && dueDate && submissionStatus === "pending") {
      return new Date() > new Date(dueDate);
    }
    return false;
  };

  // Get days until due date
  const getDaysUntilDue = () => {
    if (type === "assignment" && dueDate) {
      const today = new Date();
      const due = new Date(dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  const daysUntilDue = getDaysUntilDue();
  const isAssignmentOverdue = isOverdue();

  return (
    <button
      onClick={onClick}
      type="button"
      disabled={isLocked}
      title={isLocked ? lockReason : `Go to ${label}`}
      className={cn(
        "flex items-center gap-x-2 text-slate-500 text-sm font-[500] transition-all hover:text-slate-600 hover:bg-slate-300/20 relative w-full",
        // Different left padding for different types
        type === "chapter" && !isSubItem && "pl-6",
        isSubItem && "pl-4",
        (type === "certificate" || type === "final-exam") && "pl-6",
        isActive && "text-text-secondary font-[700] bg-active hover:bg-sky-200/20 hover:text-text-secondary",
        isCompleted && "text-green-700 bg-green-50 hover:text-green-800",
        isLocked && "opacity-50 cursor-not-allowed hover:bg-transparent",
        !isLocked && !isCompleted && "hover:bg-blue-50",
        // Special styling for certificate and final exam
        (type === "certificate" || type === "final-exam") && "border-t border-gray-200"
      )}
    >
      <div className="flex items-center gap-x-3 py-3 w-full">
        {/* Dropdown arrow for chapters with sub-items */}
        {type === "chapter" && !isSubItem && hasSubItems && (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        
        {/* Show position number only for chapters and not sub-items */}
        {position && type === "chapter" && !isSubItem && (
          <span className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
            isCompleted && "bg-green-500 text-white",
            isActive && !isCompleted && "bg-blue-500 text-white",
            isLocked && "bg-gray-300 text-gray-600",
            !isLocked && !isCompleted && !isActive && "bg-gray-200 text-gray-700"
          )}>
            {position}
          </span>
        )}
        
        {/* Icon */}
        <Icon
          size={isSubItem ? 14 : (type === "chapter" ? 18 : 16)}
          className={cn(
            "text-slate-500 flex-shrink-0",
            isActive && "text-text-secondary",
            isCompleted && "text-green-600",
            isLocked && "text-gray-400",
            type === "quiz" && "text-purple-600",
            type === "assignment" && "text-orange-600",
            type === "certificate" && "text-yellow-600",
            type === "final-exam" && "text-blue-600"
          )}
        />
        
        {/* Label */}
        <span className={cn(
          "text-left flex-1",
          type === "chapter" && !isSubItem && "font-medium",
          isSubItem && "text-sm",
          (type === "certificate" || type === "final-exam") && "font-semibold"
        )}>
          {label}
        </span>
        
        {/* Progress percentage for chapters */}
        {type === "chapter" && !isSubItem && progressPercentage !== undefined && (
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-bold",
            progressPercentage === 100 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
          )}>
            {progressPercentage}%
          </span>
        )}
        
        {/* Status indicators */}
        {isLocked && lockReason === "Previous chapter not completed" && (
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Complete previous
          </span>
        )}
        
        {/* Assignment submission status and due date */}
        {type === "assignment" && (
          <div className="flex flex-col items-end gap-1">
            {submissionStatus && (
              <span className={cn(
                "text-xs px-2 py-1 rounded",
                getSubmissionStatusStyle()
              )}>
                {getSubmissionStatusText()}
              </span>
            )}
            {daysUntilDue !== null && submissionStatus === "pending" && (
              <span className={cn(
                "text-xs px-2 py-1 rounded font-medium",
                isAssignmentOverdue && "bg-red-100 text-red-800",
                !isAssignmentOverdue && daysUntilDue <= 3 && "bg-yellow-100 text-yellow-800",
                !isAssignmentOverdue && daysUntilDue > 3 && "bg-gray-100 text-gray-600"
              )}>
                {isAssignmentOverdue 
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : daysUntilDue === 0 
                  ? "Due today"
                  : daysUntilDue === 1
                  ? "Due tomorrow"
                  : `${daysUntilDue} days left`
                }
              </span>
            )}
          </div>
        )}
        
        {/* Quiz completion indicator */}
        {type === "quiz" && isCompleted && (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
        
        {/* Final Exam and Certificate status */}
        {(type === "certificate" || type === "final-exam") && (
          <span className={cn(
            "text-xs px-2 py-1 rounded",
            !isLocked ? "text-green-600 bg-green-100" : "text-gray-600 bg-gray-100"
          )}>
            {!isLocked ? "Available" : "Locked"}
          </span>
        )}
      </div>
      <div className={cn(
        "ml-auto opacity-0 border-2 border-custom-primary h-full transition-all",
        isActive && "opacity-100",
        isCompleted && "border-green-500"
      )} />
    </button>
  )
}