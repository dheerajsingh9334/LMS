import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { Award, Download, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import Image from "next/image";

const CourseCertificatePage = async ({
  params
}: {
  params: { courseId: string }
}) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Get course information first
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      isPublished: true,
    },
    select: {
      title: true,
      isFree: true,
      userId: true,
    }
  });

  if (!course) {
    return redirect("/dashboard");
  }

  // Check if user has purchased the course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      }
    },
    select: {
      paymentStatus: true,
    }
  });

  const isInstructor = course.userId === user.id;
  const hasPurchased = !!purchase && purchase.paymentStatus === "completed";

  // Allow access if: instructor, purchased, or free course
  if (!isInstructor && !hasPurchased && !course.isFree) {
    return redirect(`/courses/${params.courseId}/overview`);
  }

  // Check if certificate already exists
  const existingCertificate = await db.certificate.findFirst({
    where: {
      userId: user.id,
      courseId: params.courseId,
    }
  });

  // Check if user has earned a certificate
  const certificate = await db.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      }
    }
  });

  // Check if user passed final exam
  const finalExamAttempt = await db.finalExamAttempt.findFirst({
    where: {
      userId: user.id,
      courseId: params.courseId,
      passed: true, // Only passed attempts
    },
    orderBy: {
      completedAt: 'desc'
    }
  });

  // Get certificate template and requirements
  const template = await db.certificateTemplate.findUnique({
    where: {
      courseId: params.courseId,
    }
  });

  // Calculate progress toward certificate
  const chapters = await db.chapter.findMany({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
    include: {
      userProgress: {
        where: {
          userId: user.id,
        }
      },
      quizzes: {
        where: {
          isPublished: true,
        },
        include: {
          quizAttempts: {
            where: {
              userId: user.id,
            }
          }
        }
      }
    }
  });

  const assignments = await db.assignment.findMany({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
    include: {
      submissions: {
        where: {
          studentId: user.id,
          status: "graded",
        }
      }
    }
  });

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(
    (chapter: any) => chapter.userProgress.some((p: any) => p.isCompleted)
  ).length;

  const totalQuizzes = chapters.reduce((acc: number, ch: any) => acc + ch.quizzes.length, 0);
  const passedQuizzes = chapters.reduce((acc: number, ch: any) => 
    acc + ch.quizzes.filter((q: any) => q.quizAttempts.length > 0).length, 0
  );

  const totalAssignments = assignments.length;
  const submittedAssignments = assignments.filter((a: any) => a.submissions.length > 0).length;

  // Check requirements
  const requiresAllChapters = template?.requireAllChapters ?? false;
  const requiresAllQuizzes = template?.requireAllQuizzes ?? false;
  const requiresAllAssignments = template?.requireAllAssignments ?? false;
  const minimumScore = 0; // Can be added to template model if needed

  const chaptersRequirementMet = !requiresAllChapters || (completedChapters === totalChapters);
  const quizzesRequirementMet = !requiresAllQuizzes || (passedQuizzes === totalQuizzes);
  const assignmentsRequirementMet = !requiresAllAssignments || (submittedAssignments === totalAssignments);
  const finalExamRequirementMet = !!finalExamAttempt; // Must pass final exam

  const allRequirementsMet = chaptersRequirementMet && quizzesRequirementMet && assignmentsRequirementMet && finalExamRequirementMet;

  const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-600" />
            Course Certificate
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{course?.title}</p>
        </div>

        {existingCertificate ? (
          // Certificate earned - show it
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <CardTitle>Congratulations! 🎉</CardTitle>
              </div>
              <CardDescription>
                You&apos;ve earned your certificate for completing this course
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Certificate Preview */}
              {existingCertificate.certificateUrl && (
                <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border-2 border-yellow-200 dark:border-yellow-800">
                  <Image
                    src={existingCertificate.certificateUrl}
                    alt={`Certificate for ${course?.title}`}
                    fill
                    className="object-contain bg-white"
                  />
                </div>
              )}

              {/* Certificate Details */}
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{format(new Date(existingCertificate.issueDate), 'PPP')}</span>
                </div>
                
                {existingCertificate.grade && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-muted-foreground">Grade:</span>
                    <Badge variant="default">{existingCertificate.grade}</Badge>
                  </div>
                )}

                {existingCertificate.verificationCode && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-muted-foreground">Verification Code:</span>
                    <code className="text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded">
                      {existingCertificate.verificationCode}
                    </code>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <Button 
                className="w-full"
                size="lg"
                asChild
              >
                <a 
                  href={existingCertificate.certificateUrl || '#'}
                  download={`${course?.title.replace(/\s+/g, '_')}_Certificate.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Certificate not earned yet - show requirements
          <>
            <Card>
              <CardHeader>
                <CardTitle>Certificate Requirements</CardTitle>
                <CardDescription>
                  Complete the following requirements to earn your certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Course Progress</span>
                    <span className="text-muted-foreground">{overallProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Requirements Checklist */}
                <div className="space-y-3">
                  {/* Chapters */}
                  {totalChapters > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      {chaptersRequirementMet ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {requiresAllChapters ? "Complete all chapters" : "Chapter Progress"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedChapters} of {totalChapters} chapters completed
                        </p>
                        <Progress value={(completedChapters / totalChapters) * 100} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  )}

                  {/* Quizzes */}
                  {totalQuizzes > 0 && requiresAllQuizzes && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      {quizzesRequirementMet ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Pass all quizzes</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {passedQuizzes} of {totalQuizzes} quizzes passed
                        </p>
                        <Progress value={(passedQuizzes / totalQuizzes) * 100} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  )}

                  {/* Assignments */}
                  {totalAssignments > 0 && requiresAllAssignments && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      {assignmentsRequirementMet ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Submit all assignments</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {submittedAssignments} of {totalAssignments} assignments submitted
                        </p>
                        <Progress value={(submittedAssignments / totalAssignments) * 100} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Message */}
                {allRequirementsMet ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">You&apos;ve met all requirements!</p>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                      Your certificate will be issued by the instructor soon.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">Keep going!</p>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                      Complete the remaining requirements to earn your certificate.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default CourseCertificatePage;
