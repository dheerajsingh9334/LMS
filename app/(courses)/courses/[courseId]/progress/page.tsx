import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { TrendingUp, CheckCircle, Clock, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const CourseProgressPage = async ({
  params
}: {
  params: { courseId: string }
}) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Check if user has purchased the course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: userId,
        courseId: params.courseId,
      }
    }
  });

  if (!purchase) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        include: {
          userProgress: {
            where: {
              userId: userId,
            }
          },
          quizzes: {
            where: {
              isPublished: true,
            },
            include: {
              quizAttempts: {
                where: {
                  userId: userId,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
              },
              questions: true,
            }
          }
        },
        orderBy: {
          position: 'asc',
        }
      }
    }
  });

  if (!course) {
    return redirect("/");
  }

  // Get assignments
  const assignments = await db.assignment.findMany({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
    include: {
      submissions: {
        where: {
          studentId: userId,
        }
      }
    }
  });

  // Calculate statistics
  const totalChapters = course.chapters.length;
  const completedChapters = course.chapters.filter(
    (chapter: any) => chapter.userProgress.some((p: any) => p.isCompleted)
  ).length;
  
  const totalQuizzes = course.chapters.reduce((acc: number, ch: any) => acc + ch.quizzes.length, 0);
  const passedQuizzes = course.chapters.reduce((acc: number, ch: any) =>
    acc + ch.quizzes.filter((q: any) => q.quizAttempts.length > 0).length, 0
  );

  const totalAssignments = assignments.length;
  const submittedAssignments = assignments.filter((a: any) => a.submissions.length > 0).length;  const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const isCompleted = totalChapters > 0 && completedChapters === totalChapters;

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-blue-600" />
            Course Progress
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{course.title}</p>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  {completedChapters} of {totalChapters} chapters completed
                </CardDescription>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600">
                  <Trophy className="h-6 w-6" />
                  <span className="font-medium">Completed!</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Course Progress</span>
                <span className="text-2xl font-bold text-blue-600">{overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedChapters}/{totalChapters}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalChapters - completedChapters} remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Passed</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passedQuizzes}/{totalQuizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalQuizzes - passedQuizzes} remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submittedAssignments}/{totalAssignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAssignments - submittedAssignments} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chapter Progress Details */}
        <Card>
          <CardHeader>
            <CardTitle>Chapter Progress</CardTitle>
            <CardDescription>Detailed breakdown of your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {course.chapters.map((chapter: any, index: number) => {
                const isCompleted = chapter.userProgress.some((p: any) => p.isCompleted);
                const chapterQuizzes = chapter.quizzes;
                const passedChapterQuizzes = chapterQuizzes.filter(
                  (q: any) => q.quizAttempts.length > 0
                ).length;

                return (
                  <div key={chapter.id} className="flex items-start gap-4 p-3 rounded-lg border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{chapter.title}</h3>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      {chapterQuizzes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Quizzes: {passedChapterQuizzes}/{chapterQuizzes.length} passed
                        </p>
                      )}
                      {isCompleted && (
                        <p className="text-xs text-green-600 font-medium">
                          Completed ✓
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CourseProgressPage;
