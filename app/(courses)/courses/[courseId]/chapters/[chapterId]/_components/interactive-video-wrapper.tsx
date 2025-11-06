"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveVideoPlayer } from "@/components/interactive-video-player";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useConfettiStore } from "@/hooks/use-confetti-store";

interface InteractiveVideoWrapperProps {
  url: string;
  title: string;
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
  chapters: { id: string; title: string; timestamp: number }[];
  completeOnEnd: boolean;
  allowDownload?: boolean;
}

export const InteractiveVideoWrapper = ({
  url,
  title,
  courseId,
  chapterId,
  nextChapterId,
  chapters,
  completeOnEnd,
  allowDownload = false,
}: InteractiveVideoWrapperProps) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVideoEnd = async () => {
    try {
      if (completeOnEnd && !isUpdating) {
        setIsUpdating(true);
        
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
          isCompleted: true,
        });

        if (!nextChapterId) {
          confetti.onOpen();
          toast.success("Congratulations! You've completed the course! 🎉");
        } else {
          toast.success("Chapter completed! Moving to next lesson...");
        }

        router.refresh();

        // Navigate to next chapter after a short delay
        if (nextChapterId) {
          setTimeout(() => {
            router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgress = async (progress: number) => {
    // Update progress every 25% milestone
    if (progress % 25 === 0 && progress > 0 && progress < 100) {
      try {
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
          isCompleted: false,
        });
      } catch (error) {
        console.error("Failed to update progress:", error);
      }
    }
  };

  // Use streaming API endpoint for better performance
  const streamUrl = `/api/video/${chapterId}`;

  return (
    <InteractiveVideoPlayer
      url={streamUrl}
      title={title}
      courseId={courseId}
      chapterId={chapterId}
      onEnded={handleVideoEnd}
      onProgress={handleProgress}
      chapters={chapters}
      allowDownload={allowDownload}
      showTranscript={false}
    />
  );
};
