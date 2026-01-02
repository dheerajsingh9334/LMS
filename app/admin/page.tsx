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
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of users and courses. Extend this page with more controls as
          needed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCourses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTeachers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStudents}</p>
          </CardContent>
        </Card>
      </div>

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
