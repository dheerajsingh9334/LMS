"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Users,
  ThumbsUp,
  MessageCircle
} from "lucide-react";
import { FaUser } from "react-icons/fa";

interface ReviewData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Array<{
    stars: number;
    count: number;
    percentage: number;
  }>;
  recentReviews: Array<{
    id: string;
    studentName: string;
    courseTitle: string;
    rating: number;
    review: string;
    date: string;
    verified: boolean;
  }>;
  topRatedCourses: Array<{
    id: string;
    title: string;
    rating: number;
    reviewCount: number;
  }>;
}

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reviewsResponse, summaryResponse] = await Promise.all([
          fetch('/api/teacher/analytics/reviews'),
          fetch('/api/teacher/analytics/summary')
        ]);

        const [reviewsData, summaryData] = await Promise.all([
          reviewsResponse.json(),
          summaryResponse.json()
        ]);

        // Mock rating distribution (you can implement actual calculation)
        const ratingDistribution = [
          { stars: 5, count: 45, percentage: 60 },
          { stars: 4, count: 20, percentage: 27 },
          { stars: 3, count: 8, percentage: 11 },
          { stars: 2, count: 1, percentage: 1 },
          { stars: 1, count: 1, percentage: 1 },
        ];

        // Mock top rated courses (you can implement actual calculation)
        const topRatedCourses = [
          { id: "1", title: "Advanced React Development", rating: 4.9, reviewCount: 124 },
          { id: "2", title: "Node.js Masterclass", rating: 4.8, reviewCount: 89 },
          { id: "3", title: "Full Stack Development", rating: 4.7, reviewCount: 156 },
        ];

        setData({
          averageRating: summaryData.averageRating || 0,
          totalReviews: summaryData.totalReviews || 0,
          ratingDistribution,
          recentReviews: reviewsData.recentReviews?.map((review: any) => ({
            ...review,
            verified: true // Mock verification status
          })) || [],
          topRatedCourses
        });
      } catch (error) {
        console.error('Failed to fetch reviews data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading reviews data...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            Student feedback and course ratings
          </p>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Star className="h-3 w-3 mr-1 fill-yellow-600" />
          {data?.averageRating?.toFixed(1) || 0} Average Rating
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
              {data?.averageRating?.toFixed(1) || 0}
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data?.totalReviews || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Written reviews
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Positive Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data?.ratingDistribution?.[0]?.percentage || 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              4-5 star ratings
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Review Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              +12%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution and Recent Reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.ratingDistribution?.map((rating) => (
              <div key={rating.stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{rating.stars}</span>
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                </div>
                <Progress value={rating.percentage} className="flex-1 h-2" />
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm text-muted-foreground">{rating.count}</span>
                  <span className="text-xs text-muted-foreground">({rating.percentage}%)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Rated Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Rated Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.topRatedCourses?.map((course, index) => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <p className="font-medium">{course.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.reviewCount} reviews
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-bold text-yellow-600">
                    {course.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data?.recentReviews?.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback><FaUser className="text-white" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.studentName}</p>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.courseTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{review.review}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}