"use client";

import { useState } from "react";
import { Play, PlayCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterVideo {
  id: string;
  title: string;
  videoUrl: string;
  duration?: number | null;
  position: number;
}

interface VideoPlaylistProps {
  videos: ChapterVideo[];
  currentVideoId?: string;
  onVideoSelect?: (video: ChapterVideo) => void;
  completedVideos?: string[];
}

export const VideoPlaylist = ({
  videos,
  currentVideoId,
  onVideoSelect,
  completedVideos = []
}: VideoPlaylistProps) => {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <PlayCircle className="h-5 w-5" />
        Chapter Videos ({videos.length})
      </h3>
      
      <div className="space-y-2">
        {videos.map((video, index) => {
          const isCompleted = completedVideos.includes(video.id);
          const isCurrent = currentVideoId === video.id;
          
          return (
            <div
              key={video.id}
              onClick={onVideoSelect ? () => onVideoSelect(video) : undefined}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                onVideoSelect && "cursor-pointer",
                isCurrent 
                  ? "bg-blue-50 border-blue-200 border" 
                  : onVideoSelect ? "hover:bg-gray-50 border border-transparent" : "border border-transparent"
              )}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : isCurrent ? (
                  <Play className="h-5 w-5 text-blue-500" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isCurrent ? "text-blue-700" : "text-gray-900"
                )}>
                  {index + 1}. {video.title}
                </p>
                {video.duration && (
                  <p className="text-xs text-gray-500">
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
              
              {isCompleted && (
                <div className="flex-shrink-0">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Completed
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};