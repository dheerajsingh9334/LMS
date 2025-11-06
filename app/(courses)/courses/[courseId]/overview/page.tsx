import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { BookOpen, Clock, Video, Award, CheckCircle2, PlayCircle, ArrowLeft, Star, Lock } from "lucide-react";
import { CoursePurchaseButton } from "../chapters/[chapterId]/_components/course-purchase-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StudentCourseNavbar } from "@/components/student-course-navbar";
import { Prerequisites } from "./_components/prerequisites";
import { CourseHighlights } from "./_components/course-highlights";
import { WhoIsThisFor } from "./_components/who-is-this-for";
import { FAQSection } from "./_components/faq-section";
import { InstructorBio } from "./_components/instructor-bio";
import { PromoVideo } from "./_components/promo-video";
import { Testimonials } from "./_components/testimonials";
import { CertificationDetails } from "./_components/certification-details";
import { Badge } from "@/components/ui/badge";
import { EnhancedChapterProgression } from "@/components/enhanced-chapter-progression";
import { getEnhancedChapterAccessibility } from "@/lib/chapter-access";

const CourseOverviewPage = async ({
  params
}: {
  params: { courseId: string };
}) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  // Optimized query with only necessary fields
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      isPublished: true,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      imageUrl: true,
      price: true,
      isFree: true,
      learningOutcomes: true,
      prerequisites: true,
      courseObjectives: true,
      highlights: true,
      projectsIncluded: true,
      whoIsThisFor: true,
      faqs: true,
      promoVideoUrl: true,
      category: {
        select: {
          name: true,
        },
      },
      chapters: {
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          isPreview: true,
        },
        orderBy: {
          position: "asc"
        }
      }
    }
  });

  if (!course) {
    return redirect("/dashboard");
  }

  // Check if user has already purchased - Optimized
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      }
    },
    select: {
      id: true,
      paymentStatus: true,
    }
  });

  // Don't redirect purchased users - let them see the full course overview
  // They can navigate to chapters via the navigation
  const isPurchased = !!purchase && purchase.paymentStatus === "completed";
  const isInstructor = course.userId === user.id;

  // Redirect instructors to their teacher dashboard
  if (isInstructor) {
    return redirect(`/teacher/courses/${params.courseId}`);
  }



  // Get enhanced chapter accessibility with quizzes and assignments
  const enhancedChapterDataRaw = await getEnhancedChapterAccessibility(
    user.id, 
    params.courseId, 
    isPurchased, 
    isInstructor
  );

  // Serialize dates to avoid hydration issues
  const enhancedChapterData = enhancedChapterDataRaw.map(chapter => ({
    ...chapter,
    assignments: chapter.assignments.map(assignment => ({
      ...assignment,
      dueDate: assignment.dueDate.toISOString()
    }))
  }));

  // Get total duration (mock - you can calculate from videos)
  const totalChapters = course.chapters.length;

  // Get course ratings - Optimized with limit for performance
  const ratings = await db.courseRating.findMany({
    where: {
      courseId: params.courseId,
    },
    select: {
      id: true,
      rating: true,
      review: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          image: true,
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10, // Limit to 10 most recent reviews for performance
  });

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
    : 0;

  // Get instructor information
  const instructor = await db.user.findUnique({
    where: {
      id: course.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
    },
  });

  // Get instructor stats
  const instructorCourses = await db.course.count({
    where: {
      userId: course.userId,
      isPublished: true,
    },
  });

  const instructorStudents = await db.purchase.count({
    where: {
      course: {
        userId: course.userId,
      },
    },
  });

  const previewChapters = course.chapters.filter(chapter => chapter.isPreview);

  // Get featured testimonials
  const testimonials = await db.testimonial.findMany({
    where: {
      courseId: params.courseId,
      isFeatured: true,
    },
    select: {
      id: true,
      studentName: true,
      studentRole: true,
      content: true,
      rating: true,
      imageUrl: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4, // Show top 4 featured testimonials
  });

  // Check if course has certificate
  const hasCertificate = await db.certificateTemplate.findUnique({
    where: {
      courseId: params.courseId,
    },
    select: {
      id: true,
    },
  });

  return (
    <>
      <StudentCourseNavbar courseId={params.courseId} />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Back Navigation */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-black">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Course Info */}
            <div>
              <div className="mb-4">
                {course.category && (
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                    {course.category.name}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {course.title}
              </h1>
              
              <p className="text-xl text-black/90 mb-6">
                {course.description}
              </p>

              {/* Rating Display */}
              {ratings.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span className="text-black/80">
                    ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                  <span>{totalChapters} Chapters</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Video className="w-5 h-5" />
                  <span>Video Lessons</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Award className="w-5 h-5" />
                  <span>Certificate</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <div className="flex items-baseline gap-2 mb-4">
                  {course.isFree ? (
                    <span className="text-3xl font-bold text-green-600">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-slate-900">₹{course.price}</span>
                      <span className="text-slate-600">one-time payment</span>
                    </>
                  )}
                </div>
                
                <CoursePurchaseButton
                  courseId={course.id}
                  price={course.price}
                  isFree={course.isFree}
                  isPurchased={isPurchased}
                />
                
                <p className="text-sm text-slate-600 mt-4 text-center">
                  30-day money-back guarantee
                </p>
              </div>
            </div>

            {/* Right Column - Course Image with Promo Video */}
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl">
              {course.imageUrl ? (
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <BookOpen className="w-32 h-32 text-white/50" />
                </div>
              )}
              <PromoVideo 
                videoUrl={course.promoVideoUrl || undefined} 
                courseTitle={course.title} 
                imageUrl={course.imageUrl || undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* What You'll Learn */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
                  course.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{outcome}</span>
                    </div>
                  ))
                ) : (
                  [
                    "Master the core concepts",
                    "Build real-world projects",
                    "Get industry-ready skills",
                    "Earn a certificate",
                    "Learn at your own pace",
                    "Lifetime access to content"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="mb-8">
                <Prerequisites prerequisites={course.prerequisites} />
              </div>
            )}

            {/* Course Highlights & Projects */}
            {((course.highlights && course.highlights.length > 0) || 
              (course.projectsIncluded && course.projectsIncluded.length > 0)) && (
              <div className="mb-8">
                <CourseHighlights 
                  highlights={course.highlights || []} 
                  projects={course.projectsIncluded || []} 
                />
              </div>
            )}

            {/* Who Is This For */}
            {course.whoIsThisFor && course.whoIsThisFor.length > 0 && (
              <div className="mb-8">
                <WhoIsThisFor audiences={course.whoIsThisFor} />
              </div>
            )}

            {/* Course Content - Chapters with Progressive Unlock */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Course Content</h2>
              {previewChapters.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <Badge className="mr-2 bg-blue-600">FREE PREVIEW</Badge>
                    {previewChapters.length} {previewChapters.length === 1 ? 'chapter' : 'chapters'} available for preview
                  </div>
                </div>
              )}
              
              {/* Enhanced Progressive Chapter Unlock System with Quizzes & Assignments */}
              <div className="space-y-4">
                {enhancedChapterData && enhancedChapterData.length > 0 ? (
                  <EnhancedChapterProgression 
                    chapters={enhancedChapterData}
                    courseId={params.courseId}
                    showContent={isPurchased || isInstructor}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading enhanced course structure...</p>
                    <p className="text-sm mt-2">Enhanced data length: {enhancedChapterData?.length || 0}</p>
                  </div>
                )}

                {/* Final Exam Section */}
                {(isPurchased || isInstructor) && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6 mt-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-purple-800 mb-2">
                          🎓 Final Comprehensive Exam
                        </h3>
                        <p className="text-purple-600 mb-4">
                          Complete your learning journey with a comprehensive final exam covering all course content.
                          Score 80%+ to earn your certificate!
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-purple-700">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>90 minutes</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span>70% to pass</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            <span>80% for certificate</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Link href={`/courses/${params.courseId}/final-exam`}>
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white/50">
                            Take Final Exam
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {!isPurchased && !isInstructor && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <Lock className="inline w-4 h-4 mr-1" />
                    Purchase the course to unlock all chapters and track your progress through the sequential learning path.
                  </p>
                </div>
              )}
            </div>

            {/* Student Reviews Section */}
            {ratings.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
                <h2 className="text-2xl font-bold mb-6">Student Reviews</h2>
                <div className="space-y-6">
                  {ratings.filter(rating => rating.user).map((rating) => {
                    const userName = rating.user?.name || "Anonymous";
                    const userImage = rating.user?.image;
                    
                    return (
                    <div key={rating.id} className="border-b border-slate-200 pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        {userImage ? (
                          <Image
                            src={userImage}
                            alt={userName}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">
                              {userName}
                            </h4>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < rating.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-slate-200 text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.review && (
                            <p className="text-slate-700 mt-2">{rating.review}</p>
                          )}
                          <p className="text-sm text-slate-500 mt-2">
                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* Instructor Bio Section */}
            {instructor && (
              <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
                <InstructorBio 
                  instructor={{
                    id: instructor.id,
                    name: instructor.name || "Instructor",
                    email: instructor.email || "",
                    image: instructor.image || undefined,
                    bio: instructor.bio || `Experienced educator with ${instructorCourses} course${instructorCourses !== 1 ? 's' : ''} and ${instructorStudents} student${instructorStudents !== 1 ? 's' : ''}`,
                    totalCourses: instructorCourses,
                    totalStudents: instructorStudents,
                  }}
                />
              </div>
            )}

            {/* FAQ Section */}
            {course.faqs && course.faqs.length > 0 && (
              <div className="mt-8">
                <FAQSection faqs={course.faqs} />
              </div>
            )}

            {/* Testimonials Section */}
            {testimonials.length > 0 && (
              <div className="mt-8">
                <Testimonials testimonials={testimonials} />
              </div>
            )}

            {/* Certification Details Section */}
            {hasCertificate && (
              <div className="mt-8">
                <CertificationDetails 
                  courseTitle={course.title}
                  hasCertificate={!!hasCertificate}
                />
              </div>
            )}
          </div>

          {/* Sidebar - Features */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8 sticky top-4">
              <h3 className="text-xl font-bold mb-6">This course includes:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Video Lessons</p>
                    <p className="text-sm text-slate-600">High-quality video content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Learning Resources</p>
                    <p className="text-sm text-slate-600">Downloadable materials</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Lifetime Access</p>
                    <p className="text-sm text-slate-600">Learn at your own pace</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Certificate</p>
                    <p className="text-sm text-slate-600">On course completion</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t">
                <CoursePurchaseButton
                  courseId={course.id}
                  price={course.price}
                  isFree={course.isFree}
                  isPurchased={isPurchased}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CourseOverviewPage;
