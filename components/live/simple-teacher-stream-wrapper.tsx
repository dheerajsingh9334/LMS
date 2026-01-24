"use client";

import dynamic from "next/dynamic";
import { Loader2, Radio } from "lucide-react";

// Use YouTube-style stream component
const YouTubeStyleStreamComponent = dynamic(
  () => import("./youtube-style-stream"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Radio className="w-12 h-12 text-red-500" />
          </div>
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">Going Live...</p>
          <p className="text-gray-400 mt-2">Setting up your stream</p>
        </div>
      </div>
    ),
  },
);

interface SimpleTeacherStreamWrapperProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  title?: string;
  description?: string;
  teacherName?: string;
  onEnd?: () => void;
  onExit?: () => void;
}

export const SimpleTeacherStreamWrapper = (
  props: SimpleTeacherStreamWrapperProps,
) => {
  return <YouTubeStyleStreamComponent {...props} />;
};

export default SimpleTeacherStreamWrapper;
