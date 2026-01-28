"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DoughnutChart from "@/app/(dashboard)/_components/doughnutChart";
import { Label } from "@/components/ui/label";

interface AdminDashboardChartsProps {
  categoryLabels: string[];
  categoryData: number[];
  studentCategoryLabels: string[];
  studentCategoryData: number[];
}

export const AdminDashboardCharts = ({
  categoryLabels,
  categoryData,
  studentCategoryLabels,
  studentCategoryData,
}: AdminDashboardChartsProps) => {
  const [coursesFilter, setCoursesFilter] = useState<string>("all");
  const [studentsFilter, setStudentsFilter] = useState<string>("all");

  // Filter courses data
  const filteredCoursesData = useMemo(() => {
    if (coursesFilter === "all") {
      return { labels: categoryLabels, data: categoryData };
    }
    const index = categoryLabels.indexOf(coursesFilter);
    if (index === -1) {
      return { labels: [], data: [] };
    }
    return {
      labels: [categoryLabels[index]],
      data: [categoryData[index]],
    };
  }, [coursesFilter, categoryLabels, categoryData]);

  // Filter students data
  const filteredStudentsData = useMemo(() => {
    if (studentsFilter === "all") {
      return { labels: studentCategoryLabels, data: studentCategoryData };
    }
    const index = studentCategoryLabels.indexOf(studentsFilter);
    if (index === -1) {
      return { labels: [], data: [] };
    }
    return {
      labels: [studentCategoryLabels[index]],
      data: [studentCategoryData[index]],
    };
  }, [studentsFilter, studentCategoryLabels, studentCategoryData]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {categoryLabels.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Courses by Category</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Distribution of courses across categories
                  </p>
                </div>
                <div className="w-48">
                  <Label className="text-xs">Filter Category</Label>
                  <Select
                    value={coursesFilter}
                    onValueChange={setCoursesFilter}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryLabels.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCoursesData.labels.length > 0 ? (
                <DoughnutChart
                  labels={filteredCoursesData.labels}
                  data={filteredCoursesData.data}
                  title=""
                />
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {studentCategoryLabels.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Enrollment by Category</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unique students enrolled per category
                  </p>
                </div>
                <div className="w-48">
                  <Label className="text-xs">Filter Category</Label>
                  <Select
                    value={studentsFilter}
                    onValueChange={setStudentsFilter}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {studentCategoryLabels.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredStudentsData.labels.length > 0 ? (
                <DoughnutChart
                  labels={filteredStudentsData.labels}
                  data={filteredStudentsData.data}
                  title=""
                />
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
