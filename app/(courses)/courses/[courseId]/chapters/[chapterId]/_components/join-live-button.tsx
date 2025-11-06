"use client";

import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface JoinLiveClassButtonProps {
  courseId: string;
  liveSessionId: string;
  isLive: boolean;
}

export const JoinLiveClassButton = ({
  courseId,
  liveSessionId,
  isLive
}: JoinLiveClassButtonProps) => {
  const router = useRouter();

  if (!isLive) return null;

  const handleJoinLive = () => {
    router.push(`/courses/${courseId}/live/${liveSessionId}`);
  };

  return (
    <div className="w-full bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-lg shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="text-white font-semibold">Live Class in Progress</span>
        </div>
        <Button
          onClick={handleJoinLive}
          className="bg-white text-red-600 hover:bg-red-50 font-semibold"
        >
          <Video className="w-4 h-4 mr-2" />
          Join Now
        </Button>
      </div>
    </div>
  );
};
