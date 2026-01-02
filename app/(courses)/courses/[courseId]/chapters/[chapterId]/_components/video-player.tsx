"use client"
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { Question } from "@prisma/client";
import QuizCard from "./quiz-card";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeline: number;
  isPublished: boolean;
  position: number;
  chapterId: string;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
}

interface VideoPlayerProps {
  videoUrl: string;
  courseId: string;
  chapterId: string;
  nextChapterId?: string;
  isLocked: boolean;
  completeOnEnd: boolean;
  title: string;
  quizTimelineSeconds: number;
  quizzes: Quiz[];
}

export const VideoPlayer = ({
  videoUrl,
  courseId,
  chapterId,
  nextChapterId,
  isLocked,
  completeOnEnd,
  title,
  quizTimelineSeconds,
  quizzes,
}: VideoPlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [showQuizBlocker, setShowQuizBlocker] = useState(false);
  const [showQuizCard, setShowQuizCard] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [resumeTime, setResumeTime] = useState<number | null>(null);
  // Use streaming API endpoint for better performance
  const streamUrl = `/api/video/${chapterId}`;
  const [updatedVideoUrl, setUpdatedVideoUrl] = useState<string>(streamUrl);
  const router = useRouter();
  const confetti = useConfettiStore();
  const playerRef = useRef<any>(null);
  
  // Analytics tracking
  const watchTimeRef = useRef(0);
  const lastProgressRef = useRef(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track video watch time
  const trackVideo = async (watchTime: number, completed: boolean, dropOffPoint?: number) => {
    try {
      await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/track-video`, {
        watchTime,
        completed,
        dropOffPoint,
      });
    } catch (error) {
      console.error("Failed to track video:", error);
    }
  };

  const handleEnd = async () => {
    try {
      // Track final watch time
      await trackVideo(watchTimeRef.current, true);
      
      if (completeOnEnd) {
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
          isCompleted: true,
        });

        if (!nextChapterId) {
          confetti.onOpen();
        }

        toast.success("Progress updated");
        router.refresh();

        if (nextChapterId) {
          router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error("Something went wrong");
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
  };

  const startQuiz = () => {
    if (quizzes.length > 0) {
      setShowQuizBlocker(false);
      setShowQuizCard(true);
    } else {
      console.error("No quizzes found for this chapter");
    }
  };

  const handleQuizComplete = (quizTimeline: number) => {
    setQuizCompleted(true);
    setShowQuizCard(false);
    setCurrentQuizIndex(currentQuizIndex + 1);
    setResumeTime(quizTimeline);
    router.refresh();
  };

  useEffect(() => {
    if (currentQuizIndex < quizzes.length) {
      setQuizCompleted(false);
    }
  }, [currentQuizIndex, quizzes.length]);

  useEffect(() => {
    if (resumeTime !== null && playerRef.current) {
      playerRef.current.seekTo(resumeTime, "seconds");
    }
  }, [resumeTime]);

  useEffect(() => {
    if (resumeTime !== null) {
      const newVideoUrl = `${streamUrl}#t=${resumeTime}`;
      setUpdatedVideoUrl(newVideoUrl);
    }
  }, [resumeTime, streamUrl]);

  // Track watch time every 30 seconds
  useEffect(() => {
    if (isReady && !isLocked) {
      trackingIntervalRef.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const timeSinceLastTrack = currentTime - lastProgressRef.current;
          
          if (timeSinceLastTrack > 0) {
            watchTimeRef.current += timeSinceLastTrack;
            trackVideo(Math.floor(timeSinceLastTrack), false);
            lastProgressRef.current = currentTime;
          }
        }
      }, 30000); // Track every 30 seconds

      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
        }
      };
    }
  }, [isReady, isLocked, courseId, chapterId]);

  return (
    <div className="relative aspect-video">
      {!isReady && !isLocked && (
        <>
          <Skeleton className="absolute inset-0 flex items-center justify-center" />
          <Loader2 className="h-8 w-8 animate-spin absolute text-secondary top-[46%] left-[46%] text-gray-800" />
        </>
      )}
      {showQuizBlocker && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 flex-col gap-y-2 text-secondary z-50">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p className="text-lg font-semibold">Quiz Available!</p>
            <p className="text-sm text-gray-300">Test your knowledge on this topic</p>
            <div className="flex gap-3">
              <button
                onClick={startQuiz}
                className="px-6 py-2 bg-custom-primary text-white rounded-md hover:bg-custom-primary/90 transition-colors"
              >
                Take Quiz
              </button>
              <button
                onClick={() => {
                  setShowQuizBlocker(false);
                  setQuizCompleted(true);
                  setCurrentQuizIndex(currentQuizIndex + 1);
                  if (playerRef.current) {
                    playerRef.current.seekTo(resumeTime || 0);
                  }
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Skip Quiz
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">You can take the quiz later from the Quizzes tab</p>
          </div>
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 flex-col gap-y-2 text-secondary">
          <Lock className="h-8 w-8" />
          <p className="text-sm">This chapter is locked</p>
        </div>
      )}
      {!isLocked && !showQuizBlocker && !showQuizCard && (
        <ReactPlayer
          ref={playerRef}
          url={updatedVideoUrl}
          controls
          width="100%"
          height="100%"
          onProgress={(progress) => {
            if (
              !quizCompleted &&
              currentQuizIndex < quizzes.length &&
              progress.playedSeconds >= quizzes[currentQuizIndex].timeline
            ) {
              setShowQuizBlocker(true);
              setResumeTime(progress.playedSeconds); // Store the resume time
              playerRef.current?.pause();
            }
          }}
          onEnded={handleEnd}
          onCanPlay={() => setIsReady(true)}
          onContextMenu={handleRightClick}
          className="react-player"
          config={{
            file: {
              attributes: {
                controlsList: "nodownload",
              },
            },
          }}
        />
      )}
      {showQuizCard && currentQuizIndex < quizzes.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 text-white">
          <QuizCard
            questions={quizzes[currentQuizIndex].questions}
            onQuizComplete={handleQuizComplete}
            quizId={quizzes[currentQuizIndex].id}
            quizTimeline={quizzes[currentQuizIndex].timeline}
          />
        </div>
      )}
    </div>
  );
};
