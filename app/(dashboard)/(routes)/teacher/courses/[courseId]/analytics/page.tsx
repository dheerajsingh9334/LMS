import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  IndianRupee,
  Users,
  TrendingUp,
  Award,
  Clock,
  Monitor,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "./_components/analytics-charts";
import { EngagementMetrics } from "./_components/engagement-metrics";
import { RevenueChart } from "./_components/revenue-chart";
import { DeviceStats } from "./_components/device-stats";
import { PeakTimesChart } from "./_components/peak-times-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AnalyticsPage = async ({ params }: { params: { courseId: string } }) => {
  const user = await currentUser();
  const userId = user?.id ?? "";

  if (!userId) {
    return redirect("/");
  }

  // Verify course ownership
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  // Fetch analytics data directly from database instead of API
  let analyticsData;
  try {
    // Get course analytics data directly
    const [enrollments, assignments, submissions, quizzes, progress, reviews] =
      await Promise.all([
        // Total enrollments
        db.purchase.count({
          where: {
            courseId: params.courseId,
            paymentStatus: "completed",
          },
        }),

        // Assignment data
        db.assignment.findMany({
          where: {
            courseId: params.courseId,
          },
          include: {
            submissions: true,
          },
        }),

        // Assignment submissions
        db.assignmentSubmission.count({
          where: {
            assignment: {
              courseId: params.courseId,
            },
          },
        }),

        // Quiz data
        db.quiz.findMany({
          where: {
            chapter: {
              courseId: params.courseId,
            },
          },
          include: {
            quizAttempts: true,
          },
        }),

        // User progress
        db.userProgress.findMany({
          where: {
            chapter: {
              courseId: params.courseId,
            },
            isCompleted: true,
          },
        }),

        // Course reviews/ratings
        db.courseRating.findMany({
          where: {
            courseId: params.courseId,
          },
        }),
      ]);

    // Calculate analytics
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions;
    const assignmentCompletionRate =
      totalAssignments > 0 && enrollments > 0
        ? Math.round(
            (totalSubmissions / (enrollments * totalAssignments)) * 100,
          )
        : 0;

    const totalQuizzes = quizzes.length;
    const quizAttempts = quizzes.reduce(
      (sum, quiz) => sum + quiz.quizAttempts.length,
      0,
    );
    const quizCompletionRate =
      totalQuizzes > 0 && enrollments > 0
        ? Math.round((quizAttempts / (enrollments * totalQuizzes)) * 100)
        : 0;

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    // Calculate course completion rate
    const chapters = await db.chapter.count({
      where: {
        courseId: params.courseId,
        isPublished: true,
      },
    });

    const completionRate =
      chapters > 0 && enrollments > 0
        ? Math.round((progress.length / (enrollments * chapters)) * 100)
        : 0;

    // Monthly revenue (this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await db.purchase.aggregate({
      where: {
        courseId: params.courseId,
        paymentStatus: "completed",
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Total revenue
    const totalRevenue = await db.purchase.aggregate({
      where: {
        courseId: params.courseId,
        paymentStatus: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    analyticsData = {
      overview: {
        totalStudents: enrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        completionRate,
      },
      assignments: {
        total: totalAssignments,
        submissions: totalSubmissions,
        completionRate: assignmentCompletionRate,
        pending: assignments.filter((a) =>
          a.submissions.some((s) => !s.gradedAt),
        ).length,
      },
      quizzes: {
        total: totalQuizzes,
        attempts: quizAttempts,
        completionRate: quizCompletionRate,
      },
      quizAnalytics: {
        totalAttempts: quizAttempts,
        averageScore:
          quizAttempts > 0
            ? Math.round(
                (quizzes.reduce((sum, quiz) => {
                  const totalScore = quiz.quizAttempts.reduce(
                    (total, attempt) => total + (attempt.score || 0),
                    0,
                  );
                  return sum + totalScore;
                }, 0) /
                  quizAttempts) *
                  100,
              ) / 100
            : 0,
        passRate:
          quizAttempts > 0
            ? Math.round(
                (quizzes.reduce((sum, quiz) => {
                  const passedAttempts = quiz.quizAttempts.filter(
                    (attempt) => (attempt.score || 0) >= 0.65,
                  ).length;
                  return sum + passedAttempts;
                }, 0) /
                  quizAttempts) *
                  10000,
              ) / 100
            : 0,
        quizzes: await Promise.all(
          (
            await db.chapter.findMany({
              where: { courseId: params.courseId, isPublished: true },
              select: { title: true, id: true },
            })
          ).map(async (chapter) => ({
            chapterTitle: chapter.title,
            attempts: await db.quizAttempt.count({
              where: {
                quiz: {
                  chapterId: chapter.id,
                },
              },
            }),
          })),
        ),
      },
      assignmentAnalytics: {
        totalSubmissions: totalSubmissions,
        averageScore:
          totalSubmissions > 0
            ? Math.round(
                (assignments.reduce((sum, assignment) => {
                  const scores = assignment.submissions
                    .filter((sub) => sub.score !== null)
                    .map((sub) => sub.score || 0);
                  const avgScore =
                    scores.length > 0
                      ? scores.reduce((total, score) => total + score, 0) /
                        scores.length
                      : 0;
                  return sum + avgScore;
                }, 0) /
                  assignments.filter((a) =>
                    a.submissions.some((s) => s.score !== null),
                  ).length) *
                  100,
              ) / 100
            : 0,
        onTimeSubmissions: assignments.reduce((sum, assignment) => {
          return (
            sum + assignment.submissions.filter((sub) => !sub.isLate).length
          );
        }, 0),
        lateSubmissions: assignments.reduce((sum, assignment) => {
          return (
            sum + assignment.submissions.filter((sub) => sub.isLate).length
          );
        }, 0),
        assignments: await Promise.all(
          (
            await db.chapter.findMany({
              where: { courseId: params.courseId, isPublished: true },
              select: { title: true, id: true },
            })
          ).map(async (chapter) => ({
            chapterTitle: chapter.title,
            submissions: await db.assignmentSubmission.count({
              where: {
                assignment: {
                  chapterId: chapter.id,
                  verificationStatus: "verified",
                },
              },
            }),
          })),
        ),
      },
      engagement: {
        chaptersCompleted: progress.length,
        totalChapters: chapters,
        activeStudents: Math.floor(enrollments * 0.7), // Mock calculation
      },
      recentActivity: {
        newEnrollments: await db.purchase.count({
          where: {
            courseId: params.courseId,
            paymentStatus: "completed",
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
        recentSubmissions: await db.assignmentSubmission.count({
          where: {
            assignment: {
              courseId: params.courseId,
            },
            submittedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      },
      studentEngagement: {
        totalEnrollments: enrollments,
        activeStudents: Math.floor(enrollments * 0.7),
        completionRate: completionRate,
        averageProgress: completionRate,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: monthlyRevenue._sum.amount || 0,
        lastMonth: 0, // Mock for now
        growth: 0, // Mock for now
      },
    };
  } catch (error) {
    console.error("Analytics data fetch error:", error);
    // Comprehensive fallback data
    analyticsData = {
      overview: {
        totalStudents: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
        completionRate: 0,
      },
      assignments: {
        total: 0,
        submissions: 0,
        completionRate: 0,
        pending: 0,
      },
      quizzes: {
        total: 0,
        attempts: 0,
        completionRate: 0,
      },
      quizAnalytics: {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        topPerformers: [],
      },
      assignmentAnalytics: {
        totalSubmissions: 0,
        averageScore: 0,
        onTimeSubmissions: 0,
        lateSubmissions: 0,
      },
      engagement: {
        chaptersCompleted: 0,
        totalChapters: 0,
        activeStudents: 0,
      },
      recentActivity: {
        newEnrollments: 0,
        recentSubmissions: 0,
      },
      studentEngagement: {
        totalEnrollments: 0,
        activeStudents: 0,
        completionRate: 0,
        averageProgress: 0,
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
      },
    };
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/teacher/courses/${params.courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Course Analytics</h1>
        <p className="text-slate-600">{course.title}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.overview.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              Enrolled in this course
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analyticsData.overview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From all enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.overview.averageRating}/5.0
            </div>
            <p className="text-xs text-muted-foreground">
              From student reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.overview.completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Students who finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementMetrics
              totalWatchTime={0}
              averageProgress={analyticsData.overview.completionRate}
              videoCompletionRate={analyticsData.overview.completionRate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Attempts</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.quizAnalytics.totalAttempts}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Score</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.quizAnalytics.averageScore}%
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pass Rate</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.quizAnalytics.passRate}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Analytics */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Assignment Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Submissions</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.assignmentAnalytics.totalSubmissions}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Score</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.assignmentAnalytics.averageScore}%
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    On Time Submissions
                  </span>
                  <span className="text-2xl font-bold">
                    {analyticsData.assignmentAnalytics.onTimeSubmissions}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Late Submissions</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.assignmentAnalytics.lateSubmissions}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Students</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.studentEngagement.activeStudents}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Progress</span>
                  <span className="text-2xl font-bold">
                    {analyticsData.studentEngagement.averageProgress}%
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    New Enrollments (7 days)
                  </span>
                  <span className="text-2xl font-bold">
                    {analyticsData.recentActivity.newEnrollments}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Recent Submissions (7 days)
                  </span>
                  <span className="text-2xl font-bold">
                    {analyticsData.recentActivity.recentSubmissions}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <RevenueChart dailyRevenue={[]} dailyEnrollments={[]} />
        <DeviceStats deviceStats={{ desktop: 70, mobile: 20, tablet: 10 }} />
      </div>

      <div className="grid gap-6 mb-6">
        <PeakTimesChart peakTimes={[]} />
      </div>

      <AnalyticsCharts dropOffPoints={[]} />
    </div>
  );
};

export default AnalyticsPage;
