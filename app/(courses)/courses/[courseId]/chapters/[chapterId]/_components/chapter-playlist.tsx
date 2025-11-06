"use client";

import { useRouter, usePathname } from "next/navigation";
import { VideoPlaylist } from "@/components/video-playlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Chapter {
  id: string;
  title: string;
  position: number;
  duration?: number;
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface ChapterPlaylistProps {
  chapters: Chapter[];
  courseId: string;
  currentChapterId: string;
  courseProgress: number;
}

export const ChapterPlaylist = ({
  chapters,
  courseId,
  currentChapterId,
  courseProgress,
}: ChapterPlaylistProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const playlistItems = chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    duration: chapter.duration || 600, // Default 10 minutes if not set
    isCompleted: chapter.isCompleted || false,
    isLocked: chapter.isLocked || false,
    isCurrent: chapter.id === currentChapterId,
  }));

  const handleChapterClick = (chapterId: string) => {
    router.push(`/courses/${courseId}/chapters/${chapterId}`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Course Content</CardTitle>
      </CardHeader>
      <CardContent>
        <VideoPlaylist
          items={playlistItems}
          onItemClick={handleChapterClick}
          totalProgress={courseProgress}
        />
      </CardContent>
    </Card>
  );
};
