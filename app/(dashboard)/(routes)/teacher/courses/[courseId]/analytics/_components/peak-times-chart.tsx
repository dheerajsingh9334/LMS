"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock } from "lucide-react";

interface PeakTimesChartProps {
  peakTimes: {
    hour: number;
    count: number;
  }[];
}

export const PeakTimesChart = ({ peakTimes }: PeakTimesChartProps) => {
  // Format hours as readable time (e.g., "9 AM", "2 PM")
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const formattedData = peakTimes
    .sort((a, b) => a.hour - b.hour)
    .map(point => ({
      time: formatHour(point.hour),
      students: point.count,
    }));

  // Find peak hour for highlighting
  const maxCount = Math.max(...peakTimes.map(p => p.count));
  const peakHour = peakTimes.find(p => p.count === maxCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Peak Learning Times
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          When students are most active
          {peakHour && ` • Peak: ${formatHour(peakHour.hour)}`}
        </p>
      </CardHeader>
      <CardContent>
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" fill="#3b82f6" name="Active Students" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-500">
            <p>No activity data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
