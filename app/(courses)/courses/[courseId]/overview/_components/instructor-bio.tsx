"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Users, Award, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InstructorInfo {
  id?: string;
  name: string;
  email?: string;
  image?: string;
  bio?: string;
  totalCourses?: number;
  totalStudents?: number;
}

interface InstructorBioProps {
  instructor: InstructorInfo;
}

export const InstructorBio = ({ instructor }: InstructorBioProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Instructor</CardTitle>
          {instructor.id && (
            <Link href={`/teacher/${instructor.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                View Profile
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {instructor.id ? (
            <Link href={`/teacher/${instructor.id}`} className="flex-shrink-0">
              {instructor.image ? (
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  width={80}
                  height={80}
                  className="rounded-full hover:opacity-80 transition cursor-pointer"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition cursor-pointer">
                  <span className="text-2xl font-bold text-blue-600">
                    {instructor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
          ) : (
            instructor.image ? (
              <Image
                src={instructor.image}
                alt={instructor.name}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {instructor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )
          )}
          <div className="flex-1">
            {instructor.id ? (
              <Link href={`/teacher/${instructor.id}`}>
                <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-blue-600 transition cursor-pointer">
                  {instructor.name}
                </h3>
              </Link>
            ) : (
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {instructor.name}
              </h3>
            )}
            {instructor.bio && (
              <p className="text-slate-600 mb-4 line-clamp-3">{instructor.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {instructor.totalCourses !== undefined && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{instructor.totalCourses} Courses</span>
                </div>
              )}
              {instructor.totalStudents !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{instructor.totalStudents}+ Students</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Certified Instructor</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
