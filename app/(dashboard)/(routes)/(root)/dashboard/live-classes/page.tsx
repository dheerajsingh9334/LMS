import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Video, Calendar, Users, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

const LiveClassesPage = async () => {
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

  // Get all live sessions from purchased courses
  const liveSessions = await db.liveSession.findMany({
    where: {
      courseId: {
        in: courseIds
      },
    },
    include: {
      course: {
        select: {
          title: true,
          imageUrl: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  const liveSessions_active = liveSessions.filter(s => s.isLive);
  const pastSessions = liveSessions.filter(s => !s.isLive && s.endedAt);
  const upcomingSessions = liveSessions.filter(s => !s.isLive && !s.endedAt);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Join live sessions and view recordings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <PlayCircle className="h-4 w-4 text-red-600 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveSessions_active.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past</CardTitle>
            <Video className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastSessions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Now */}
      {liveSessions_active.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-4">
            {liveSessions_active.map((session) => (
              <Card key={session.id} className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription>{session.course.title}</CardDescription>
                    </div>
                    <Badge className="bg-red-600 animate-pulse">● LIVE</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {session.description || 'No description'}
                    </div>
                    <Button asChild className="bg-red-600 hover:bg-red-700">
                      <Link href={`/courses/${session.courseId}/live/${session.id}`}>
                        Join Now →
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
          <div className="grid gap-4">
            {upcomingSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription>{session.course.title}</CardDescription>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(session.createdAt), 'PPP p')}
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/courses/${session.courseId}`}>
                        View Course →
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Past Sessions</h2>
          <div className="grid gap-4">
            {pastSessions.slice(0, 10).map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription>{session.course.title}</CardDescription>
                    </div>
                    <Badge variant="secondary">Ended</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ended: {session.endedAt ? format(new Date(session.endedAt), 'PPP') : 'Recently'}
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/courses/${session.courseId}`}>
                        View Course →
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {liveSessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Video className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No live classes yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Check back later for scheduled sessions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveClassesPage;
