import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Agora SDK - Using YouTube-style stream
const SimpleTeacherStreamWrapper = dynamic(
  () => import("@/components/live/simple-teacher-stream-wrapper"),
  { ssr: false },
);

const TeacherLiveStreamPage = async ({
  params,
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
    },
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
    },
  });

  if (!liveSession) {
    return redirect(`/teacher/courses/${params.courseId}/live-sessions`);
  }

  if (!liveSession.isLive) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
        <div className="bg-[#1a1a1a] rounded-xl p-8 max-w-md text-center border border-[#303030]">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Session Not Active
          </h2>
          <p className="text-gray-400 mb-6">
            This live session is not currently active. Please start the session
            first.
          </p>
          <a
            href={`/teacher/courses/${params.courseId}/live-sessions`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
      title={liveSession.title || "Live Session"}
      description={
        liveSession.description || `Live streaming session for ${course.title}`
      }
      teacherName={user.name || "Teacher"}
    />
  );
};

export default TeacherLiveStreamPage;
