import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

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
import { AdminCourseActions } from "./_components/admin-course-actions";

const AdminCoursesPage = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/login");
  }

  if (user.role !== UserRole.ADMIN) {
    return redirect("/dashboard");
  }

  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>
                    {course.user?.name || course.user?.email || "-"}
                  </TableCell>
                  <TableCell>{course.isPublished ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <AdminCourseActions
                      courseId={course.id}
                      isPublished={course.isPublished}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoursesPage;
