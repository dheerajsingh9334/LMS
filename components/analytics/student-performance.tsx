"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Trophy, TrendingUp } from "lucide-react";
import Image from "next/image";

interface CourseProgress {
  courseId: string;
  title: string;
  imageUrl: string | null;
  totalChapters: number;
  completedChapters: number;
  progress: number;
}

interface RecentActivity {
  quizTitle: string;
  courseTitle: string;
  score: number;
  createdAt: string;
}

interface PerformanceData {
  statistics: {
    totalCourses: number;
    completedCourses: number;
    totalChapters: number;
    completedChapters: number;
    totalQuizzes: number;
    completedQuizzes: number;
    averageQuizScore: number;
  };
  courseProgress: CourseProgress[];
  recentActivity: RecentActivity[];
}

export const StudentPerformance = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await axios.get("/api/student/performance");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching performance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading your performance...</div>;
  }

  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  const stats = data.statistics;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">My Performance</h2>
        <p className="text-gray-600">Track your learning progress and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCourses} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedChapters}/{stats.totalChapters}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalChapters > 0
                ? Math.round((stats.completedChapters / stats.totalChapters) * 100)
                : 0}
              % completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedQuizzes}/{stats.totalQuizzes}
            </div>
            <p className="text-xs text-muted-foreground">
              Total attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageQuizScore}%</div>
            <p className="text-xs text-muted-foreground">
              Quiz performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
          <CardDescription>
            Your progress in each enrolled course
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.courseProgress.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No courses enrolled yet. Start learning today!
            </p>
          ) : (
            data.courseProgress.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <div className="flex items-center gap-4">
                  {course.imageUrl && (
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{course.title}</h4>
                    <p className="text-sm text-gray-600">
                      {course.completedChapters} of {course.totalChapters} chapters completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{course.progress}%</span>
                  </div>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quiz Results</CardTitle>
          <CardDescription>
            Your latest quiz attempts and scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No quiz attempts yet
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{activity.quizTitle}</h4>
                    <p className="text-sm text-gray-600">{activity.courseTitle}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        activity.score >= 70
                          ? "text-green-600"
                          : activity.score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {activity.score}%
                    </div>
                    <p className="text-xs text-gray-500">Score</p>
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
