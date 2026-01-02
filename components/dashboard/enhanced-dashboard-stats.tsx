"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Download,
  Calendar,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Certificate {
  id: string;
  courseName: string;
  completedDate: string;
  instructor: string;
  certificateUrl?: string;
}

interface EnhancedDashboardStatsProps {
  userName: string;
  certificates: Certificate[];
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHoursLearned: number;
  currentStreak: number;
}

export const EnhancedDashboardStats = ({
  userName,
  certificates,
  totalCourses,
  completedCourses,
  inProgressCourses,
  totalHoursLearned,
  currentStreak,
}: EnhancedDashboardStatsProps) => {
  const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

  const statCards = [
    {
      title: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Completed",
      value: completedCourses,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Learning Hours",
      value: `${totalHoursLearned}h`,
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Current Streak",
      value: `${currentStreak} days`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-lg p-6 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}! 👋</h1>
        <p className="text-blue-100">Continue your learning journey today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Overview */}
      <Card className="border-none shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-muted-foreground">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCourses}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Certificates</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{certificates.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Section */}
      {certificates.length > 0 && (
        <Card className="border-none shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              My Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{cert.courseName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(cert.completedDate).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Instructor: {cert.instructor}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (cert.certificateUrl) {
                        window.open(cert.certificateUrl, "_blank");
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Certificates */}
      {certificates.length === 0 && (
        <Card className="border-none shadow-md dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-4">
              <Award className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Complete your courses to earn certificates and showcase your achievements!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
