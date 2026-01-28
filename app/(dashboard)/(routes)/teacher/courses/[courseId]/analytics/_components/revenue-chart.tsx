"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IndianRupee, TrendingUp } from "lucide-react";

interface RevenueChartProps {
  dailyRevenue: {
    date: string;
    revenue: number;
  }[];
  dailyEnrollments: {
    date: string;
    count: number;
  }[];
}

export const RevenueChart = ({
  dailyRevenue,
  dailyEnrollments,
}: RevenueChartProps) => {
  // Merge revenue and enrollment data by date
  const mergedData = dailyRevenue.map((rev) => {
    const enrollment = dailyEnrollments.find((enr) => enr.date === rev.date);
    return {
      date: new Date(rev.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: rev.revenue,
      enrollments: enrollment?.count || 0,
    };
  });

  // Calculate totals
  const totalRevenue = dailyRevenue.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  const totalEnrollments = dailyEnrollments.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Revenue & Enrollments
        </CardTitle>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span>Total Revenue: ₹{totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Total Enrollments: {totalEnrollments}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mergedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="enrollments"
                fill="#3b82f6"
                name="Enrollments"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue (₹)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-500">
            <p>No revenue data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
