"use client";

import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const CourseRatingPage = ({
  params
}: {
  params: { courseId: string }
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = async () => {
    // TODO: Implement rating submission
    console.log("Rating:", rating, "Review:", review);
  };

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rate This Course</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Share your experience with this course
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Rating</CardTitle>
            <CardDescription>
              Help other students by rating this course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm font-medium">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Write a Review (Optional)
              </label>
              <Textarea
                placeholder="Share your thoughts about this course..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your review will help other students make informed decisions
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full"
              size="lg"
            >
              Submit Rating
            </Button>
          </CardContent>
        </Card>

        {/* Existing Reviews Section (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Course Reviews</CardTitle>
            <CardDescription>
              See what other students are saying
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No reviews yet. Be the first to review this course!
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CourseRatingPage;
