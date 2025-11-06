import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TrendingUp, BookOpen, CheckCircle, Clock, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const MyProgressPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Get all purchased courses with progress
  const purchases = await db.purchase.findMany({
    where: {
      userId: userId,
    },
    include: {
      course: {
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
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Calculate statistics
  const coursesData = purchases.map((purchase) => {
    const course = purchase.course;
    const totalChapters = course.chapters.length;
    const completedChapters = course.chapters.filter(
      (chapter: any) => chapter.userProgress.some((progress: any) => progress.isCompleted)
    ).length;
    
    const totalQuizzes = course.chapters.reduce(
      (acc: number, chapter: any) => acc + chapter.quizzes.length, 0
    );
    const passedQuizzes = course.chapters.reduce(
      (acc: number, chapter: any) => acc + chapter.quizzes.filter((quiz: any) => quiz.quizAttempts.length > 0).length, 0
    );

    const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    const isCompleted = totalChapters > 0 && completedChapters === totalChapters;

    return {
      courseId: course.id,
      courseTitle: course.title,
      courseImage: course.imageUrl,
      totalChapters,
      completedChapters,
      totalQuizzes,
      passedQuizzes,
      progressPercentage,
      isCompleted,
    };
  });

  const totalCourses = coursesData.length;
  const completedCourses = coursesData.filter(c => c.isCompleted).length;
  const inProgressCourses = coursesData.filter(c => !c.isCompleted && c.progressPercentage > 0).length;
  const notStartedCourses = coursesData.filter(c => c.progressPercentage === 0).length;

  const totalChapters = coursesData.reduce((acc, c) => acc + c.totalChapters, 0);
  const completedChapters = coursesData.reduce((acc, c) => acc + c.completedChapters, 0);
  const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-blue-600" />
          My Progress
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track your learning journey across all courses
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Learning Progress</CardTitle>
          <CardDescription>
            {completedChapters} of {totalChapters} chapters completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Course Progress */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Course-wise Progress</h2>
        
        {coursesData.length > 0 ? (
          <div className="grid gap-4">
            {coursesData.map((course) => (
              <Card key={course.courseId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{course.courseTitle}</CardTitle>
                      <CardDescription>
                        {course.completedChapters} of {course.totalChapters} chapters • {course.passedQuizzes} of {course.totalQuizzes} quizzes passed
                      </CardDescription>
                    </div>
                    {course.isCompleted && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={course.progressPercentage} className="h-2" />
                  </div>
                  
                  <Link 
                    href={`/courses/${course.courseId}`}
                    className="inline-block text-sm font-medium text-blue-600 hover:underline"
                  >
                    Continue Learning →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <BookOpen className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No courses yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Enroll in courses to track your progress
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyProgressPage;
