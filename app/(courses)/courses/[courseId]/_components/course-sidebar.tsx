import { Chapter, Course, UserProgress } from "@prisma/client";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { CourseProgress } from "@/components/course-progress";
import { CourseSidebarItem } from "./course-sidebar-item";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { checkPurchase } from "@/actions/Courses/get-purchase";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { getChapterAccessibility } from "@/lib/chapter-access";
import {
  Award,
  FileText,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { CourseAttachments } from "./course-attachments";

type progressProps = {
  progressPercentage: number;
  totalChapters: number;
  completedChapters: number;
};

interface CourseSidebarProps {
  course: Course & {
    chapters: (Chapter & {
      userProgress: UserProgress[] | null;
      chapterVideos: any[];
    })[];
  };
  progress: progressProps;
}

export const CourseSidebar = async ({
  course,
  progress,
}: CourseSidebarProps) => {
  const user = await currentUser();
  let userId = user?.id ?? "";
  const purchased = await checkPurchase(userId, course.id);
  const isInstructor = course.userId === userId;

  // Get chapter accessibility with sequential progression
  const chapterAccessibility = await getChapterAccessibility(
    userId,
    course.id,
    purchased,
    isInstructor
  );

  // Get assignments for each chapter
  const assignments = await db.assignment.findMany({
    where: {
      courseId: course.id,
      // Show all assignments for instructors, only published AND verified for students
      ...(isInstructor
        ? {}
        : {
            isPublished: true,
            verificationStatus: "verified",
          }),
    },
    include: {
      submissions: {
        where: {
          studentId: userId,
        },
        select: {
          id: true,
          status: true,
          score: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Get quizzes for each chapter
  const quizzes = await db.quiz.findMany({
    where: {
      chapter: {
        courseId: course.id,
      },
      isPublished: true,
    },
    include: {
      chapter: {
        select: {
          id: true,
          title: true,
        },
      },
      quizAttempts: {
        where: {
          userId: userId,
        },
        select: {
          id: true,
          score: true,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
  });

  // Check if course has certificate and if user is eligible
  const certificateTemplate = await db.certificateTemplate.findUnique({
    where: {
      courseId: course.id,
    },
  });

  // Check if all chapters are completed for certificate eligibility
  const allChaptersCompleted = progress.progressPercentage === 100;

  // Check if final exam is available (using new FinalExam model)
  const finalExam = await db.finalExam.findFirst({
    where: {
      courseId: course.id,
      isPublished: true,
    },
    include: {
      questions: {
        select: {
          id: true,
          title: true,
          position: true,
        },
      },
      attempts: {
        where: {
          userId: userId,
        },
        select: {
          id: true,
          score: true,
          passed: true,
          completedAt: true,
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 1, // Get the latest attempt
      },
    },
  });

  // Check if final exam is completed (using the data from the finalExam query above)
  const latestFinalExamAttempt = finalExam?.attempts?.[0];
  const finalExamCompleted = latestFinalExamAttempt?.passed || false;
  const finalExamScore = latestFinalExamAttempt?.score || null;

  // Check if user has a certificate (this means they passed the final exam)
  const certificate = await db.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: userId,
        courseId: course.id,
      },
    },
  });

  const hasCertificate = !!certificate;
  // User can access certificate if they have one OR if they can potentially earn one (completed all requirements)
  const canAccessCertificate =
    (purchased || isInstructor) &&
    (hasCertificate || (allChaptersCompleted && finalExamCompleted));

  const finalExamAvailable = !!finalExam && finalExam.questions.length > 0;

  const completionText = `(${progress.completedChapters}/${progress.totalChapters})`;

  return (
    <div className="h-full w-72 border-r flex flex-col overflow-y-auto shadow-sm">
      <div className="p-8">
        <Logo />
      </div>
      <div className="px-8 flex flex-col border-b">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold ">{course.title}</h1>
          {progress.progressPercentage === 100 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
              Completed
            </span>
          )}
        </div>
        {(purchased || isInstructor) && (
          <div className="mt-4">
            <p>Completed Chapters {completionText}</p>
            <div className="py-4">
              <CourseProgress
                variant="success"
                value={progress.progressPercentage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Urgent Assignments Alert - Show overdue and due soon assignments */}
      {(purchased || isInstructor) &&
        (() => {
          const urgentAssignments = assignments.filter((assignment) => {
            const submission = assignment.submissions[0];
            const isSubmitted = !!submission;
            const isGraded = submission?.status === "graded";

            if (isSubmitted || isGraded) return false;

            const today = new Date();
            const dueDate = new Date(assignment.dueDate);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Show if overdue or due within 3 days
            return diffDays <= 3;
          });

          if (urgentAssignments.length === 0) return null;

          return (
            <div className="mx-4 mb-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">
                  Urgent Assignments ({urgentAssignments.length})
                </span>
              </div>
              <div className="space-y-1">
                {urgentAssignments.slice(0, 3).map((assignment) => {
                  const today = new Date();
                  const dueDate = new Date(assignment.dueDate);
                  const diffTime = dueDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays < 0;

                  return (
                    <div key={assignment.id} className="text-xs text-red-700">
                      <span className="font-medium">{assignment.title}</span>
                      <span className="ml-2">
                        {isOverdue
                          ? `${Math.abs(diffDays)} days overdue`
                          : diffDays === 0
                          ? "Due today"
                          : `Due in ${diffDays} days`}
                      </span>
                    </div>
                  );
                })}
                {urgentAssignments.length > 3 && (
                  <div className="text-xs text-red-600">
                    +{urgentAssignments.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      <div className="flex flex-col w-full">
        {/* Course Content Header */}
        <div className="px-6 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Course Content
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {course.chapters.length} chapters • Track your progress
          </p>
        </div>

        {/* Collapsible Chapters */}
        <CollapsibleSidebar
          chapters={course.chapters}
          courseId={course.id}
          purchased={purchased}
          isInstructor={isInstructor}
          chapterAccessibility={chapterAccessibility}
          quizzes={quizzes}
          assignments={assignments}
          finalExam={finalExam}
          finalExamCompleted={finalExamCompleted}
          finalExamScore={finalExamScore}
          certificateTemplate={certificateTemplate}
          hasCertificate={hasCertificate}
          canAccessCertificate={canAccessCertificate}
        />

        {/* Attachments Section */}
        {(purchased || isInstructor) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="px-6 pb-2">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Attachments
              </h3>
            </div>
            <div className="px-6">
              <CourseAttachments courseId={course.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
