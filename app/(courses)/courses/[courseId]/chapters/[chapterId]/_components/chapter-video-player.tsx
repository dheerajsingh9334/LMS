"use client";

import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { VideoPlayerWithNotes } from "@/components/video-player-with-notes";
import { useParams, useRouter } from "next/navigation";

interface ChapterVideoPlayerProps {
  url: string;
  title: string;
  completeOnEnd: boolean;
  onChapterComplete?: () => void;
}

export const ChapterVideoPlayer = ({
  url,
  title,
  completeOnEnd,
  onChapterComplete,
}: ChapterVideoPlayerProps) => {
  const params = useParams() as { courseId: string; chapterId: string };
  const router = useRouter();
  const hasAutoCompletedRef = useRef(false);

  const handleVideoEnded = async () => {
    if (!completeOnEnd) {
      return;
    }

    try {
      await axios.put(
        `/api/courses/${params.courseId}/chapters/${params.chapterId}/progress`,
        {
          isCompleted: true,
        }
      );

      if (onChapterComplete) {
        onChapterComplete();
      }

      toast.success("Progress updated");
      router.refresh();
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        const message =
          typeof data === "string"
            ? data
            : data?.message || "Something went wrong";
        toast.error(message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleVideoProgress = (progress: number) => {
    // For direct uploaded videos, `progress` is percentage watched.
    // Auto-complete once the user has watched at least 5%.
    if (!completeOnEnd || hasAutoCompletedRef.current) return;

    if (progress >= 5) {
      hasAutoCompletedRef.current = true;
      handleVideoEnded();
    }
  };

  // For YouTube/Vimeo/Dailymotion URLs rendered via iframes, we don't get
  // reliable progress events. As a fallback, mark complete 5 seconds after
  // the player is shown if completion-on-end is enabled.
  useEffect(() => {
    if (!completeOnEnd || hasAutoCompletedRef.current) return;

    const lowerUrl = url.toLowerCase();
    const isEmbedUrl =
      lowerUrl.includes("youtube.com") ||
      lowerUrl.includes("youtu.be") ||
      lowerUrl.includes("vimeo.com") ||
      lowerUrl.includes("dailymotion.com") ||
      lowerUrl.includes("dai.ly");

    if (!isEmbedUrl) return;

    const timer = setTimeout(() => {
      if (!hasAutoCompletedRef.current) {
        hasAutoCompletedRef.current = true;
        handleVideoEnded();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [completeOnEnd, url]);

  return (
    <VideoPlayerWithNotes
      url={url}
      title={title}
      courseId={params.courseId}
      chapterId={params.chapterId}
      onEnded={handleVideoEnded}
      onProgress={handleVideoProgress}
      className="mb-4"
    />
  );
};
