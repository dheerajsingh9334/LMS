"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { IndianRupee, ShoppingCart, TrendingUp, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CourseBreakdown {
  courseId: string;
  title: string;
  sales: number;
  earnings: number;
  price: number;
  isFree: boolean;
}

interface RecentPurchase {
  id: string;
  amount: number;
  createdAt: string;
  course: {
    title: string;
  };
}

interface AnalyticsData {
  totalEarnings: number;
  totalSales: number;
  courseBreakdown: CourseBreakdown[];
  recentPurchases: RecentPurchase[];
}

export const TeacherAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get("/api/teacher/analytics");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Analytics & Earnings</h2>
        <p className="text-gray-600">Track your course performance and revenue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(data.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              From all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Course enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.courseBreakdown.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Published courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                data.totalEarnings / (data.totalSales || 1)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Per enrollment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>
            Earnings and sales breakdown by course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.courseBreakdown.map((course) => (
                <TableRow key={course.courseId}>
                  <TableCell className="font-medium">
                    {course.title}
                  </TableCell>
                  <TableCell>
                    {course.isFree ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : (
                      formatPrice(course.price)
                    )}
                  </TableCell>
                  <TableCell>{course.sales}</TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(course.earnings)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Latest course enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.course.title}
                  </TableCell>
                  <TableCell>
                    {formatPrice(purchase.amount || 0)}
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
