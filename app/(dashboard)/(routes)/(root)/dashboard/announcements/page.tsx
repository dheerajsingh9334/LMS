import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Bell, Calendar, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

const AnnouncementsPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Get all courses the user has purchased
  const purchases = await db.purchase.findMany({
    where: {
      userId: userId,
    },
    select: {
      courseId: true,
    }
  });

  const courseIds = purchases.map(p => p.courseId);

  // Get all announcements from purchased courses
  const announcements = await db.announcement.findMany({
    where: {
      courseId: {
        in: courseIds
      },
    },
    include: {
      course: {
        select: {
          title: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAnnouncements = announcements.filter(a => {
    const created = new Date(a.createdAt);
    created.setHours(0, 0, 0, 0);
    return created.getTime() === today.getTime();
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-7 w-7" />
          Announcements
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Stay updated with course announcements
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
          <Bell className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{announcements.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {todayAnnouncements.length} new today
          </p>
        </CardContent>
      </Card>

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const isToday = todayAnnouncements.some(a => a.id === announcement.id);
            
            return (
              <Card key={announcement.id} className={isToday ? 'border-blue-200 dark:border-blue-900' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Announcement</CardTitle>
                        {isToday && <Badge variant="default">New</Badge>}
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {announcement.course.title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.createdAt), 'PPP')}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Posted on {format(new Date(announcement.createdAt), 'PPP')}
                    </p>
                    <Link 
                      href={`/courses/${announcement.courseId}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View Course →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Bell className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No announcements yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Announcements from your courses will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnouncementsPage;
