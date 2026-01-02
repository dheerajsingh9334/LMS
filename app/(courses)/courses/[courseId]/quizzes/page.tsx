import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { FileQuestion, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const CourseQuizzesPage = async ({
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
      userId: true,
      isFree: true,
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

  // Get all quizzes from this course with user attempts
  const chapters = await db.chapter.findMany({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
    include: {
      quizzes: {
        where: {
          isPublished: true,
        },
        include: {
          quizAttempts: {
            where: {
              userId: user.id,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          questions: {
            select: {
              id: true,
            }
          }
        }
      }
    },
    orderBy: {
      position: 'asc',
    }
  });

  const quizzes = chapters.flatMap((chapter: any) => 
    chapter.quizzes.map((quiz: any) => ({
      ...quiz,
      chapterTitle: chapter.title,
      chapterId: chapter.id,
      lastAttempt: quiz.quizAttempts[0] || null,
      questionCount: quiz.questions.length,
    }))
  );

  const completedQuizzes = quizzes.filter((q: any) => q.lastAttempt && q.lastAttempt.isPassed);
  const pendingQuizzes = quizzes.filter((q: any) => !q.lastAttempt);

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{course?.title}</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <FileQuestion className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedQuizzes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingQuizzes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quizzes by Chapter */}
        {chapters.map((chapter) => {
          if (chapter.quizzes.length === 0) return null;
          
          return (
            <div key={chapter.id} className="space-y-3">
              <h2 className="text-lg font-semibold">{chapter.title}</h2>
              <div className="grid gap-3">
                {chapter.quizzes.map((quiz: any) => {
                  const lastAttempt = quiz.quizAttempts[0];
                  const score = lastAttempt ? (lastAttempt.score / quiz.questions.length) * 100 : 0;
                  const isPassed = lastAttempt?.isPassed;
                  
                  return (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base">{quiz.title}</CardTitle>
                            <CardDescription>
                              {quiz.questions.length} questions
                            </CardDescription>
                          </div>
                          {lastAttempt && (
                            <Badge variant={isPassed ? "default" : "destructive"}>
                              {isPassed ? "Passed" : "Failed"}
                            </Badge>
                          )}
                          {!lastAttempt && (
                            <Badge variant="secondary">Not Attempted</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          {lastAttempt ? (
                            <div className="text-sm">
                              <span className={isPassed ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                Last Score: {score.toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Not started yet
                            </div>
                          )}
                          <Link 
                            href={`/courses/${params.courseId}/chapters/${chapter.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {lastAttempt ? (lastAttempt.isPassed ? "View Results" : "Retry Quiz") : "Start Quiz"} →
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {quizzes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <FileQuestion className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No quizzes in this course</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default CourseQuizzesPage;
