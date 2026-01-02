import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentSubmissionForm } from "./_components/assignment-submission-form";
import { AssignmentSubmissions } from "./_components/assignment-submissions";
import { format } from "date-fns";

interface AssignmentPageProps {
  params: {
    courseId: string;
    chapterId: string;
    assignmentId: string;
  };
}

const AssignmentPage = async ({ params }: AssignmentPageProps) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Get assignment details
  const assignment = await db.assignment.findUnique({
    where: {
      id: params.assignmentId,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
      chapter: {
        select: {
          id: true,
          title: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
      submissions: {
        where: {
          studentId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!assignment) {
    return redirect(`/courses/${params.courseId}/chapters/${params.chapterId}`);
  }

  // Check if user has purchased the course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      },
    },
  });

  const isPurchased = !!purchase && purchase.paymentStatus === "completed";
  const isInstructor = assignment.course.userId === user.id;

  if (!isPurchased && !isInstructor) {
    return redirect(`/courses/${params.courseId}/overview`);
  }

  const userSubmission = assignment.submissions[0];
  const isSubmitted = !!userSubmission;
  const isGraded = userSubmission?.status === "graded";
  const isLate = userSubmission?.isLate || false;
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = new Date() > dueDate && !isSubmitted;

  // For instructors, get all submissions
  let allSubmissions: any[] = [];
  if (isInstructor) {
    allSubmissions = await db.assignmentSubmission.findMany({
      where: {
        assignmentId: assignment.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/courses/${params.courseId}/chapters/${params.chapterId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chapter
            </Button>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {assignment.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {assignment.course.title}
                  </span>
                  {assignment.chapter && (
                    <span>• {assignment.chapter.title}</span>
                  )}
                  <span>• By {assignment.teacher.name}</span>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="flex flex-col items-end gap-2">
                {isSubmitted ? (
                  <Badge variant={isGraded ? "default" : "secondary"}>
                    {isGraded ? "Graded" : "Submitted"}
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="destructive">Overdue</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
                
                {isLate && (
                  <Badge variant="destructive" className="text-xs">
                    Late Submission
                  </Badge>
                )}
              </div>
            </div>

            {/* Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">Due Date</p>
                  <p className={isOverdue ? "text-red-600" : "text-gray-600"}>
                    {format(dueDate, "PPP 'at' p")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">Max Score</p>
                  <p className="text-gray-600">{assignment.maxScore} points</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="font-medium">Submissions</p>
                  <p className="text-gray-600">{assignment._count.submissions} submitted</p>
                </div>
              </div>
            </div>

            {/* Assignment Description */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">Assignment Description</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {assignment.description}
              </div>
            </div>

            {/* Question PDF */}
            {assignment.questionPdfUrl && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Assignment Questions</h4>
                <a
                  href={assignment.questionPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-4 w-4" />
                  {assignment.questionPdfName || "Download Questions PDF"}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Student View: Submission Form */}
        {!isInstructor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Submission
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        Assignment Submitted
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Submitted on {format(new Date(userSubmission.submittedAt), "PPP 'at' p")}
                    </p>
                    {isLate && (
                      <p className="text-sm text-red-600 mt-1">
                        This submission was late by {userSubmission.daysLate} day(s)
                      </p>
                    )}
                  </div>

                  {/* Show submission details */}
                  <div className="space-y-3">
                    {userSubmission.fileUrl && (
                      <div>
                        <label className="font-medium text-gray-700">Submitted File:</label>
                        <div className="mt-1">
                          <a
                            href={userSubmission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-4 w-4" />
                            {userSubmission.fileName || "Download Submission"}
                          </a>
                        </div>
                      </div>
                    )}

                    {userSubmission.linkUrl && (
                      <div>
                        <label className="font-medium text-gray-700">Submitted Link:</label>
                        <div className="mt-1">
                          <a
                            href={userSubmission.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {userSubmission.linkUrl}
                          </a>
                        </div>
                      </div>
                    )}

                    {userSubmission.textContent && (
                      <div>
                        <label className="font-medium text-gray-700">Submitted Text:</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded border">
                          <p className="whitespace-pre-wrap">{userSubmission.textContent}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grade Display */}
                  {isGraded && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-800">Grade</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {userSubmission.score}/{assignment.maxScore}
                        </span>
                      </div>
                      {userSubmission.feedback && (
                        <div className="mt-3">
                          <label className="font-medium text-blue-800">Feedback:</label>
                          <p className="mt-1 text-blue-700 whitespace-pre-wrap">
                            {userSubmission.feedback}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-blue-600 mt-2">
                        Graded on {format(new Date(userSubmission.gradedAt!), "PPP 'at' p")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <AssignmentSubmissionForm
                  assignment={assignment}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructor View: All Submissions */}
        {isInstructor && (
          <AssignmentSubmissions
            assignment={assignment}
            submissions={allSubmissions}
            courseId={params.courseId}
            chapterId={params.chapterId}
          />
        )}
      </div>
    </div>
  );
};

export default AssignmentPage;