import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { Bell, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CourseAnnouncementsPage = async ({
  params
}: {
  params: { courseId: string }
}) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Check if user has purchased the course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: userId,
        courseId: params.courseId,
      }
    }
  });

  if (!purchase) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    select: {
      title: true,
    }
  });

  // Get all announcements for this course
  const announcements = await db.announcement.findMany({
    where: {
      courseId: params.courseId,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Announcements
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{course?.title}</p>
        </div>

        {/* Announcements List */}
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const announcementDate = new Date(announcement.createdAt);
              announcementDate.setHours(0, 0, 0, 0);
              const isToday = announcementDate.getTime() === today.getTime();
              
              return (
                <Card key={announcement.id} className={isToday ? 'border-blue-200 dark:border-blue-900' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Announcement</CardTitle>
                          {isToday && <Badge variant="default">New</Badge>}
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.createdAt), 'PPP p')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Posted on {format(new Date(announcement.createdAt), 'PPP')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                No announcements yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Check back later for course updates and announcements
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default CourseAnnouncementsPage;
