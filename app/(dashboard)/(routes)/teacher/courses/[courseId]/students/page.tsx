import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar, CheckCircle, Clock } from "lucide-react";

const StudentsPage = async ({ params }: { params: { courseId: string } }) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId: user.id,
    },
    include: {
      purchases: {
        orderBy: {
          createdAt: "desc",
        },
      },
      chapters: {
        include: {
          userProgress: {
            select: {
              userId: true,
              isCompleted: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  // Fetch user details for all enrolled students
  const userIds = course.purchases.map((p) => p.userId);
  const users = await db.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  const usersMap = new Map(users.map((u) => [u.id, u]));

  const enrolledStudents = course.purchases.map((purchase) => {
    const totalChapters = course.chapters.length;
    const completedChapters = course.chapters.filter((chapter) =>
      chapter.userProgress.some(
        (progress) =>
          progress.userId === purchase.userId && progress.isCompleted,
      ),
    ).length;

    const progressPercentage =
      totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    const studentUser = usersMap.get(purchase.userId);

    return {
      id: purchase.userId,
      name: studentUser?.name || "Unknown",
      email: studentUser?.email || "",
      image: studentUser?.image,
      enrolledAt: purchase.createdAt,
      progress: progressPercentage,
      completedChapters,
      totalChapters,
    };
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Enrolled Students
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          View and manage students enrolled in {course.title}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Course Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Students
                </p>
                <p className="text-2xl font-bold">{enrolledStudents.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Avg. Progress
                </p>
                <p className="text-2xl font-bold">
                  {enrolledStudents.length > 0
                    ? Math.round(
                        enrolledStudents.reduce(
                          (acc, s) => acc + s.progress,
                          0,
                        ) / enrolledStudents.length,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Chapters
                </p>
                <p className="text-2xl font-bold">{course.chapters.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {enrolledStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No students enrolled yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-center">
              Students will appear here once they enroll in your course
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              {enrolledStudents.length} student
              {enrolledStudents.length !== 1 ? "s" : ""} enrolled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.image || ""} />
                      <AvatarFallback>
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{student.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        Enrolled {student.enrolledAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        student.progress === 100
                          ? "default"
                          : student.progress > 50
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {Math.round(student.progress)}% Complete
                    </Badge>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {student.completedChapters} / {student.totalChapters}{" "}
                      chapters
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentsPage;
