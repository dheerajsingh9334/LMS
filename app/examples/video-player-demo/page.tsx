"use client";

import { useState, useEffect } from "react";
import { InteractiveVideoPlayer } from "@/components/interactive-video-player";
import { VideoPlaylist } from "@/components/video-playlist";
import { VideoQuizOverlay, QuizResults } from "@/components/video-quiz-overlay";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Users } from "lucide-react";

// Example usage component
export default function VideoPlayerExample() {
  const [currentVideo, setCurrentVideo] = useState("1");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [courseProgress, setCourseProgress] = useState(33);

  // Example playlist data
  const playlistItems = [
    {
      id: "1",
      title: "Introduction to the Course",
      duration: 600, // 10 minutes
      isCompleted: true,
      isLocked: false,
      isCurrent: currentVideo === "1",
    },
    {
      id: "2",
      title: "Getting Started with Basics",
      duration: 900, // 15 minutes
      isCompleted: false,
      isLocked: false,
      isCurrent: currentVideo === "2",
    },
    {
      id: "3",
      title: "Advanced Concepts",
      duration: 1200, // 20 minutes
      isCompleted: false,
      isLocked: false,
      isCurrent: currentVideo === "3",
    },
    {
      id: "4",
      title: "Final Project",
      duration: 1800, // 30 minutes
      isCompleted: false,
      isLocked: true,
      isCurrent: false,
    },
  ];

  // Example chapters data
  const chapters = [
    { id: "1", title: "Introduction", timestamp: 0 },
    { id: "2", title: "Main Content", timestamp: 120 },
    { id: "3", title: "Examples", timestamp: 300 },
    { id: "4", title: "Summary", timestamp: 450 },
  ];

  // Example quiz questions
  const quizQuestions = [
    {
      id: "q1",
      question: "What is the main purpose of this course?",
      options: [
        "To learn programming basics",
        "To master advanced concepts",
        "To build real-world projects",
        "All of the above",
      ],
      correctAnswer: 3,
      explanation: "This course covers everything from basics to advanced project building.",
    },
    {
      id: "q2",
      question: "Which of these is NOT covered in this module?",
      options: [
        "Introduction to concepts",
        "Advanced techniques",
        "Database design",
        "Practical examples",
      ],
      correctAnswer: 2,
      explanation: "Database design is covered in a later module.",
    },
    {
      id: "q3",
      question: "How many hours of content does this course have?",
      options: [
        "5 hours",
        "10 hours",
        "15 hours",
        "20 hours",
      ],
      correctAnswer: 1,
      explanation: "The course contains approximately 10 hours of video content.",
    },
  ];

  // Example video URL (replace with your actual video)
  const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const handleVideoEnd = () => {
    console.log("Video ended - showing quiz");
    setShowQuiz(true);
  };

  const handleProgress = (progress: number) => {
    console.log(`Video progress: ${progress}%`);
    // Update user progress in database
  };

  const handleVideoClick = (id: string) => {
    setCurrentVideo(id);
    setQuizCompleted(false);
    setShowQuiz(false);
    setShowResults(false);
  };

  const handleQuizComplete = (score: number) => {
    setQuizScore(score);
    setQuizCompleted(true);
    setShowQuiz(false);
    setShowResults(true);

    // Update progress
    setCourseProgress((prev) => Math.min(100, prev + 20));
  };

  const handleContinue = () => {
    setShowResults(false);
    // Navigate to next video
    const currentIndex = playlistItems.findIndex((item) => item.id === currentVideo);
    if (currentIndex < playlistItems.length - 1) {
      setCurrentVideo(playlistItems[currentIndex + 1].id);
    }
  };

  const handleRetakeQuiz = () => {
    setShowResults(false);
    setShowQuiz(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Complete React Course 2024</h1>
          <p className="text-muted-foreground">
            Master React from basics to advanced concepts with hands-on projects
          </p>
        </div>

        <Separator />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <div className="relative">
                <InteractiveVideoPlayer
                  url={videoUrl}
                  title={playlistItems.find((item) => item.id === currentVideo)?.title}
                  courseId="course-123"
                  chapterId={currentVideo}
                  onEnded={handleVideoEnd}
                  onProgress={handleProgress}
                  chapters={chapters}
                  allowDownload={true}
                  showTranscript={false}
                />

                {/* Quiz Overlay */}
                {showQuiz && !quizCompleted && (
                  <VideoQuizOverlay
                    questions={quizQuestions}
                    onComplete={handleQuizComplete}
                    onSkip={() => {
                      setShowQuiz(false);
                      handleContinue();
                    }}
                    showTimer={true}
                    timeLimit={30}
                  />
                )}

                {/* Quiz Results */}
                {showResults && (
                  <QuizResults
                    score={Math.round((quizScore / 100) * quizQuestions.length)}
                    totalQuestions={quizQuestions.length}
                    onContinue={handleContinue}
                    onRetake={handleRetakeQuiz}
                  />
                )}
              </div>
            </Card>

            {/* Tabs for Description, Resources, etc. */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="description">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">
                      <FileText className="h-4 w-4 mr-2" />
                      Description
                    </TabsTrigger>
                    <TabsTrigger value="discussion">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discussion
                    </TabsTrigger>
                    <TabsTrigger value="instructor">
                      <Users className="h-4 w-4 mr-2" />
                      Instructor
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="space-y-4 mt-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">About This Lesson</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        In this comprehensive lesson, you&apos;ll learn the fundamental concepts that
                        will serve as the foundation for your entire learning journey. We&apos;ll cover
                        key topics including setup, basic principles, and hands-on examples.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">What You&apos;ll Learn</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Core concepts and principles</li>
                        <li>Best practices and common patterns</li>
                        <li>Real-world examples and use cases</li>
                        <li>Hands-on coding exercises</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">Resources</h3>
                      <div className="space-y-2">
                        <a
                          href="#"
                          className="block text-primary hover:underline text-sm"
                        >
                          📄 Lesson slides (PDF)
                        </a>
                        <a
                          href="#"
                          className="block text-primary hover:underline text-sm"
                        >
                          💻 Source code repository
                        </a>
                        <a
                          href="#"
                          className="block text-primary hover:underline text-sm"
                        >
                          📝 Practice exercises
                        </a>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="discussion" className="mt-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Discussion feature coming soon!</p>
                      <p className="text-sm mt-2">
                        Share your thoughts and ask questions about this lesson.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="instructor" className="mt-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                        JD
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">John Doe</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Senior Developer & Instructor
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          10+ years of experience in web development. Passionate about teaching
                          and helping students achieve their goals.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Playlist - 1 column */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {playlistItems.length} lessons • {Math.round(courseProgress)}% complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlaylist
                  items={playlistItems}
                  onItemClick={handleVideoClick}
                  totalProgress={courseProgress}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">⚡ Fast Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use playback speed controls to learn at your own pace
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">📝 Take Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add timestamped notes to remember key points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🎯 Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visual progress indicators show your learning journey
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
