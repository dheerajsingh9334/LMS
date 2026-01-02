import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/icon-badge";
import { Video, Calendar, Users, Clock, Settings, ArrowLeft } from "lucide-react";
import { Banner } from "@/components/banner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LiveSessionsList } from "./_components/live-sessions-list";
import { CreateLiveSessionForm } from "./_components/create-live-session-form";

const LiveSessionsPage = async ({
  params
}: {
  params: { courseId: string };
}) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  // Get course with live sessions
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId: user.id
    },
    include: {
      liveSessions: {
        orderBy: {
          createdAt: "desc"
        }
      },
      _count: {
        select: {
          purchases: true
        }
      }
    }
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/teacher/courses/${course.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-medium">Live Sessions Management</h1>
              <p className="text-sm text-slate-700">
                Manage live sessions for &quot;{course.title}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="flex items-center gap-x-2 bg-slate-100 border border-slate-200 rounded-md p-3">
            <IconBadge icon={Video} />
            <div>
              <p className="font-medium">Total Sessions</p>
              <p className="text-gray-700 text-sm">{course.liveSessions.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-x-2 bg-slate-100 border border-slate-200 rounded-md p-3">
            <IconBadge icon={Users} />
            <div>
              <p className="font-medium">Enrolled Students</p>
              <p className="text-gray-700 text-sm">{course._count.purchases}</p>
            </div>
          </div>

          <div className="flex items-center gap-x-2 bg-slate-100 border border-slate-200 rounded-md p-3">
            <IconBadge icon={Calendar} />
            <div>
              <p className="font-medium">Active Sessions</p>
              <p className="text-gray-700 text-sm">
                {course.liveSessions.filter(session => session.isLive).length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-x-2 bg-slate-100 border border-slate-200 rounded-md p-3">
            <IconBadge icon={Clock} />
            <div>
              <p className="font-medium">Upcoming Sessions</p>
              <p className="text-gray-700 text-sm">
                {course.liveSessions.filter(session => 
                  !session.isLive && !session.endedAt
                ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create New Live Session */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-x-2 mb-6">
              <IconBadge icon={Settings} />
              <h2 className="text-xl">Create Live Session</h2>
            </div>
            
            <CreateLiveSessionForm courseId={course.id} />
          </div>

          {/* Live Sessions List */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-x-2 mb-6">
              <IconBadge icon={Video} />
              <h2 className="text-xl">Live Sessions History</h2>
            </div>

            <LiveSessionsList 
              courseId={course.id}
              liveSessions={course.liveSessions}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveSessionsPage;