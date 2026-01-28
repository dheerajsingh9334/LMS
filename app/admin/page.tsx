import { redirect } from "next/navigation";
import { UserRole, UserType } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminGlobalAnnouncementForm } from "./_components/admin-global-announcement-form";
import { AdminDashboardCharts } from "./_components/admin-dashboard-charts";
import DoughnutChart from "@/app/(dashboard)/_components/doughnutChart";
import BarChart from "@/app/(dashboard)/_components/barChart";
import LineChart from "@/app/(dashboard)/_components/lineChart";
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  TrendingUp,
} from "lucide-react";

const AdminPage = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/login");
  }

  if (user.role !== UserRole.ADMIN) {
    return redirect("/dashboard");
  }

  const [
    totalUsers,
    totalCourses,
    totalTeachers,
    totalStudents,
    recentUsers,
    recentCourses,
    purchases,
    categories,
    coursesWithCategory,
    coursesRevenue,
    teachersRevenue,
  ] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.user.count({ where: { userType: UserType.TEACHER } }),
    db.user.count({ where: { userType: UserType.STUDENT } }),
    db.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userType: true,
      },
    }),
    db.course.findMany({
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.purchase.findMany({
      where: {
        paymentStatus: "completed",
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    db.category.findMany({
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true,
          },
        },
      },
    }),
    db.course.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        categoryId: true,
        purchases: {
          select: {
            userId: true,
          },
        },
      },
    }),
    // Revenue by course
    db.course.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        purchases: {
          where: {
            paymentStatus: "completed",
          },
          select: {
            amount: true,
          },
        },
      },
    }),
    // Revenue by teacher
    db.user.findMany({
      where: {
        userType: UserType.TEACHER,
      },
      select: {
        id: true,
        name: true,
        courses: {
          where: {
            isPublished: true,
          },
          select: {
            purchases: {
              where: {
                paymentStatus: "completed",
              },
              select: {
                amount: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const roleDistribution = [totalTeachers, totalStudents];

  const monthlyMap = new Map<
    string,
    { year: number; month: number; enrollments: number; revenue: number }
  >();

  purchases.forEach((p) => {
    const date = new Date(p.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    const existing = monthlyMap.get(key) ?? {
      year,
      month,
      enrollments: 0,
      revenue: 0,
    };

    existing.enrollments += 1;
    existing.revenue += p.amount || 0;

    monthlyMap.set(key, existing);
  });

  const monthlyStats = Array.from(monthlyMap.values()).sort((a, b) => {
    if (a.year === b.year) return a.month - b.month;
    return a.year - b.year;
  });

  const monthlyLabels = monthlyStats.map((s) =>
    new Date(s.year, s.month, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    }),
  );
  const monthlyEnrollments = monthlyStats.map((s) => s.enrollments);
  const monthlyRevenue = monthlyStats.map((s) => s.revenue);

  const cumulativeRevenue: number[] = [];
  monthlyRevenue.reduce((acc, val) => {
    const next = acc + val;
    cumulativeRevenue.push(next);
    return next;
  }, 0);

  // Process category data for pie chart
  const categoryMap = new Map<string, number>();
  categories.forEach((cat) => {
    categoryMap.set(cat.name, cat.courses.length);
  });
  const categoryLabels = Array.from(categoryMap.keys());
  const categoryData = Array.from(categoryMap.values());

  // Process student enrollment by category for pie chart
  const studentEnrollmentByCategory = new Map<string, Set<string>>();
  coursesWithCategory.forEach((course) => {
    const category = categories.find((c) => c.id === course.categoryId);
    if (category) {
      const enrollmentSet =
        studentEnrollmentByCategory.get(category.name) || new Set<string>();
      course.purchases.forEach((purchase) => {
        enrollmentSet.add(purchase.userId);
      });
      studentEnrollmentByCategory.set(category.name, enrollmentSet);
    }
  });

  const studentCategoryLabels = Array.from(studentEnrollmentByCategory.keys());
  const studentCategoryData = Array.from(
    studentEnrollmentByCategory.values(),
  ).map((set) => set.size);

  // Process revenue by course
  const courseRevenueData = coursesRevenue
    .map((course) => {
      const totalRevenue = course.purchases.reduce(
        (sum, purchase) => sum + (purchase.amount || 0),
        0,
      );
      return {
        courseName: course.title,
        revenue: totalRevenue,
      };
    })
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10 courses

  const courseRevenueLabels = courseRevenueData.map((c) => c.courseName);
  const courseRevenueValues = courseRevenueData.map((c) => c.revenue);

  // Process revenue by teacher
  const teacherRevenueData = teachersRevenue
    .map((teacher) => {
      const totalRevenue = teacher.courses.reduce((sum, course) => {
        const courseRevenue = course.purchases.reduce(
          (pSum, purchase) => pSum + (purchase.amount || 0),
          0,
        );
        return sum + courseRevenue;
      }, 0);
      return {
        teacherName: teacher.name || "Unknown",
        revenue: totalRevenue,
      };
    })
    .filter((t) => t.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Top 10 teachers

  const teacherRevenueLabels = teacherRevenueData.map((t) => t.teacherName);
  const teacherRevenueValues = teacherRevenueData.map((t) => t.revenue);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          High-level overview of platform activity, growth, and content. Use
          this panel to quickly understand how your LMS is performing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTeachers} teachers · {totalStudents} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average of{" "}
              {totalUsers && totalCourses
                ? (totalCourses / totalUsers).toFixed(2)
                : 0}{" "}
              courses per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCourses && totalTeachers
                ? `${Math.round(totalCourses / totalTeachers)} courses per teacher`
                : "Instructor base"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Growing learner community across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DoughnutChart
          labels={["Teachers", "Students"]}
          data={roleDistribution}
        />

        <LineChart
          title="New Enrollments Over Time"
          labels={monthlyLabels}
          data={monthlyEnrollments}
        />
      </div>

      {monthlyLabels.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart
            title="Monthly Revenue (Completed Payments ₹)"
            labels={monthlyLabels}
            data={monthlyRevenue}
            isCurrency
          />

          <LineChart
            title="Cumulative Revenue Growth (₹)"
            labels={monthlyLabels}
            data={cumulativeRevenue}
            isCurrency
          />
        </div>
      )}

      {/* Pie Charts for Categories and Students with Filters */}
      <AdminDashboardCharts
        categoryLabels={categoryLabels}
        categoryData={categoryData}
        studentCategoryLabels={studentCategoryLabels}
        studentCategoryData={studentCategoryData}
      />

      {/* Revenue by Course and Teacher */}
      {courseRevenueLabels.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart
            title="Top 10 Courses by Revenue (₹)"
            labels={courseRevenueLabels}
            data={courseRevenueValues}
            isCurrency
          />

          {teacherRevenueLabels.length > 0 && (
            <BarChart
              title="Top 10 Teachers by Revenue (₹)"
              labels={teacherRevenueLabels}
              data={teacherRevenueValues}
              isCurrency
            />
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>{u.email || "-"}</TableCell>
                    <TableCell>{u.role || "USER"}</TableCell>
                    <TableCell>{u.userType || "STUDENT"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>
                      {course.user?.name || course.user?.email || "-"}
                    </TableCell>
                    <TableCell>{course.isPublished ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AdminGlobalAnnouncementForm />
    </div>
  );
};

export default AdminPage;
