// ChapterIdPage.tsx

import { redirect } from "next/navigation";
import { File, FileText, Calendar, Clock, BookOpen, CheckCircle2, PlayCircle, Lock } from "lucide-react";
import { Banner } from "@/components/banner";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
const Preview = dynamic(() => import("@/components/preview").then(mod => ({ default: mod.Preview })), { ssr: false });
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseProgressButton } from "./_components/course-progress-button";
import { CourseEnrollButton } from "./_components/course-enroll-button";
import { CoursePurchaseButton } from "./_components/course-purchase-button";
import { getChapter } from "@/actions/Courses/get-chapter";
import { checkPurchase } from "@/actions/Courses/get-purchase";
import { getQuizData } from "@/actions/Courses/get-quiz";
import { getQuizAttempt } from "@/actions/Courses/get-quiz-attempt"; // Import getQuizAttempt function
import { VideoPlayer } from "./_components/video-player";
import { InteractiveVideoWrapper } from "./_components/interactive-video-wrapper";
import { ChapterPlaylist } from "./_components/chapter-playlist";
import { VideoPlaylist } from "./_components/video-playlist";
import { CertificateSection } from "./_components/certificate-section";
import { CourseHierarchy } from "./_components/course-hierarchy";
import { JoinLiveClassButton } from "./_components/join-live-button";
import { CourseRating } from "@/components/course-rating";
import { ChapterVideoPlayer } from "./_components/chapter-video-player";
import { CheckoutSuccessHandler } from "@/components/checkout-success-handler";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { UniversalNotes } from "@/components/notes/universal-notes";

const ChapterIdPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const user = await currentUser();
  let userId = user?.id ?? "";

  if (!userId) {
    return redirect("/");
  }

  const {
    chapter,
    course,
    attachments,
    nextChapter,
    userProgress,
    purchase,
  } = await getChapter({
    userId,
    chapterId: params.chapterId,
    courseId: params.courseId,
  });

  // Chapter videos are now included in the chapter object from getChapter
  const chapterVideos = chapter?.chapterVideos || [];

  if (!chapter || !course) {
    return redirect("/");
  }

  const purchased = await checkPurchase(userId, params.courseId);
  
  // Check if user is the course instructor
  const isInstructor = course.userId === userId;
  
  // Get chapter accessibility with sequential progression
  const { getChapterAccessibility } = await import("@/lib/chapter-access");
  const chapterAccessibility = await getChapterAccessibility(
    userId, 
    params.courseId, 
    purchased, 
    isInstructor
  );
  
  const currentChapterAccess = chapterAccessibility.find(ch => ch.id === params.chapterId);
  const isLocked = !currentChapterAccess?.isAccessible;
  const completeOnEnd = !userProgress?.isCompleted;

  // Check for active live session for this course - Optimized query
  const activeLiveSession = (purchased || isInstructor) ? await db.liveSession.findFirst({
    where: {
      courseId: params.courseId,
      isLive: true,
    },
    select: {
      id: true,
      title: true,
      isLive: true,
    },
  }) : null;

  // Fetch quiz data using getQuizData function
  const quizzes = await getQuizData({ chapterId: params.chapterId });

  // Filter out completed quizzes
  const incompleteQuizzes: typeof quizzes = [];
  for (const quiz of quizzes) {
    const quizAttempt = await getQuizAttempt({ userId, quizId: quiz.id });
    if (!quizAttempt) {
      incompleteQuizzes.push(quiz);
    }
  }

  // Determine the timeline for the first incomplete quiz
  const quizTimelineSeconds = incompleteQuizzes.length > 0 ? incompleteQuizzes[0].timeline : 0;

  // Fetch all course chapters for navigation
  const allChapters = await db.chapter.findMany({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
    orderBy: {
      position: "asc",
    },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      position: true,
    },
  });

  // Get user progress for all chapters
  const chaptersWithProgress = await Promise.all(
    allChapters.map(async (ch) => {
      const progress = await db.userProgress.findUnique({
        where: {
          userId_chapterId: {
            userId,
            chapterId: ch.id,
          },
        },
      });
      return {
        ...ch,
        isCompleted: progress?.isCompleted || false,
        isLocked: !purchased && !isInstructor,
      };
    })
  );

  // Calculate course progress
  const completedChapters = chaptersWithProgress.filter((ch) => ch.isCompleted).length;
  const courseProgressPercentage = allChapters.length > 0 
    ? (completedChapters / allChapters.length) * 100 
    : 0;

  // Get course ratings
  const courseRatings = await db.courseRating.findMany({
    where: {
      courseId: params.courseId,
    },
    select: {
      rating: true,
    },
  });

  const averageRating = courseRatings.length > 0
    ? courseRatings.reduce((sum, r) => sum + r.rating, 0) / courseRatings.length
    : 0;
  const totalRatings = courseRatings.length;

  // Format chapters for the video player
  const videoChapters = allChapters.map((ch, index) => ({
    id: ch.id,
    title: `${index + 1}. ${ch.title}`,
    timestamp: index * 300, // 5 minutes apart (placeholder - you can customize this)
  }));

  // Fetch chapter assignments if user has purchased the course or is instructor
  const chapterAssignments = (purchased || isInstructor) ? await db.assignment.findMany({
    where: {
      chapterId: params.chapterId,
      isPublished: true
    },
    include: {
      submissions: {
        where: {
          studentId: userId
        }
      }
    },
    orderBy: {
      dueDate: "asc"
    }
  }) : [];

  return (
    <div>
      {/* Handle automatic purchase completion from Stripe success redirect */}
      <CheckoutSuccessHandler courseId={params.courseId} userId={userId} />
      
      <div>
        {userProgress?.isCompleted && (
          <Banner variant="success" label="You already completed this chapter." />
        )}
        {isLocked && (
          <Banner
            variant="warning"
            label="You need to enroll in this course to watch this chapter."
          />
        )}
        <div className="flex flex-col max-w-4xl mx-auto pb-20 p-4 space-y-6 lg:mr-80">
          {/* Back Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            
            {/* Course Rating Display */}
            {totalRatings > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-amber-600 mr-1">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(averageRating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-300"
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
                </span>
              </div>
            )}
          </div>

          {/* Live Session Button */}
          {activeLiveSession && (purchased || isInstructor) && (
            <JoinLiveClassButton
              courseId={params.courseId}
              liveSessionId={activeLiveSession.id}
              isLive={activeLiveSession.isLive}
            />
          )}
          <div className="p-4">
            {/* Universal Video Player that supports YouTube, Vimeo, and uploaded videos */}
            {!isLocked && chapter.videoUrl ? (
              <ChapterVideoPlayer
                url={chapter.videoUrl}
                title={chapter.title}
                completeOnEnd={completeOnEnd}
              />
            ) : isLocked ? (
              <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-slate-600">This chapter is locked</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {currentChapterAccess?.reason === "Course not purchased" 
                      ? "Purchase the course to access this content"
                      : currentChapterAccess?.reason === "Previous chapter not completed"
                      ? "Complete the previous chapter to unlock this content"
                      : "This content is currently unavailable"
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">No video available</p>
              </div>
            )}
          </div>

          <div>
            {/* Chapter Header with Hierarchy */}
            <div className="p-4 border-b bg-slate-50">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {course.title} → Chapter {allChapters.findIndex(ch => ch.id === params.chapterId) + 1}
                </div>
                <h1 className="text-2xl font-bold">{chapter.title}</h1>
              </div>
            </div>

            {/* Chapter Description */}
            {chapter.description && (
              <div className="p-4">
                <div className="prose prose-sm max-w-none [&>div>p]:m-0 [&>div>p>div]:inline-block">
                  <Preview value={chapter.description} />
                </div>
              </div>
            )}

            {/* Video Playlist - Show if there are multiple videos */}
            {chapterVideos.length > 0 && !isLocked && (
              <div className="p-4 border-t">
                <VideoPlaylist
                  videos={chapterVideos}
                  currentVideoId={chapterVideos.find(v => v.videoUrl === chapter.videoUrl)?.id}
                  completedVideos={[]} // TODO: Track completed videos
                />
              </div>
            )}

            {/* Chapter Quizzes */}
            {(purchased || isInstructor) && quizzes.length > 0 && (
              <div className="p-4 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Chapter Quizzes ({quizzes.length})
                </h3>
                <div className="space-y-3">
                  {quizzes.map((quiz) => {
                    const isCompleted = !incompleteQuizzes.find(q => q.id === quiz.id);
                    
                    return (
                      <Link
                        key={quiz.id}
                        href={`/courses/${params.courseId}/chapters/${params.chapterId}/quizzes/${quiz.id}`}
                      >
                        <div className="border rounded-lg p-4 hover:bg-slate-50 transition cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <PlayCircle className="h-5 w-5 text-blue-500" />
                              )}
                              <div>
                                <h4 className="font-medium">{quiz.title}</h4>
                                <p className="text-sm text-gray-600">{quiz.timeline} minutes</p>
                              </div>
                            </div>
                            <Badge variant={isCompleted ? "default" : "secondary"}>
                              {isCompleted ? "Completed" : "Start Quiz"}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-4 flex flex-col md:flex-row items-center justify-between border-t">
              <div className="flex-1"></div>
              {(purchase || isInstructor) ? (
                <CourseProgressButton
                  chapterId={params.chapterId}
                  courseId={params.courseId}
                  nextChapterId={nextChapter?.id}
                  isCompleted={!!userProgress?.isCompleted}
                />
              ) : (
                <CoursePurchaseButton 
                  courseId={params.courseId}
                  price={course.price}
                  isFree={course.isFree}
                />
              )}
            </div>
            <Separator />
            {chapter.description && (
              <div className="p-4">
                <div className="prose prose-sm max-w-none [&>div>p]:m-0 [&>div>p>div]:inline-block">
                  <Preview value={chapter.description} />
                </div>
              </div>
            )}

            {/* Chapter Assignments */}
            {(purchased || isInstructor) && chapterAssignments.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Chapter Assignments
                </h3>
                <div className="space-y-3">
                  {chapterAssignments.map((assignment) => {
                    const submission = assignment.submissions[0];
                    const isPastDue = new Date() > new Date(assignment.dueDate);
                    const isOverdue = isPastDue && !submission;

                    return (
                      <Link
                        key={assignment.id}
                        href={`/courses/${params.courseId}/assignments/${assignment.id}`}
                      >
                        <div className="border rounded-lg p-4 hover:bg-slate-50 transition cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{assignment.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {assignment.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {format(new Date(assignment.dueDate), "PPp")}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{assignment.maxScore} points</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end ml-4">
                              {submission ? (
                                <>
                                  {submission.gradedAt ? (
                                    <Badge className="bg-blue-500">
                                      {submission.score}/{assignment.maxScore}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-500">Submitted</Badge>
                                  )}
                                  {submission.isLate && (
                                    <Badge variant="destructive" className="text-xs">Late</Badge>
                                  )}
                                </>
                              ) : (
                                <>
                                  {isOverdue ? (
                                    <Badge variant="destructive">Overdue</Badge>
                                  ) : (
                                    <Badge variant="secondary">Not Submitted</Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Universal Notes Component */}
            {(purchased || isInstructor) && (
              <div className="mt-8 pt-8 border-t">
                <UniversalNotes
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  context="CHAPTER"
                  className="w-full"
                />
              </div>
            )}

            {/* Course Information */}
            {(purchased || isInstructor) && (
              <div className="mt-8 pt-8 border-t space-y-6">
                
                {/* Course Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Course Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {course.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="text-gray-700">{prerequisite}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Course Highlights */}
                {course.highlights && course.highlights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">What You&apos;ll Learn</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {course.highlights.map((highlight, index) => (
                        <li key={index} className="text-gray-700">{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Check for Certificate */}
                <CertificateSection courseId={params.courseId} userId={userId} />

                {/* Course Rating */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Rate This Course</h3>
                  <CourseRating
                    courseId={params.courseId}
                    hasPurchased={purchased || isInstructor}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="hidden lg:block fixed right-0 top-[80px] bottom-0 w-80 pt-4 px-4 space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 overflow-y-auto shadow-lg">
        {/* Course Hierarchy */}
        <CourseHierarchy
          courseId={params.courseId}
          currentChapterId={params.chapterId}
          content={{
            chapters: chaptersWithProgress.map(ch => ({
              id: ch.id,
              title: ch.title,
              isCompleted: ch.isCompleted,
              isLocked: ch.isLocked,
              position: ch.position,
              videos: chapterVideos.filter(v => v.chapterId === ch.id).map(v => ({
                id: v.id,
                title: v.title,
                isCompleted: false // TODO: Track video completion
              })),
              quizzes: ch.id === params.chapterId ? quizzes.map(q => ({
                id: q.id,
                title: q.title,
                isCompleted: !incompleteQuizzes.find(iq => iq.id === q.id)
              })) : [],
              assignments: ch.id === params.chapterId ? chapterAssignments.map(a => ({
                id: a.id,
                title: a.title,
                isCompleted: a.submissions.length > 0
              })) : []
            }))
          }}
          isPurchased={purchased}
        />

        {/* Attachments */}
        <div className="flex flex-col">
          <h2 className="text-lg font-medium ml-4 pb-4">Attachments</h2>
          {!!attachments.length && (
            <>
              {attachments.map((attachment) => (
                <div key={attachment.id}>
                  <div className="pb-2 w-full">
                    <a
                      href={attachment.url}
                      target="_blank"
                      className="flex items-center p-3 w-full border text-slate-500 text-sm font-[500] rounded-md hover:underline transition-all hover:text-input-border hover:bg-slate-300/20"
                    >
                      <File />
                      <p className="line-clamp-1">{attachment.name}</p>
                    </a>
                  </div>
                  <Separator />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterIdPage;
