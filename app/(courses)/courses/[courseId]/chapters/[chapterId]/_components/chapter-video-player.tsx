"use client";

import { VideoPlayerWithNotes } from "@/components/video-player-with-notes";
import { useParams } from "next/navigation";

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
  onChapterComplete
}: ChapterVideoPlayerProps) => {
  const params = useParams() as { courseId: string; chapterId: string };

  const handleVideoEnded = () => {
    if (completeOnEnd && onChapterComplete) {
      // Mark chapter as completed
      // This should be handled by the progress tracking
      onChapterComplete();
    }
  };

  const handleVideoProgress = (progress: number) => {
    // Track video progress
    console.log(`Video progress: ${progress}%`);
  };

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