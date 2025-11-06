"use client";

import { useState, useEffect, useCallback } from "react";
import { FinalExam, FinalExamQuestion, FinalExamAttempt } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Award, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

type FinalExamWithQuestions = FinalExam & {
  questions: FinalExamQuestion[];
};

interface StudentFinalExamProps {
  courseId: string;
  finalExam: FinalExamWithQuestions;
  existingAttempt: FinalExamAttempt | null;
  allChaptersCompleted: boolean;
  isInstructor: boolean;
}

export const StudentFinalExam = ({
  courseId,
  finalExam,
  existingAttempt,
  allChaptersCompleted,
  isInstructor,
}: StudentFinalExamProps) => {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [examState, setExamState] = useState<"not-started" | "in-progress" | "completed">(
    existingAttempt ? "completed" : "not-started"
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleSubmitExam = useCallback(async () => {
    try {
      const response = await axios.post(`/api/courses/${courseId}/final-exams/${finalExam.id}/submit`, {
        answers,
      });

      toast.success("Exam submitted successfully!");
      setExamState("completed");
      
      // Redirect to results or course page
      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit exam");
    }
  }, [courseId, finalExam.id, answers, router]);

  // Initialize timer when exam starts
  useEffect(() => {
    if (examState === "in-progress" && finalExam.timeLimit && timeLeft === null) {
      setTimeLeft(finalExam.timeLimit * 60); // Convert minutes to seconds
    }
  }, [examState, finalExam.timeLimit, timeLeft]);

  // Timer countdown
  useEffect(() => {
    if (examState === "in-progress" && timeLeft && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Time's up, auto-submit
      handleSubmitExam();
    }
  }, [timeLeft, examState, handleSubmitExam]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartExam = async () => {
    setIsStarting(true);
    try {
      // You could add an API call here to log the start time
      setExamState("in-progress");
      toast.success("Final exam started. Good luck!");
    } catch (error) {
      toast.error("Failed to start exam");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  // If user hasn't completed all chapters
  if (!allChaptersCompleted && !isInstructor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Complete All Chapters First</h1>
        <p className="text-gray-600 text-center max-w-md mb-6">
          You need to complete all course chapters before taking the final exam.
        </p>
        <Button onClick={() => router.push(`/courses/${courseId}`)}>
          Back to Course
        </Button>
      </div>
    );
  }

  // Show existing attempt results
  if (existingAttempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          {existingAttempt.passed ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-4">
            {existingAttempt.passed ? "Congratulations!" : "Exam Completed"}
          </h1>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Score:</span>
              <Badge variant={existingAttempt.passed ? "default" : "destructive"}>
                {existingAttempt.score}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Passing Score:</span>
              <span>{finalExam.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span>Grade:</span>
              <span className="font-medium">{existingAttempt.grade}</span>
            </div>
          </div>
          <Button onClick={() => router.push(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  // Exam not started - show info and start button
  if (examState === "not-started") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Award className="h-6 w-6" />
              {finalExam.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {finalExam.description && (
              <p className="text-gray-600 text-center">{finalExam.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {finalExam.questions.length}
                </div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {finalExam.passingScore}%
                </div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
            </div>

            {finalExam.timeLimit && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Time Limit: {finalExam.timeLimit} minutes</span>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Read each question carefully</li>
                <li>• Select the best answer for each question</li>
                <li>• You can review and change your answers before submitting</li>
                {finalExam.timeLimit && (
                  <li>• The exam will auto-submit when time runs out</li>
                )}
                <li>• Make sure you have a stable internet connection</li>
              </ul>
            </div>

            <Button
              onClick={handleStartExam}
              disabled={isStarting}
              className="w-full"
              size="lg"
            >
              {isStarting ? "Starting..." : "Start Final Exam"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam in progress
  if (examState === "in-progress") {
    const currentQuestion = finalExam.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / finalExam.questions.length) * 100;

    return (
      <div className="min-h-screen p-6">
        {/* Header with timer and progress */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b p-4 z-10">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {finalExam.questions.length}</span>
              <div className="w-64 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {timeLeft !== null && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question content */}
        <div className="max-w-4xl mx-auto pt-24 pb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={index}
                      checked={answers[currentQuestion.id] === index}
                      onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                      className="mt-1"
                    />
                    <span>{String.fromCharCode(65 + index)}. {option}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                {currentQuestionIndex < finalExam.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitExam}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Exam
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};