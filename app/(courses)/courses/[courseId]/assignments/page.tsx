import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import Link from "next/link";

const StudentAssignmentsPage = async ({
  params
}: {
  params: { courseId: string }
}) => {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Get course information first
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      isFree: true,
      userId: true,
    }
  });

  if (!course) {
    return redirect("/dashboard");
  }

  // Check if student has access to this course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: params.courseId
      }
    },
    select: {
      paymentStatus: true,
    }
  });

  const isInstructor = course.userId === userId;
  const hasPurchased = !!purchase && purchase.paymentStatus === "completed";

  // Allow access if: instructor, purchased, or free course
  if (!isInstructor && !hasPurchased && !course.isFree) {
    return redirect(`/courses/${params.courseId}/overview`);
  }

  // Fetch all published assignments for this course
  const assignments = await db.assignment.findMany({
    where: {
      courseId: params.courseId,
      isPublished: true
    },
    include: {
      chapter: {
        select: {
          title: true
        }
      },
      submissions: {
        where: {
          studentId: userId
        }
      }
    },
    orderBy: {
      dueDate: "asc"
    }
  });

  // Calculate statistics
  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter(a => a.submissions.length > 0).length;
  const gradedCount = assignments.filter(a => 
    a.submissions.length > 0 && a.submissions[0].gradedAt
  ).length;

  const now = new Date();
  const overdueCount = assignments.filter(a => 
    new Date(a.dueDate) < now && a.submissions.length === 0
  ).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {course.title}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalAssignments > 0 
                ? `${Math.round((submittedCount / totalAssignments) * 100)}%`
                : "0%"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">
              {submittedCount > 0
                ? `${Math.round((gradedCount / submittedCount) * 100)}%`
                : "0%"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Not submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your instructor hasn&apos;t created any assignments for this course yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => {
            const submission = assignment.submissions[0];
            const isPastDue = new Date(assignment.dueDate) < now;
            const isOverdue = isPastDue && !submission;

            return (
              <Card key={assignment.id} className={isOverdue ? "border-red-200" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {assignment.chapter && (
                          <span className="mr-2">Chapter: {assignment.chapter.title}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {submission ? (
                        <>
                          {submission.gradedAt ? (
                            <Badge className="bg-blue-500">
                              Graded: {submission.score}/{assignment.maxScore}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500">Submitted</Badge>
                          )}
                          {submission.isLate && (
                            <Badge variant="destructive">Late</Badge>
                          )}
                        </>
                      ) : (
                        <>
                          {isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary">Not Submitted</Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(assignment.dueDate), "PPp")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{assignment.maxScore} points</span>
                      </div>
                    </div>
                    <Link href={`/courses/${params.courseId}/assignments/${assignment.id}`}>
                      <Button size="sm">
                        {submission?.gradedAt ? "View Result" : submission ? "View Submission" : "Submit"}
                      </Button>
                    </Link>
                  </div>

                  {submission?.gradedAt && submission.feedback && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Feedback:</p>
                      <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentsPage;
