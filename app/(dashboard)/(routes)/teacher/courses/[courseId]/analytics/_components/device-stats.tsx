"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Monitor } from "lucide-react";

interface DeviceStatsProps {
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

const COLORS = {
  desktop: "#10b981",
  mobile: "#3b82f6",
  tablet: "#a855f7",
};

export const DeviceStats = ({ deviceStats }: DeviceStatsProps) => {
  const data = [
    { name: "Desktop", value: deviceStats.desktop },
    { name: "Mobile", value: deviceStats.mobile },
    { name: "Tablet", value: deviceStats.tablet },
  ].filter(item => item.value > 0); // Only show devices with usage

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Device Statistics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How students access your course
        </p>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Desktop</p>
                <p className="text-2xl font-bold">{deviceStats.desktop}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="text-2xl font-bold">{deviceStats.mobile}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tablet</p>
                <p className="text-2xl font-bold">{deviceStats.tablet}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-500">
            <p>No device data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
