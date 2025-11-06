"use client";

import { Target, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HighlightsProps {
  highlights: string[];
  projects: string[];
}

export const CourseHighlights = ({ highlights, projects }: HighlightsProps) => {
  const hasContent = (highlights && highlights.length > 0) || (projects && projects.length > 0);
  
  if (!hasContent) return null;

  return (
    <div className="space-y-6">
      {highlights && highlights.length > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Course Highlights
            </CardTitle>
            <CardDescription>
              What makes this course special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-white border-purple-300 text-purple-700 px-3 py-1"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {projects && projects.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Projects You&apos;ll Build
            </CardTitle>
            <CardDescription>
              Hands-on projects included in this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {projects.map((project, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-slate-700">{project}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
