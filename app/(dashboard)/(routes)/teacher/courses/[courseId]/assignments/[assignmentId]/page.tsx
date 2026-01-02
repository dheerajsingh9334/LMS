import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GradingInterface } from "@/components/assignments/grading-interface";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const AssignmentGradingPage = async ({
  params
}: {
  params: { courseId: string; assignmentId: string }
}) => {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Verify the teacher owns this course
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId
    },
    select: {
      id: true,
      title: true,
    }
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  // Fetch the assignment with all submissions
  const assignment = await db.assignment.findUnique({
    where: {
      id: params.assignmentId,
      courseId: params.courseId
    },
    include: {
      chapter: {
        select: {
          title: true
        }
      },
      submissions: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          grader: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          submittedAt: "desc"
        }
      }
    }
  });

  if (!assignment) {
    return redirect(`/teacher/courses/${params.courseId}/assignments`);
  }

  const isPastDue = new Date() > new Date(assignment.dueDate);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/teacher/courses/${params.courseId}/assignments`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </Link>
      </div>

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
          <div className="flex gap-2">
            <Link href={`/teacher/courses/${params.courseId}/assignments/${params.assignmentId}/edit`}>
              <Button variant="outline" size="sm">
                Edit Assignment
              </Button>
            </Link>
            <Badge variant={assignment.isPublished ? "default" : "secondary"}>
              {assignment.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {format(new Date(assignment.dueDate), "PPp")}
              </p>
              {isPastDue && (
                <Badge variant="destructive" className="mt-1">Overdue</Badge>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Max Score</p>
              <p className="font-medium">{assignment.maxScore} points</p>
            </div>
            <div>
              <p className="text-muted-foreground">Late Submissions</p>
              <p className="font-medium">
                {assignment.allowLateSubmission ? (
                  <>Allowed ({assignment.latePenalty}% penalty)</>
                ) : (
                  "Not Allowed"
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Plagiarism Check</p>
              <p className="font-medium">
                {assignment.enablePlagiarismCheck ? (
                  <>Enabled ({assignment.plagiarismThreshold}%)</>
                ) : (
                  "Disabled"
                )}
              </p>
            </div>
          </div>

          {assignment.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-2">Description</p>
              <p className="text-sm">{assignment.description}</p>
            </div>
          )}
        </div>
      </div>

      <GradingInterface
        assignment={{
          id: assignment.id,
          title: assignment.title,
          maxScore: assignment.maxScore,
          allowLateSubmission: assignment.allowLateSubmission,
          latePenalty: assignment.latePenalty,
          enablePlagiarismCheck: assignment.enablePlagiarismCheck,
          course: {
            id: params.courseId
          }
        }}
        submissions={assignment.submissions as any}
      />
    </div>
  );
};

export default AssignmentGradingPage;
