import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Banner } from "@/components/banner";
import { Loader2 } from "lucide-react";

const StudentLiveViewerWrapper = dynamic(
  () => import("./_components/student-live-viewer-wrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading stream...</p>
        </div>
      </div>
    ),
  }
);

const LiveSessionPage = async ({
  params
}: {
  params: { courseId: string; liveSessionId: string };
}) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  // First check if user is the course owner (teacher)
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    select: {
      userId: true,
    }
  });

  // If user is the teacher, redirect to teacher live session page
  if (course && course.userId === user.id) {
    return redirect(`/teacher/courses/${params.courseId}/live-sessions`);
  }

  // Check if user has purchased the course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      }
    }
  });

  if (!purchase) {
    return redirect(`/courses/${params.courseId}/overview`);
  }

  const liveSession = await db.liveSession.findUnique({
    where: {
      id: params.liveSessionId,
      courseId: params.courseId,
    },
    select: {
      id: true,
      title: true,
      isLive: true,
      courseId: true,
    }
  });

  if (!liveSession) {
    return redirect(`/courses/${params.courseId}`);
  }

  if (!liveSession.isLive) {
    return (
      <div className="p-6">
        <Banner
          variant="warning"
          label="This live session has ended."
        />
      </div>
    );
  }

  return (
    <StudentLiveViewerWrapper
      courseId={params.courseId}
      liveSessionId={params.liveSessionId}
      channelName={params.courseId}
    />
  );
};

export default LiveSessionPage;
