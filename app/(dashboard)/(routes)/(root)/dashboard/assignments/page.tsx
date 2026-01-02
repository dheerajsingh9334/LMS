import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ClipboardList, FileText, Calendar, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

const MyAssignmentsPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Get all courses the user has purchased
  const purchases = await db.purchase.findMany({
    where: {
      userId: userId,
    },
    select: {
      courseId: true,
    }
  });

  const courseIds = purchases.map(p => p.courseId);

  // Get all assignments from purchased courses
  const assignments = await db.assignment.findMany({
    where: {
      courseId: {
        in: courseIds
      },
      isPublished: true,
    },
    include: {
      course: {
        select: {
          title: true,
        }
      },
      submissions: {
        where: {
          studentId: userId,
        },
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
        }
      }
    },
    orderBy: {
      dueDate: 'asc',
    }
  });

  const now = new Date();

  const pendingAssignments = assignments.filter(a => 
    a.submissions.length === 0 && (!a.dueDate || new Date(a.dueDate) > now)
  );
  const submittedAssignments = assignments.filter(a => a.submissions.length > 0);
  const overdueAssignments = assignments.filter(a => 
    a.submissions.length === 0 && a.dueDate && new Date(a.dueDate) < now
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track all your assignments across courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <ClipboardList className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueAssignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Assignments */}
      {overdueAssignments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600">Overdue Assignments</h2>
          <div className="grid gap-4">
            {overdueAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{assignment.title}</CardTitle>
                      <CardDescription>{assignment.course.title}</CardDescription>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'PPP') : 'No due date'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {assignment.maxScore} marks
                      </div>
                    </div>
                    <Link 
                      href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Assignments</h2>
          <div className="grid gap-4">
            {pendingAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{assignment.title}</CardTitle>
                      <CardDescription>{assignment.course.title}</CardDescription>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'PPP') : 'No due date'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {assignment.maxScore} marks
                      </div>
                    </div>
                    <Link 
                      href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Start Assignment →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Assignments */}
      {submittedAssignments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Submitted Assignments</h2>
          <div className="grid gap-4">
            {submittedAssignments.map((assignment) => {
              const submission = assignment.submissions[0];
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.course.title}</CardDescription>
                      </div>
                      <Badge variant={submission.status === 'GRADED' ? 'default' : 'outline'}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Submitted: {format(new Date(submission.submittedAt!), 'PPP')}
                        </div>
                        {submission.score !== null && (
                          <div className="flex items-center gap-1 font-medium text-green-600">
                            Score: {submission.score}/{assignment.maxScore}
                          </div>
                        )}
                      </div>
                      <Link 
                        href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View Submission →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <ClipboardList className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No assignments yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Enroll in courses to see assignments
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyAssignmentsPage;
