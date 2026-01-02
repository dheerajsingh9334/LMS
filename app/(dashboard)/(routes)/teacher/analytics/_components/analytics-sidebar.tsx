"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart, 
  DollarSign, 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  BookOpen,
  Calendar,
  Target,
  Award,
  Eye,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  totalEnrollments: number;
  monthlyEnrollments: number;
  completionRate: number;
  totalCourses: number;
  activeCourses: number;
  totalViews: number;
  avgTimeSpent: string;
}

const menuItems = [
  {
    title: "Overview",
    href: "/teacher/analytics",
    icon: BarChart,
    description: "General analytics"
  },
  {
    title: "Earnings",
    href: "/teacher/analytics/earnings",
    icon: DollarSign,
    description: "Revenue & payments"
  },
  {
    title: "Reviews & Ratings",
    href: "/teacher/analytics/reviews",
    icon: Star,
    description: "Student feedback"
  },
  {
    title: "Courses",
    href: "/teacher/analytics/courses",
    icon: BookOpen,
    description: "Course performance"
  },
  {
    title: "Students",
    href: "/teacher/analytics/students",
    icon: Users,
    description: "Student analytics"
  },
  {
    title: "Performance",
    href: "/teacher/analytics/performance",
    icon: TrendingUp,
    description: "Growth metrics"
  }
];

export function AnalyticsSidebar() {
  const pathname = usePathname();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/teacher/analytics/summary');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch analytics summary:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="w-80 bg-background border-r p-6 overflow-y-auto">
      {/* Quick Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
        <div className="space-y-3">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Total Earnings</p>
                  <p className="text-xl font-bold text-green-800">
                    ${isLoading ? "..." : data?.totalEarnings?.toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Average Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-bold text-blue-800">
                      {isLoading ? "..." : data?.averageRating?.toFixed(1) || "0.0"}
                    </p>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <Star className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Total Students</p>
                  <p className="text-xl font-bold text-purple-800">
                    {isLoading ? "..." : data?.totalEnrollments?.toLocaleString() || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Completion Rate</p>
                  <p className="text-xl font-bold text-orange-800">
                    {isLoading ? "..." : `${data?.completionRate || 0}%`}
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Analytics Sections</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <div>
                <p>{item.title}</p>
                <p className="text-xs opacity-75">{item.description}</p>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Monthly Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">This Month</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm">Earnings</span>
            </div>
            <span className="text-sm font-semibold">
              ${isLoading ? "..." : data?.monthlyEarnings?.toLocaleString() || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">New Students</span>
            </div>
            <span className="text-sm font-semibold">
              {isLoading ? "..." : data?.monthlyEnrollments || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Reviews</span>
            </div>
            <span className="text-sm font-semibold">
              {isLoading ? "..." : data?.totalReviews || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Total Views</span>
            </div>
            <span className="text-sm font-semibold">
              {isLoading ? "..." : data?.totalViews?.toLocaleString() || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm">Avg Time</span>
            </div>
            <span className="text-sm font-semibold">
              {isLoading ? "..." : data?.avgTimeSpent || "0 min"}
            </span>
          </div>
        </div>
      </div>

      {/* Course Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Courses</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Courses</span>
            <span className="font-semibold">{isLoading ? "..." : data?.totalCourses || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Courses</span>
            <span className="font-semibold text-green-600">{isLoading ? "..." : data?.activeCourses || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}