import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubmitAssignmentForm } from "@/components/assignments/submit-assignment-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const StudentAssignmentPage = async ({
  params
}: {
  params: { courseId: string; assignmentId: string }
}) => {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Check if student has access to this course (purchased or free course with progress)
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: params.courseId
      }
    }
  });

  const course = await db.course.findUnique({
    where: {
      id: params.courseId
    },
    select: {
      id: true,
      title: true,
      isFree: true
    }
  });

  if (!course) {
    return redirect("/");
  }

  // For free courses, check if user has any progress
  if (course.isFree && !purchase) {
    const userProgress = await db.userProgress.findFirst({
      where: {
        userId,
        chapter: {
          courseId: params.courseId
        }
      }
    });

    if (!userProgress) {
      return redirect(`/courses/${params.courseId}`);
    }
  } else if (!course.isFree && !purchase) {
    // Paid course without purchase
    return redirect(`/courses/${params.courseId}`);
  }

  // Fetch the assignment
  const assignment = await db.assignment.findUnique({
    where: {
      id: params.assignmentId,
      courseId: params.courseId,
      isPublished: true // Students can only see published assignments
    },
    include: {
      chapter: {
        select: {
          title: true
        }
      },
      teacher: {
        select: {
          name: true
        }
      }
    }
  });

  if (!assignment) {
    return redirect(`/courses/${params.courseId}`);
  }

  // Fetch student's submission if exists
  const submission = await db.assignmentSubmission.findFirst({
    where: {
      assignmentId: params.assignmentId,
      studentId: userId
    },
    include: {
      grader: {
        select: {
          name: true
        }
      }
    }
  });

  const isPastDue = new Date() > new Date(assignment.dueDate);
  const canSubmit = !isPastDue || assignment.allowLateSubmission;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/courses/${params.courseId}/overview`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {course.title}
                {assignment.chapter && (
                  <> • Chapter: {assignment.chapter.title}</>
                )}
              </p>
            </div>
            <Badge variant={isPastDue ? "destructive" : "default"}>
              {isPastDue ? "Overdue" : "Open"}
            </Badge>
          </div>
        </div>

        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {format(new Date(assignment.dueDate), "PPp")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Score</p>
              <p className="font-medium">{assignment.maxScore} points</p>
            </div>
            <div>
              <p className="text-muted-foreground">Instructor</p>
              <p className="font-medium">{assignment.teacher.name}</p>
            </div>
          </div>

          {assignment.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-2">Instructions</p>
              <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {!canSubmit && !submission && (
            <div className="mt-4 pt-4 border-t">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">
                  This assignment is overdue and late submissions are not allowed.
                </p>
              </div>
            </div>
          )}

          {isPastDue && assignment.allowLateSubmission && !submission?.gradedAt && (
            <div className="mt-4 pt-4 border-t">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                  ⚠️ Late Submission: {assignment.latePenalty}% penalty per day will be applied.
                </p>
              </div>
            </div>
          )}
        </div>

        <SubmitAssignmentForm
          assignmentId={params.assignmentId}
          courseId={params.courseId}
          assignment={{
            ...assignment,
            // Prisma may return null for optional fields; coerce to undefined for the UI types
            questionPdfUrl: assignment.questionPdfUrl ?? undefined,
            questionPdfName: assignment.questionPdfName ?? undefined,
            course: {
              id: params.courseId,
              title: course.title
            }
          }}
          existingSubmission={submission as any || undefined}
          canSubmit={canSubmit}
        />
      </div>
    </div>
  );
};

export default StudentAssignmentPage;
