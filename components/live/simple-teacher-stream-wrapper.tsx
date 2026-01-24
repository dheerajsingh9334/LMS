"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const SimpleTeacherStreamComponent = dynamic(
  () => import("./simple-teacher-stream"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Initializing stream...</p>
          <p className="text-slate-400 text-sm mt-2">Setting up your camera and microphone</p>
        </div>
      </div>
    ),
  }
);

interface SimpleTeacherStreamWrapperProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  title?: string;
  onEnd?: () => void;
  onExit?: () => void;
}

export const SimpleTeacherStreamWrapper = (props: SimpleTeacherStreamWrapperProps) => {
  return <SimpleTeacherStreamComponent {...props} />;
};

export default SimpleTeacherStreamWrapper;