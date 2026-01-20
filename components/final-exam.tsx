"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  BookOpen,
  Lock,
  Trophy,
  Star,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinalExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
}

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  grade: string;
  certificateEligible: boolean;
}

interface FinalExamProps {
  courseId: string;
  courseName: string;
  isEligible: boolean;
  eligibilityReason?: string;
  progress?: {
    chaptersCompleted: number;
    totalChapters: number;
    quizzesCompleted: number;
    totalQuizzes: number;
    assignmentsCompleted: number;
    totalAssignments: number;
  };
}

export const FinalExam = ({
  courseId,
  courseName,
  isEligible,
  eligibilityReason,
  progress,
}: FinalExamProps) => {
  const [examState, setExamState] = useState<
    "eligibility" | "instructions" | "taking" | "completed"
  >("eligibility");
  const [questions, setQuestions] = useState<FinalExamQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(false);

  const submitExam = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/final-exam/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questions,
            userAnswers,
            timeSpent: 90 * 60 - timeRemaining,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setExamState("completed");
      }
    } catch (error) {
      console.error("Failed to submit exam:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, questions, userAnswers, timeRemaining]);

  // Timer effect
  useEffect(() => {
    if (examState === "taking" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            submitExam(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examState, timeRemaining, submitExam]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const startExam = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/final-exam/generate`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        setUserAnswers(new Array(data.questions.length).fill(-1));
        setExamState("taking");
        setTimeRemaining(90 * 60); // Reset timer
      }
    } catch (error) {
      console.error("Failed to start exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "A":
        return "text-green-600 bg-green-50 border-green-200";
      case "B":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "C":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "D":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (score >= 80) return <Award className="h-6 w-6 text-green-500" />;
    if (score >= 70) return <Target className="h-6 w-6 text-blue-500" />;
    return <AlertTriangle className="h-6 w-6 text-red-500" />;
  };

  if (examState === "eligibility") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <CardTitle className="text-2xl">
                Final Comprehensive Exam
              </CardTitle>
            </div>
            <p className="text-gray-600">
              Complete your learning journey with the {courseName} final
              examination
            </p>
          </CardHeader>
          <CardContent>
            {!isEligible ? (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-orange-600 mr-2" />
                    <h3 className="font-semibold text-orange-800">
                      Exam Locked
                    </h3>
                  </div>
                  <p className="text-orange-700 mt-2">{eligibilityReason}</p>
                </div>

                {progress && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Chapters</span>
                        <span className="text-sm text-gray-600">
                          {progress.chaptersCompleted}/{progress.totalChapters}
                        </span>
                      </div>
                      <Progress
                        value={
                          (progress.chaptersCompleted /
                            progress.totalChapters) *
                          100
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Quizzes</span>
                        <span className="text-sm text-gray-600">
                          {progress.quizzesCompleted}/{progress.totalQuizzes}
                        </span>
                      </div>
                      <Progress
                        value={
                          progress.totalQuizzes > 0
                            ? (progress.quizzesCompleted /
                                progress.totalQuizzes) *
                              100
                            : 100
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Assignments</span>
                        <span className="text-sm text-gray-600">
                          {progress.assignmentsCompleted}/
                          {progress.totalAssignments}
                        </span>
                      </div>
                      <Progress
                        value={
                          progress.totalAssignments > 0
                            ? (progress.assignmentsCompleted /
                                progress.totalAssignments) *
                              100
                            : 100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-800">
                      Eligible for Final Exam
                    </h3>
                  </div>
                  <p className="text-green-700 mt-2">
                    Congratulations! You&apos;ve completed all requirements and
                    are now eligible to take the final exam.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-4">
                    Exam Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-600 mr-2" />
                      <span>Duration: 90 minutes</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-blue-600 mr-2" />
                      <span>Pass Score: 65%</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-green-600 mr-2" />
                      <span>Certificate: 80%+</span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-600 mr-2" />
                      <span>Excellence: 90%+</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => setExamState("instructions")}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Proceed to Exam Instructions
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examState === "instructions") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Final Exam Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Important Guidelines
              </h3>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                <li>You have 90 minutes to complete the exam</li>
                <li>The exam will auto-submit when time runs out</li>
                <li>You can review and change answers before submitting</li>
                <li>Minimum 65% score required to pass</li>
                <li>80%+ score required for course certificate</li>
                <li>
                  This exam covers all course content including chapters,
                  quizzes, and assignments
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">
                Academic Integrity
              </h3>
              <p className="text-sm text-red-700">
                This is a proctored exam. Please ensure you complete it
                independently without external help. Any form of cheating will
                result in immediate disqualification.
              </p>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setExamState("eligibility")}
              >
                Back
              </Button>
              <Button
                onClick={startExam}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Loading Questions..." : "Start Final Exam"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examState === "completed" && result) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {getScoreIcon(result.score)}
              <CardTitle className="text-2xl ml-3">Exam Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{result.score}%</div>
              <Badge
                className={cn(
                  "text-base px-4 py-2 border",
                  getGradeColor(result.grade),
                )}
              >
                Grade: {result.grade}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">
                  {result.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.totalQuestions - result.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            {result.certificateEligible ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  🎉 Congratulations! Certificate Earned!
                </h3>
                <p className="text-green-700 mb-4">
                  You&apos;ve achieved {result.score}% and earned your course
                  completion certificate!
                </p>
                <Button className="bg-green-600 hover:bg-green-700">
                  Download Certificate
                </Button>
              </div>
            ) : result.passed ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Exam Passed!
                </h3>
                <p className="text-blue-700">
                  You passed with {result.score}%. You need 80%+ for a
                  certificate.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Exam Not Passed
                </h3>
                <p className="text-red-700">
                  You scored {result.score}%. Minimum 65% required to pass. You
                  can retake the exam.
                </p>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = `/courses/${courseId}/certificate`)
                }
                disabled={!result.certificateEligible}
              >
                View Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Taking exam state
  if (examState === "taking" && questions.length > 0) {
    const question = questions[currentQuestion];
    const progressPercent = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
            <Badge
              className={cn(
                "text-xs",
                question.difficulty === "EASY"
                  ? "bg-green-100 text-green-800"
                  : question.difficulty === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800",
              )}
            >
              {question.difficulty}
            </Badge>
            <Badge variant="outline">{question.topic}</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-red-600">
              <Clock className="h-4 w-4 mr-1" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>

        <Progress value={progressPercent} className="mb-6" />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(currentQuestion, index)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    userAnswers[currentQuestion] === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center",
                        userAnswers[currentQuestion] === index
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300",
                      )}
                    >
                      {userAnswers[currentQuestion] === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestion(Math.max(0, currentQuestion - 1))
                }
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={submitExam}
                  disabled={loading || userAnswers.includes(-1)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Submitting..." : "Submit Exam"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentQuestion(
                      Math.min(questions.length - 1, currentQuestion + 1),
                    )
                  }
                  disabled={currentQuestion === questions.length - 1}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading exam...</p>
        </CardContent>
      </Card>
    </div>
  );
};
