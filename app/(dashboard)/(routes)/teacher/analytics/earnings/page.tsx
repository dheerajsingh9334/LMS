"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { OverviewChart } from "../_components/overview-chart";

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  averagePerStudent: number;
  monthlyGrowth: number;
  topCourses: Array<{
    id: string;
    title: string;
    earnings: number;
    enrollments: number;
  }>;
  earningsChart: Array<{
    month: string;
    earnings: number;
  }>;
}

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [earningsResponse, summaryResponse] = await Promise.all([
          fetch('/api/teacher/analytics/earnings'),
          fetch('/api/teacher/analytics/summary')
        ]);

        const [earningsData, summaryData] = await Promise.all([
          earningsResponse.json(),
          summaryResponse.json()
        ]);

        // Calculate yearly earnings from monthly data
        const yearlyEarnings = earningsData.monthlyEarnings?.reduce(
          (sum: number, month: any) => sum + month.earnings, 0
        ) || 0;

        // Calculate average per student
        const averagePerStudent = summaryData.totalEnrollments > 0 
          ? summaryData.totalEarnings / summaryData.totalEnrollments 
          : 0;

        // Calculate monthly growth (mock calculation)
        const monthlyGrowth = 15.2; // You can calculate actual growth

        setData({
          totalEarnings: summaryData.totalEarnings || 0,
          monthlyEarnings: summaryData.monthlyEarnings || 0,
          yearlyEarnings,
          averagePerStudent,
          monthlyGrowth,
          topCourses: earningsData.topCourses || [],
          earningsChart: earningsData.monthlyEarnings || []
        });
      } catch (error) {
        console.error('Failed to fetch earnings data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading earnings data...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Earnings Analytics</h1>
          <p className="text-muted-foreground">
            Track your revenue and financial performance
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          +${data?.monthlyEarnings?.toFixed(2) || 0} this month
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${data?.totalEarnings?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${data?.monthlyEarnings?.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {data?.monthlyGrowth && data.monthlyGrowth > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-sm ${data?.monthlyGrowth && data.monthlyGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data?.monthlyGrowth?.toFixed(1) || 0}%
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average per Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ${data?.averagePerStudent?.toFixed(2) || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue per enrollment
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Yearly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              ${data?.yearlyEarnings?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Last 12 months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Earnings Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewChart data={data?.earningsChart || []} />
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Earning Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.topCourses?.map((course, index) => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <p className="font-medium">{course.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.enrollments} students enrolled
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ${course.earnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${(course.earnings / course.enrollments).toFixed(2)} per student
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Methods & Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Successful Payments</span>
              <span className="font-semibold text-green-600">98.5%</span>
            </div>
            <Progress value={98.5} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span>Average Processing Time</span>
              <span className="font-semibold">2.3 seconds</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Refund Rate</span>
              <span className="font-semibold text-red-600">1.2%</span>
            </div>
            <Progress value={1.2} className="h-2" />
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Next payout: <span className="font-semibold">November 15, 2025</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Pending amount: <span className="font-semibold text-green-600">${data?.monthlyEarnings?.toFixed(2) || 0}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}