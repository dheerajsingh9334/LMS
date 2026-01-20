"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface StudentAnalyticsResponse {
  overview: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalWatchTime: number;
    averageProgress: number;
    certificatesEarned: number;
  };
  courseProgress: Array<{
    courseTitle: string;
    progress: number;
    chaptersCompleted: number;
    totalChapters: number;
  }>;
  quizPerformance: Array<{
    quizTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    attempts: number;
  }>;
  weeklyActivity: Array<{
    day: string;
    watchTime: number;
    chaptersCompleted: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    value: number;
  }>;
}

interface CategoryChartDataResponse {
  labels: string[];
  data: number[];
}

interface TeacherOverviewResponse {
  totalCourses: number;
  totalStudents: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
}

interface TeacherRecentStudentsResponse {
  recentStudents: Array<{
    name: string;
    courseTitle: string;
    date: string;
    image: string;
  }>;
}

interface TeacherEnrollmentsResponse {
  enrollments: any[];
}

interface TeacherReviewsResponse {
  recentReviews: Array<{
    id: string;
    studentName: string;
    courseTitle: string;
    rating: number;
    review: string;
    date: string;
  }>;
}

interface TeacherEarningsResponse {
  monthlyEarnings: Array<{
    month: string;
    earnings: number;
  }>;
  topCourses: any[];
}

interface AdminAnalyticsSummaryResponse {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  activeCourses: number;
  totalPurchases: number;
  totalEnrollments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  completionRate: number;
  topCourses: {
    id: string;
    title: string;
    isPublished: boolean;
    enrollments: number;
    revenue: number;
    avgRating: number;
  }[];
  courseEarnings: {
    id: string;
    title: string;
    isPublished: boolean;
    instructorId: string | null;
    instructorName: string;
    enrollments: number;
    revenue: number;
    avgRating: number;
  }[];
  teacherEarnings: {
    teacherId: string;
    teacherName: string;
    revenue: number;
    enrollments: number;
  }[];
}

interface AdminAnalyticsTimeseriesResponse {
  range: "7d" | "30d" | "12m";
  points: {
    period: string;
    revenue: number;
    enrollments: number;
    signups: number;
  }[];
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["Courses", "Dashboard", "User"],
  endpoints: (builder) => ({
    getStudentAnalytics: builder.query<StudentAnalyticsResponse, void>({
      query: () => "/student/analytics",
      providesTags: ["Dashboard"],
    }),
    getCategoryChartData: builder.query<
      CategoryChartDataResponse,
      { userId: string }
    >({
      query: ({ userId }) => `/chart-data?userId=${encodeURIComponent(userId)}`,
      providesTags: ["Dashboard"],
    }),
    getTeacherOverview: builder.query<TeacherOverviewResponse, void>({
      query: () => "/teacher/analytics/summary",
      providesTags: ["Dashboard"],
    }),
    getTeacherRecentStudents: builder.query<
      TeacherRecentStudentsResponse,
      void
    >({
      query: () => "/teacher/analytics/recent-students",
      providesTags: ["Dashboard"],
    }),
    getTeacherEnrollments: builder.query<TeacherEnrollmentsResponse, void>({
      query: () => "/teacher/analytics/enrollments",
      providesTags: ["Dashboard"],
    }),
    getTeacherReviews: builder.query<TeacherReviewsResponse, void>({
      query: () => "/teacher/analytics/reviews",
      providesTags: ["Dashboard"],
    }),
    getTeacherEarnings: builder.query<TeacherEarningsResponse, void>({
      query: () => "/teacher/analytics/earnings",
      providesTags: ["Dashboard"],
    }),
    getAdminAnalyticsSummary: builder.query<
      AdminAnalyticsSummaryResponse,
      void
    >({
      query: () => "/admin/analytics/summary",
      providesTags: ["Dashboard"],
    }),
    getAdminAnalyticsTimeseries: builder.query<
      AdminAnalyticsTimeseriesResponse,
      { range?: "7d" | "30d" | "12m" }
    >({
      query: ({ range = "30d" } = {}) =>
        `/admin/analytics/timeseries?range=${encodeURIComponent(range)}`,
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetStudentAnalyticsQuery,
  useGetCategoryChartDataQuery,
  useGetTeacherOverviewQuery,
  useGetTeacherRecentStudentsQuery,
  useGetTeacherEnrollmentsQuery,
  useGetTeacherReviewsQuery,
  useGetTeacherEarningsQuery,
  useGetAdminAnalyticsSummaryQuery,
  useGetAdminAnalyticsTimeseriesQuery,
} = api;
