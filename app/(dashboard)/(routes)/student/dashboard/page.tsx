import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { IconBadge } from "@/components/icon-badge";
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Video,
  Calendar,
  Play,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import { CardDescription } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DoughnutChart from "@/app/(dashboard)/_components/doughnutChart";
import BarChart from "@/app/(dashboard)/_components/barChart";

const StudentDashboard = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Get student's enrolled courses with progress
  const purchases = await db.purchase.findMany({
    where: {
      userId: user.id,
      paymentStatus: "completed",
    },
    include: {
      course: {
        include: {
          chapters: {
            where: {
              isPublished: true,
            },
            select: {
              id: true,
            },
          },
          liveSessions: {
            where: {
              isLive: true,
            },
            select: {
              id: true,
              title: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get user progress
  const userProgress = await db.userProgress.findMany({
    where: {
      userId: user.id,
    },
    select: {
      chapterId: true,
      isCompleted: true,
    },
  });

  // Get certificates
  const certificates = await db.certificate.findMany({
    where: {
      userId: user.id,
    },
    include: {
      course: {
        select: {
          title: true,
        },
      },
    },
  });

  // Calculate stats
  const totalCourses = purchases.length;
  const totalChapters = purchases.reduce(
    (total, purchase) => total + purchase.course.chapters.length,
    0,
  );
  const completedChapters = userProgress.filter(
    (progress) => progress.isCompleted,
  ).length;
  const activeLiveSessions = purchases.reduce(
    (total, purchase) => total + purchase.course.liveSessions.length,
    0,
  );
  const overallProgress =
    totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  // Get recent activity - calculate course progress
  const recentCourses = purchases.slice(0, 3).map((purchase) => {
    const courseChapters = purchase.course.chapters.length;
    const courseCompleted = userProgress.filter(
      (progress) =>
        progress.isCompleted &&
        purchase.course.chapters.some(
          (chapter) => chapter.id === progress.chapterId,
        ),
    ).length;
    const courseProgress =
      courseChapters > 0 ? (courseCompleted / courseChapters) * 100 : 0;

    return {
      ...purchase.course,
      progress: courseProgress,
      chaptersCompleted: courseCompleted,
      totalChapters: courseChapters,
    };
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {user.name}! Continue your learning journey.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/browse">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Link>
          </Button>
          {activeLiveSessions > 0 && (
            <Button variant="destructive" asChild>
              <Link href="/dashboard/live-classes">
                <Video className="w-4 h-4 mr-2" />
                {activeLiveSessions} Live Now
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <IconBadge icon={BookOpen} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <IconBadge icon={TrendingUp} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(overallProgress)}%
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Chapters
            </CardTitle>
            <IconBadge icon={CheckCircle} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedChapters}/{totalChapters}
            </div>
            <p className="text-xs text-muted-foreground">Chapters completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <IconBadge icon={Award} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
            <p className="text-xs text-muted-foreground">Earned certificates</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Overall Progress Breakdown */}
        <DoughnutChart
          labels={["Completed", "Remaining"]}
          data={[
            completedChapters,
            Math.max(totalChapters - completedChapters, 0),
          ]}
        />

        {/* Right: Progress by Recent Courses */}
        <BarChart
          title="Recent Course Progress"
          labels={recentCourses.map((c) => c.title)}
          data={recentCourses.map((c) => Math.round(c.progress))}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/dashboard/my-courses">
                <BookOpen className="w-8 h-8 mb-2" />
                My Courses
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/dashboard/assignments">
                <Calendar className="w-8 h-8 mb-2" />
                Assignments
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/dashboard/certificates">
                <Award className="w-8 h-8 mb-2" />
                Certificates
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/dashboard/live-classes">
                <Video className="w-8 h-8 mb-2" />
                Live Classes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Continue Learning */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Continue Learning
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/my-courses">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                No courses enrolled
              </h3>
              <p className="text-slate-500 mb-4">
                Explore our course catalog and start learning!
              </p>
              <Button asChild>
                <Link href="/browse">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{course.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <span>{course.category?.name}</span>
                        <span>•</span>
                        <span>
                          {course.chaptersCompleted}/{course.totalChapters}{" "}
                          chapters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={course.progress}
                          className="flex-1 max-w-[200px]"
                        />
                        <span className="text-sm font-medium">
                          {Math.round(course.progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.liveSessions.length > 0 && (
                      <Badge variant="destructive">Live</Badge>
                    )}
                    <Button asChild size="sm">
                      <Link href={`/courses/${course.id}`}>Continue</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
