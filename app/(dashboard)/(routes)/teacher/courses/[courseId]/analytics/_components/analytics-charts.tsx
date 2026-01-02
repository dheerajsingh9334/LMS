"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown } from "lucide-react";

interface DropOffPoint {
  minute: number;
  count: number;
}

interface AnalyticsChartsProps {
  dropOffPoints: DropOffPoint[];
}

export const AnalyticsCharts = ({ dropOffPoints }: AnalyticsChartsProps) => {
  // Sort and format drop-off data
  const formattedData = dropOffPoints
    .sort((a, b) => a.minute - b.minute)
    .map(point => ({
      time: `${point.minute}min`,
      dropOffs: point.count,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Video Drop-off Points
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Where students stop watching videos
        </p>
      </CardHeader>
      <CardContent>
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="dropOffs" fill="#ef4444" name="Drop-offs" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-500">
            <p>No drop-off data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
