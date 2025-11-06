"use client";

import React, { useState } from "react";
import { Clock, CheckCircle, PlayCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VideoPlaylistItem {
  id: string;
  title: string;
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

interface VideoPlaylistProps {
  items: VideoPlaylistItem[];
  onItemClick: (id: string) => void;
  totalProgress: number;
}

export const VideoPlaylist = ({
  items,
  onItemClick,
  totalProgress,
}: VideoPlaylistProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const completedCount = items.filter((item) => item.isCompleted).length;
  const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-none">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Course Progress</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {items.length} lessons completed
                </p>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {Math.round(totalProgress)}%
              </Badge>
            </div>
            <Progress value={totalProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDuration(totalDuration)} total</span>
              <span>{items.length} lessons</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playlist Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "group relative p-4 rounded-lg border transition-all cursor-pointer",
              item.isCurrent
                ? "bg-primary/10 border-primary shadow-md"
                : "hover:bg-accent hover:border-accent-foreground/20",
              item.isLocked && "opacity-60 cursor-not-allowed"
            )}
            onClick={() => !item.isLocked && onItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="flex items-center gap-3">
              {/* Lesson Number / Status Icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                  item.isCompleted
                    ? "bg-green-500 text-white"
                    : item.isCurrent
                    ? "bg-primary text-primary-foreground"
                    : item.isLocked
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500"
                    : "bg-gray-100 dark:bg-gray-800"
                )}
              >
                {item.isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : item.isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : item.isCurrent ? (
                  <PlayCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className={cn(
                      "font-medium text-sm truncate",
                      item.isCurrent && "text-primary font-semibold"
                    )}
                  >
                    {item.title}
                  </h4>
                  {item.isCompleted && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                      Completed
                    </Badge>
                  )}
                  {item.isCurrent && (
                    <Badge variant="default" className="text-xs animate-pulse">
                      Playing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(item.duration)}</span>
                </div>
              </div>

              {/* Hover Action */}
              {!item.isLocked && hoveredItem === item.id && (
                <Button
                  size="sm"
                  variant={item.isCurrent ? "default" : "outline"}
                  className="flex-shrink-0"
                >
                  {item.isCurrent ? "Continue" : "Play"}
                </Button>
              )}
            </div>

            {/* Current Progress Indicator */}
            {item.isCurrent && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: "45%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
