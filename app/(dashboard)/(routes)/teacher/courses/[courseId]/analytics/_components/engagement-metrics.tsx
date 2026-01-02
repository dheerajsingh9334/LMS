"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface EngagementMetricsProps {
  totalWatchTime: number;
  averageProgress: number;
  videoCompletionRate: number;
}

export const EngagementMetrics = ({
  totalWatchTime,
  averageProgress,
  videoCompletionRate,
}: EngagementMetricsProps) => {
  // Format watch time to hours and minutes
  const hours = Math.floor(totalWatchTime / 60);
  const minutes = Math.round(totalWatchTime % 60);
  const watchTimeText = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Total Watch Time</p>
            <p className="text-2xl font-bold">{watchTimeText}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Average Progress</p>
            <p className="text-sm font-semibold">{averageProgress.toFixed(1)}%</p>
          </div>
          <Progress value={averageProgress} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Video Completion Rate</p>
            <p className="text-sm font-semibold">{videoCompletionRate.toFixed(1)}%</p>
          </div>
          <Progress value={videoCompletionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
