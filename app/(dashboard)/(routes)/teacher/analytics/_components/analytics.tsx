"use client";

import { useEffect, useState } from "react";
import { OverviewChart } from "./overview-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Library, 
  MessageSquare, 
  Award,
  BookOpen,
  Clock,
  Target,
  Eye
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FaUser } from "react-icons/fa";
import { SkeletonLoader } from "./skeleton-loader";

type RecentStudent = {
  name: string;
  courseTitle: string;
  date: string;
  image: string;
};

type RecentReview = {
  id: string;
  studentName: string;
  courseTitle: string;
  rating: number;
  review: string;
  date: string;
};

type EarningsData = {
  month: string;
  earnings: number;
};

type AnalyticsData = {
  totalCourses: number;
  totalStudents: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  enrollments: any[];
  recentStudents: RecentStudent[];
  recentReviews: RecentReview[];
  earningsData: EarningsData[];
  topPerformingCourses: any[];
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch comprehensive analytics data
        const [
          overviewResponse,
          studentsResponse,
          enrollmentsResponse,
          reviewsResponse,
          earningsResponse
        ] = await Promise.all([
          fetch('/api/teacher/analytics/summary'),
          fetch('/api/teacher/analytics/recent-students'),
          fetch('/api/teacher/analytics/enrollments'),
          fetch('/api/teacher/analytics/reviews'),
          fetch('/api/teacher/analytics/earnings')
        ]);

        const [
          overviewData,
          studentsData,
          enrollmentsData,
          reviewsData,
          earningsData
        ] = await Promise.all([
          overviewResponse.json(),
          studentsResponse.json(),
          enrollmentsResponse.json(),
          reviewsResponse.json(),
          earningsResponse.json()
        ]);

        setData({
          ...overviewData,
          recentStudents: studentsData.recentStudents || [],
          enrollments: enrollmentsData.enrollments || [],
          recentReviews: reviewsData.recentReviews || [],
          earningsData: earningsData.monthlyEarnings || [],
          topPerformingCourses: earningsData.topCourses || []
        });
      } catch (error) {
        console.error('Failed to fetch analytics data', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your teaching performance and earnings
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Updated {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data?.totalEarnings?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +${data?.monthlyEarnings || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data?.enrollments?.length?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data?.totalCourses || 0} courses
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
              {data?.averageRating?.toFixed(1) || "0.0"}
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              From {data?.totalReviews || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data?.completionRate || 0}%
            </div>
            <Progress 
              value={data?.completionRate || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {/* Enrollments Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Enrollment Trends
            </CardTitle>
            <CardDescription>
              Monthly enrollment data for your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewChart data={data?.enrollments || []} />
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data?.recentStudents?.slice(0, 5).map((student, index) => (
              <div key={index} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={student.image} alt="Avatar" />
                  <AvatarFallback><FaUser className="text-white" /></AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {student.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.courseTitle}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">{student.date}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews and Performance */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Reviews & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentReviews?.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{review.studentName}</p>
                    <p className="text-xs text-muted-foreground">{review.courseTitle}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">&ldquo;{review.review}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.topPerformingCourses?.slice(0, 4).map((course, index) => (
              <div key={course.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{course.title}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {course.enrollments} students
                    </span>
                    <span className="text-xs font-medium text-green-600">
                      ${course.earnings}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs">{course.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
