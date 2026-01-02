import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { IconBadge } from "@/components/icon-badge";
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Video,
  Award,
  Calendar,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DoughnutChart from "@/app/(dashboard)/_components/doughnutChart";
import BarChart from "@/app/(dashboard)/_components/barChart";

const TeacherDashboardPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Get teacher's courses with stats
  const courses = await db.course.findMany({
    where: {
      userId: user.id,
    },
    include: {
      chapters: {
        select: {
          id: true,
        },
      },
      purchases: {
        select: {
          id: true,
          paymentStatus: true,
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
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(
    (course) => course.isPublished
  ).length;
  const totalStudents = courses.reduce(
    (total, course) =>
      total +
      course.purchases.filter((p) => p.paymentStatus === "completed").length,
    0
  );
  const totalRevenue = courses.reduce((total, course) => {
    const completedPurchases = course.purchases.filter(
      (p) => p.paymentStatus === "completed"
    ).length;
    return total + completedPurchases * (course.price || 0);
  }, 0);
  const activeLiveSessions = courses.reduce(
    (total, course) => total + course.liveSessions.length,
    0
  );

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = totalCourses - publishedCount;
  const topCoursesByStudents = courses.slice(0, 6).map((c) => ({
    title: c.title,
    students: c.purchases.filter((p) => p.paymentStatus === "completed").length,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {user.name}! Manage your courses and students.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/teacher/courses/create">
              <BookOpen className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
          {activeLiveSessions > 0 && (
            <Button variant="destructive" asChild>
              <Link href="/teacher/courses">
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
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <IconBadge icon={BookOpen} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {publishedCourses} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <IconBadge icon={Users} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IconBadge icon={DollarSign} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From course sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
            <IconBadge icon={Video} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLiveSessions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Course Publication Status */}
        <DoughnutChart
          labels={["Published", "Draft"]}
          data={[publishedCount, Math.max(draftCount, 0)]}
        />

        {/* Right: Students per Course */}
        <BarChart
          title="Students per Course"
          labels={topCoursesByStudents.map((c) => c.title)}
          data={topCoursesByStudents.map((c) => c.students)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/teacher/courses">
                <BookOpen className="w-8 h-8 mb-2" />
                Manage Courses
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/teacher/analytics">
                <TrendingUp className="w-8 h-8 mb-2" />
                View Analytics
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-24 flex-col">
              <Link href="/teacher/announcements">
                <Bell className="w-8 h-8 mb-2" />
                Announcements
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recent Courses
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/teacher/courses">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                No courses yet
              </h3>
              <p className="text-slate-500 mb-4">
                Create your first course to start teaching!
              </p>
              <Button asChild>
                <Link href="/teacher/courses/create">
                  Create Your First Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{course.chapters.length} chapters</span>
                        <span>•</span>
                        <span>{course._count.purchases} students</span>
                        <span>•</span>
                        {course.isPublished ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.liveSessions.length > 0 && (
                      <Badge variant="destructive">Live</Badge>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/teacher/courses/${course.id}`}>Manage</Link>
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

export default TeacherDashboardPage;
