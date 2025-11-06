"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import to avoid SSR issues with Agora SDK
const TeacherLiveStreamComponent = dynamic(
  () => import("./teacher-live-stream"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Initializing stream...</p>
        </div>
      </div>
    ),
  }
);

interface TeacherLiveStreamWrapperProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  onEnd?: () => void;
}

export const TeacherLiveStreamWrapper = (props: TeacherLiveStreamWrapperProps) => {
  return <TeacherLiveStreamComponent {...props} />;
};

export default TeacherLiveStreamWrapper;