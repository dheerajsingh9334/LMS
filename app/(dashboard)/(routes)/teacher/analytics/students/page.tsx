"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  Clock, 
  Target,
  BookOpen,
  TrendingUp,
  Award,
  Calendar
} from "lucide-react";
import { FaUser } from "react-icons/fa";

interface StudentData {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageTimeSpent: string;
  monthlyEnrollments: number;
  recentStudents: Array<{
    name: string;
    courseTitle: string;
    date: string;
    image: string;
    progress: number;
    status: string;
  }>;
  topPerformingStudents: Array<{
    name: string;
    coursesCompleted: number;
    totalTime: string;
    averageScore: number;
  }>;
  enrollmentTrends: Array<{
    month: string;
    enrollments: number;
  }>;
}

export default function StudentsPage() {
  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsResponse, summaryResponse, enrollmentsResponse] = await Promise.all([
          fetch('/api/teacher/analytics/recent-students'),
          fetch('/api/teacher/analytics/summary'),
          fetch('/api/teacher/analytics/enrollments')
        ]);

        const [studentsData, summaryData, enrollmentsData] = await Promise.all([
          studentsResponse.json(),
          summaryResponse.json(),
          enrollmentsResponse.json()
        ]);

        // Mock additional data (you can implement actual calculations)
        const topPerformingStudents = [
          { name: "Alice Johnson", coursesCompleted: 3, totalTime: "45h 30m", averageScore: 94 },
          { name: "Bob Smith", coursesCompleted: 2, totalTime: "32h 15m", averageScore: 89 },
          { name: "Carol Williams", coursesCompleted: 4, totalTime: "67h 45m", averageScore: 92 },
        ];

        setData({
          totalStudents: summaryData.totalEnrollments || 0,
          activeStudents: Math.floor((summaryData.totalEnrollments || 0) * 0.75), // Mock calculation
          completionRate: summaryData.completionRate || 0,
          averageTimeSpent: summaryData.avgTimeSpent || "0 min",
          monthlyEnrollments: summaryData.monthlyEnrollments || 0,
          recentStudents: studentsData.recentStudents?.map((student: any) => ({
            ...student,
            progress: Math.floor(Math.random() * 100), // Mock progress
            status: Math.random() > 0.5 ? 'Active' : 'Completed'
          })) || [],
          topPerformingStudents,
          enrollmentTrends: enrollmentsData.enrollments || []
        });
      } catch (error) {
        console.error('Failed to fetch students data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading students data...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Analytics</h1>
          <p className="text-muted-foreground">
            Track student engagement and performance
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          {data?.activeStudents || 0} Active Students
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data?.totalStudents || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              All-time enrollments
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data?.activeStudents || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Currently learning
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {data?.completionRate || 0}%
            </div>
            <Progress value={data?.completionRate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              +{data?.monthlyEnrollments || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentStudents?.slice(0, 6).map((student, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.image} alt="Avatar" />
                  <AvatarFallback><FaUser className="text-white" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{student.name}</p>
                    <Badge 
                      variant={student.status === 'Active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {student.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{student.courseTitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={student.progress} className="flex-1 h-1" />
                    <span className="text-xs text-muted-foreground">
                      {student.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Performing Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.topPerformingStudents?.map((student, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-gray-900">{student.coursesCompleted}</p>
                      <p>Completed</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.totalTime}</p>
                      <p>Study Time</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-600">{student.averageScore}%</p>
                      <p>Avg Score</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Student Engagement Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Learning Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Session Time</span>
              <span className="font-semibold">{data?.averageTimeSpent || "0 min"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Daily Active Students</span>
              <span className="font-semibold">{Math.floor((data?.activeStudents || 0) * 0.6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Weekly Retention</span>
              <span className="font-semibold text-green-600">78%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Course Completion Time</span>
              <span className="font-semibold">2.3 weeks avg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Beginner Level</span>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Intermediate Level</span>
                  <span className="text-sm text-muted-foreground">35%</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Advanced Level</span>
                  <span className="text-sm text-muted-foreground">20%</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Assignment Submission</span>
              <span className="font-semibold text-green-600">92%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Discussion Participation</span>
              <span className="font-semibold">67%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Quiz Performance</span>
              <span className="font-semibold text-blue-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Video Watch Rate</span>
              <span className="font-semibold">89%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}