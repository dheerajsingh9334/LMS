"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Dynamically import to avoid SSR issues with Agora SDK
const StudentLiveViewer = dynamic(
  () => import("@/components/live/student-live-viewer"),
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

interface StudentLiveViewerWrapperProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
}

const StudentLiveViewerWrapper = ({
  courseId,
  liveSessionId,
  channelName,
}: StudentLiveViewerWrapperProps) => {
  const router = useRouter();

  const handleClose = () => {
    router.push(`/courses/${courseId}`);
  };

  return (
    <StudentLiveViewer
      courseId={courseId}
      liveSessionId={liveSessionId}
      channelName={channelName}
      onClose={handleClose}
    />
  );
};

export default StudentLiveViewerWrapper;
export { StudentLiveViewerWrapper };
