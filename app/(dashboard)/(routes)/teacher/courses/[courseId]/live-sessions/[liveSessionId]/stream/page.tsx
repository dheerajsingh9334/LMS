import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Agora SDK - Using simplified single-screen version
const SimpleTeacherStreamWrapper = dynamic(
  () => import("@/components/live/simple-teacher-stream-wrapper").then(mod => ({ default: mod.default })),
  { ssr: false }
);

const TeacherLiveStreamPage = async ({
  params
}: {
  params: { courseId: string; liveSessionId: string };
}) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  // Verify user is the course owner
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId: user.id,
    }
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  const liveSession = await db.liveSession.findUnique({
    where: {
      id: params.liveSessionId,
      courseId: params.courseId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      isLive: true,
      courseId: true,
    }
  });

  if (!liveSession) {
    return redirect(`/teacher/courses/${params.courseId}/live-sessions`);
  }

  if (!liveSession.isLive) {
    return (
      <div className="p-6">
        <Banner
          variant="warning"
          label="This live session is not currently active. Please start the session first."
        />
        <div className="mt-4">
          <a 
            href={`/teacher/courses/${params.courseId}/live-sessions`}
            className="text-blue-600 hover:underline"
          >
            ← Back to Live Sessions
          </a>
        </div>
      </div>
    );
  }

  return (
    <SimpleTeacherStreamWrapper
      courseId={params.courseId}
      liveSessionId={params.liveSessionId}
      channelName={params.courseId}
      title={liveSession.title}
      onEnd={() => {
        // Redirect back to live sessions when stream ends
        window.location.href = `/teacher/courses/${params.courseId}/live-sessions`;
      }}
      onExit={() => {
        // Exit without ending stream - go back to live sessions
        window.location.href = `/teacher/courses/${params.courseId}/live-sessions`;
      }}
    />
  );
};

export default TeacherLiveStreamPage;