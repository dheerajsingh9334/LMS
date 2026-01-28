"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  Target,
  Calendar,
  IndianRupee,
  Users,
  Star,
  Award,
  Clock,
  Eye,
  BookOpen,
} from "lucide-react";

interface PerformanceData {
  monthlyGrowth: {
    enrollments: number;
    revenue: number;
    completionRate: number;
    satisfaction: number;
  };
  yearOverYear: {
    students: number;
    revenue: number;
    courses: number;
    ratings: number;
  };
  trends: Array<{
    metric: string;
    current: number | string;
    previous: number | string;
    change: number;
    trend: "up" | "down" | "stable";
    icon: any;
  }>;
  goals: Array<{
    title: string;
    current: number;
    target: number;
    unit: string;
    status: "on-track" | "behind" | "exceeded";
  }>;
  insights: Array<{
    category: string;
    message: string;
    impact: "positive" | "negative" | "neutral";
    action?: string;
  }>;
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Mock performance data (you can implement actual calculations)
        const performanceData: PerformanceData = {
          monthlyGrowth: {
            enrollments: 23,
            revenue: 15,
            completionRate: 8,
            satisfaction: 5,
          },
          yearOverYear: {
            students: 145,
            revenue: 87,
            courses: 200,
            ratings: 12,
          },
          trends: [
            {
              metric: "Student Enrollments",
              current: 156,
              previous: 127,
              change: 23,
              trend: "up",
              icon: Users,
            },
            {
              metric: "Monthly Revenue",
              current: "$2,340",
              previous: "$2,040",
              change: 15,
              trend: "up",
              icon: IndianRupee,
            },
            {
              metric: "Course Completions",
              current: "78%",
              previous: "72%",
              change: 8,
              trend: "up",
              icon: Target,
            },
            {
              metric: "Average Rating",
              current: "4.6★",
              previous: "4.4★",
              change: 5,
              trend: "up",
              icon: Star,
            },
            {
              metric: "Watch Time",
              current: "45 min",
              previous: "42 min",
              change: 7,
              trend: "up",
              icon: Clock,
            },
            {
              metric: "Engagement Rate",
              current: "84%",
              previous: "89%",
              change: -6,
              trend: "down",
              icon: Eye,
            },
          ],
          goals: [
            {
              title: "Monthly Enrollments",
              current: 156,
              target: 200,
              unit: "students",
              status: "on-track",
            },
            {
              title: "Course Completion Rate",
              current: 78,
              target: 80,
              unit: "%",
              status: "on-track",
            },
            {
              title: "Revenue Target",
              current: 2340,
              target: 3000,
              unit: "$",
              status: "behind",
            },
            {
              title: "Student Satisfaction",
              current: 4.6,
              target: 4.5,
              unit: "★",
              status: "exceeded",
            },
          ],
          insights: [
            {
              category: "Growth",
              message:
                "Enrollment growth is 23% higher than last month, indicating strong course demand.",
              impact: "positive",
              action:
                "Consider increasing course capacity or creating similar content.",
            },
            {
              category: "Engagement",
              message:
                "Video engagement dropped by 6% this month, review content quality and pacing.",
              impact: "negative",
              action:
                "Analyze video analytics and consider shorter, more engaging content.",
            },
            {
              category: "Revenue",
              message:
                "Revenue growth is steady but below target. Pricing strategy may need adjustment.",
              impact: "neutral",
              action: "Consider promotional campaigns or bundle offers.",
            },
            {
              category: "Quality",
              message:
                "Student satisfaction exceeded target, maintain current teaching quality.",
              impact: "positive",
            },
          ],
        };

        setData(performanceData);
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading performance data...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Track growth, trends, and achieve your teaching goals
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          Performance Score: 85/100
        </Badge>
      </div>

      {/* Monthly Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                +{data?.monthlyGrowth.enrollments}%
              </div>
              <p className="text-sm text-muted-foreground">Enrollments</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{data?.monthlyGrowth.revenue}%
              </div>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                +{data?.monthlyGrowth.completionRate}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                +{data?.monthlyGrowth.satisfaction}%
              </div>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.trends?.map((trend, index) => {
              const Icon = trend.icon;
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        trend.trend === "up"
                          ? "text-green-600"
                          : trend.trend === "down"
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {trend.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : trend.trend === "down" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : null}
                      {trend.change > 0 ? "+" : ""}
                      {trend.change}%
                    </div>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{trend.metric}</h4>
                  <div className="text-2xl font-bold">{trend.current}</div>
                  <p className="text-xs text-muted-foreground">
                    Previous: {trend.previous}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data?.goals?.map((goal, index) => {
            const progress = (goal.current / goal.target) * 100;
            const isPercentage = goal.unit === "%";
            const displayCurrent = isPercentage ? goal.current : goal.current;
            const displayTarget = isPercentage ? goal.target : goal.target;

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{goal.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {displayCurrent}
                      {goal.unit} of {displayTarget}
                      {goal.unit} target
                    </p>
                  </div>
                  <Badge
                    variant={
                      goal.status === "exceeded"
                        ? "default"
                        : goal.status === "on-track"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {goal.status === "exceeded"
                      ? "Exceeded"
                      : goal.status === "on-track"
                        ? "On Track"
                        : "Behind"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}% complete</span>
                    <span>
                      Target: {displayTarget}
                      {goal.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.insights?.map((insight, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    insight.impact === "positive"
                      ? "bg-green-500"
                      : insight.impact === "negative"
                        ? "bg-red-500"
                        : "bg-gray-500"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                    <Badge
                      variant={
                        insight.impact === "positive"
                          ? "default"
                          : insight.impact === "negative"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {insight.impact === "positive"
                        ? "Positive"
                        : insight.impact === "negative"
                          ? "Needs Attention"
                          : "Neutral"}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{insight.message}</p>
                  {insight.action && (
                    <div className="bg-muted p-2 rounded text-xs">
                      <strong>Recommended Action:</strong> {insight.action}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Year-over-Year Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                +{data?.yearOverYear.students}%
              </div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-xs text-muted-foreground">vs. last year</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{data?.yearOverYear.revenue}%
              </div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xs text-muted-foreground">vs. last year</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                +{data?.yearOverYear.courses}%
              </div>
              <p className="text-sm text-muted-foreground">Course Portfolio</p>
              <p className="text-xs text-muted-foreground">vs. last year</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                +{data?.yearOverYear.ratings}%
              </div>
              <p className="text-sm text-muted-foreground">
                Rating Improvement
              </p>
              <p className="text-xs text-muted-foreground">vs. last year</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
