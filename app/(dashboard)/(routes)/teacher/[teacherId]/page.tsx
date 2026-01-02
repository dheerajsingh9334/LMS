import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, GraduationCap, Users, Award, Globe, Linkedin, Twitter, Github, BookOpen, Clock, TrendingUp } from "lucide-react";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TeacherProfilePage = async ({
  params
}: {
  params: { teacherId: string }
}) => {
  const user = await currentUser();
  const userId = user?.id;

  // Fetch teacher profile
  const teacher = await db.user.findUnique({
    where: { 
      id: params.teacherId,
      userType: "TEACHER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      headline: true,
      bio: true,
      achievements: true,
      socialLinks: true,
      courses: {
        where: { isPublished: true },
        include: {
          chapters: {
            where: { isPublished: true },
          },
          purchases: true,
          ratings: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                }
              }
            }
          },
          category: true,
        },
      },
    },
  });

  if (!teacher) {
    return redirect("/");
  }

  // Calculate statistics
  const totalStudents = teacher.courses.reduce(
    (acc, course) => acc + course.purchases.length,
    0
  );

  const totalCourses = teacher.courses.length;

  const allRatings = teacher.courses.flatMap(course => course.ratings);
  const averageRating = allRatings.length > 0
    ? allRatings.reduce((acc, rating) => acc + rating.rating, 0) / allRatings.length
    : 0;
  const totalReviews = allRatings.length;

  // Parse social links
  const socialLinks = teacher.socialLinks as any || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-200">
                  {teacher.image ? (
                    <Image
                      src={teacher.image}
                      alt={teacher.name || "Teacher"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                      <GraduationCap className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Info */}
              <div className="flex-1 mt-4 md:mt-12">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {teacher.name}
                    </h1>
                    {teacher.headline && (
                      <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">
                        {teacher.headline}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {averageRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400">
                          ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold">{totalStudents}</span> students
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-semibold">{totalCourses}</span> {totalCourses === 1 ? "course" : "courses"}
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(socialLinks.linkedin || socialLinks.twitter || socialLinks.github || socialLinks.website) && (
                    <div className="flex gap-2">
                      {socialLinks.linkedin && (
                        <Link href={socialLinks.linkedin} target="_blank">
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Linkedin className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {socialLinks.twitter && (
                        <Link href={socialLinks.twitter} target="_blank">
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Twitter className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {socialLinks.github && (
                        <Link href={socialLinks.github} target="_blank">
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Github className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {socialLinks.website && (
                        <Link href={socialLinks.website} target="_blank">
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Globe className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - About & Achievements */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            {teacher.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {teacher.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {teacher.achievements && teacher.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {teacher.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {achievement}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Courses Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Courses by {teacher.name}
                </CardTitle>
                <CardDescription>
                  {totalCourses} {totalCourses === 1 ? "course" : "courses"} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {teacher.courses.map((course) => {
                    const courseRatings = course.ratings;
                    const avgRating = courseRatings.length > 0
                      ? courseRatings.reduce((acc, r) => acc + r.rating, 0) / courseRatings.length
                      : 0;
                    
                    const isPurchased = userId ? course.purchases.some(p => p.userId === userId) : false;

                    return (
                      <Link key={course.id} href={`/courses/${course.id}`}>
                        <div className="group p-4 border rounded-lg hover:shadow-lg transition-all hover:border-blue-500 cursor-pointer">
                          <div className="flex gap-4">
                            {/* Course Image */}
                            <div className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden bg-slate-200">
                              {course.imageUrl ? (
                                <Image
                                  src={course.imageUrl}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                                  <BookOpen className="w-8 h-8 text-slate-600" />
                                </div>
                              )}
                            </div>

                            {/* Course Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                                {course.title}
                              </h3>
                              
                              {course.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                                  {course.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                {courseRatings.length > 0 && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                                    <span className="text-slate-500">({courseRatings.length})</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                  <Users className="w-4 h-4" />
                                  <span>{course.purchases.length} students</span>
                                </div>

                                {course.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {course.category.name}
                                  </Badge>
                                )}

                                {isPurchased && (
                                  <Badge className="text-xs bg-green-500">
                                    Enrolled
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  {course.chapters.length} chapters
                                </div>
                                
                                {course.price !== null ? (
                                  <span className="font-bold text-lg text-slate-900 dark:text-white">
                                    ₹{course.price.toFixed(2)}
                                  </span>
                                ) : (
                                  <Badge className="bg-green-500">Free</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Reviews */}
          <div className="space-y-6">
            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">Total Students</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{totalStudents}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium">Courses</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">{totalCourses}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium">Average Rating</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">
                    {averageRating.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Reviews</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{totalReviews}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            {allRatings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Recent Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allRatings.slice(0, 3).map((rating) => (
                    <div key={rating.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                          {rating.user.image ? (
                            <Image
                              src={rating.user.image}
                              alt={rating.user.name || "Student"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                              <span className="text-white text-sm font-semibold">
                                {rating.user.name?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                              {rating.user.name}
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{rating.rating}</span>
                            </div>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                              {rating.review}
                            </p>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
