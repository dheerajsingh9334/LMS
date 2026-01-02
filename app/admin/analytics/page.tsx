"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { UserRole } from "@prisma/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import {
  BarChart2,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { RoleProtectedPage } from "@/components/auth/role-protected-page";

interface TopCourse {
  id: string;
  title: string;
  isPublished: boolean;
  enrollments: number;
  revenue: number;
  avgRating: number;
}

interface AdminAnalyticsData {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  activeCourses: number;
  totalPurchases: number;
  totalEnrollments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  completionRate: number;
  topCourses: TopCourse[];
  courseEarnings: {
    id: string;
    title: string;
    isPublished: boolean;
    instructorId: string | null;
    instructorName: string;
    enrollments: number;
    revenue: number;
    avgRating: number;
  }[];
  teacherEarnings: {
    teacherId: string;
    teacherName: string;
    revenue: number;
    enrollments: number;
  }[];
}

const AdminAnalyticsPageInner = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "unpublished"
  >("all");
  const [sortBy, setSortBy] = useState<"enrollments" | "revenue">(
    "enrollments"
  );
  const [teacherSortBy, setTeacherSortBy] = useState<"revenue" | "enrollments">(
    "revenue"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/admin/analytics/summary");
        setData(res.data);
      } catch (error) {
        console.error("Failed to load admin analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="p-6">No analytics data available.</div>;
  }

  const filteredCourses = [...data.topCourses]
    .filter((course) => {
      if (statusFilter === "published") return course.isPublished;
      if (statusFilter === "unpublished") return !course.isPublished;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "enrollments") {
        return b.enrollments - a.enrollments;
      }
      return b.revenue - a.revenue;
    });

  const sortedCourseEarnings = [...data.courseEarnings].sort(
    (a, b) => b.revenue - a.revenue
  );

  const sortedTeacherEarnings = [...data.teacherEarnings].sort((a, b) => {
    if (teacherSortBy === "revenue") {
      return b.revenue - a.revenue;
    }
    return b.enrollments - a.enrollments;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Global overview of users, courses, and revenue.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalTeachers} teachers, {data.totalStudents} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeCourses} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalEnrollments} paid enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(data.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.completionRate}% completion rate overall
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Top Courses</CardTitle>
            <CardDescription>
              Courses ranked by enrollments and revenue.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "published" | "unpublished"
                )
              }
              className="border bg-background px-2 py-1 rounded-md"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "enrollments" | "revenue")
              }
              className="border bg-background px-2 py-1 rounded-md"
            >
              <option value="enrollments">Sort by enrollments</option>
              <option value="revenue">Sort by revenue</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No course data available yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg. Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      {course.title}
                    </TableCell>
                    <TableCell>
                      {course.isPublished ? "Published" : "Unpublished"}
                    </TableCell>
                    <TableCell>{course.enrollments}</TableCell>
                    <TableCell>{formatPrice(course.revenue)}</TableCell>
                    <TableCell>{course.avgRating.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            Revenue by Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCourseEarnings.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left">Course</th>
                  <th className="py-2 text-left">Instructor</th>
                  <th className="py-2 text-right">Enrollments</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedCourseEarnings.map((course) => (
                  <tr key={course.id} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-medium truncate max-w-[220px]">
                        {course.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {course.isPublished ? "Published" : "Unpublished"}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="text-sm">{course.instructorName}</div>
                    </td>
                    <td className="py-2 text-right">{course.enrollments}</td>
                    <td className="py-2 text-right">
                      $ {course.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No revenue data available by course yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            Revenue by Teacher
          </CardTitle>
          <select
            className="border rounded-md px-2 py-1 text-xs"
            value={teacherSortBy}
            onChange={(e) =>
              setTeacherSortBy(e.target.value as "revenue" | "enrollments")
            }
          >
            <option value="revenue">Sort by revenue</option>
            <option value="enrollments">Sort by enrollments</option>
          </select>
        </CardHeader>
        <CardContent>
          {sortedTeacherEarnings.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left">Teacher</th>
                  <th className="py-2 text-right">Enrollments</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeacherEarnings.map((teacher) => (
                  <tr
                    key={teacher.teacherId}
                    className="border-b last:border-0"
                  >
                    <td className="py-2">
                      <div className="text-sm">{teacher.teacherName}</div>
                    </td>
                    <td className="py-2 text-right">{teacher.enrollments}</td>
                    <td className="py-2 text-right">
                      $ {teacher.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No revenue data available by teacher yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AdminAnalyticsPage = () => {
  return (
    <RoleProtectedPage allowedRole={UserRole.ADMIN}>
      <AdminAnalyticsPageInner />
    </RoleProtectedPage>
  );
};

export default AdminAnalyticsPage;
