"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface QuizAttemptFormProps {
  quiz: {
    id: string;
    title: string;
    timeline: number; // in minutes
    questions: Array<{
      id: string;
      text: string;
      type: any; // Use any to handle QuestionType enum
      option1: string | null;
      option2: string | null;
      option3: string | null;
      option4: string | null;
      answer: string | null;
      quizId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  courseId: string;
  chapterId: string;
}

export const QuizAttemptForm = ({
  quiz,
  courseId,
  chapterId,
}: QuizAttemptFormProps) => {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeline * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Calculate score
      let score = 0;
      quiz.questions.forEach(question => {
        if (answers[question.id] === question.answer) {
          score++;
        }
      });

      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/quizzes/${quiz.id}/attempt`,
        {
          answers,
          score,
        }
      );

      toast.success("Quiz submitted successfully!");
      router.refresh();
    } catch (error: any) {
      console.error("Quiz submission error:", error);
      toast.error(error.response?.data?.message || "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, answers, quiz.questions, quiz.id, courseId, chapterId, router]);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgressPercentage = () => {
    return (getAnsweredCount() / quiz.questions.length) * 100;
  };

  if (!quizStarted) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">Quiz Instructions</span>
          </div>
          <ul className="space-y-2 text-blue-700 mb-6">
            <li>• You have {quiz.timeline} minutes to complete this quiz</li>
            <li>• There are {quiz.questions.length} questions in total</li>
            <li>• You can navigate between questions using the navigation buttons</li>
            <li>• Make sure to answer all questions before submitting</li>
            <li>• The quiz will auto-submit when time runs out</li>
          </ul>
          
          <div className="flex justify-center">
            <Button onClick={startQuiz} size="lg" className="px-8">
              Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Timer and Progress */}
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`} />
            <span className={`font-mono text-lg ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Progress: {getAnsweredCount()}/{quiz.questions.length}
            </span>
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant={getAnsweredCount() === quiz.questions.length ? "default" : "outline"}
        >
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={getProgressPercentage()} className="h-2" />
        <p className="text-sm text-gray-600 text-center">
          {Math.round(getProgressPercentage())}% Complete
        </p>
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quiz.questions.map((_, index) => (
          <Button
            key={index}
            variant={
              index === currentQuestion
                ? "default"
                : answers[quiz.questions[index].id]
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => goToQuestion(index)}
            className="w-10 h-10"
          >
            {index + 1}
          </Button>
        ))}
      </div>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            {answers[currentQuestionData.id] && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentQuestionData.text}</h3>
            
            {currentQuestionData.type === "MCQ" ? (
              <RadioGroup
                value={answers[currentQuestionData.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestionData.id, value)}
              >
                {[
                  currentQuestionData.option1,
                  currentQuestionData.option2,
                  currentQuestionData.option3,
                  currentQuestionData.option4,
                ]
                  .filter(Boolean)
                  .map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={option!} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
              </RadioGroup>
            ) : (
              <Input
                value={answers[currentQuestionData.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                placeholder="Enter your answer..."
                className="w-full"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={nextQuestion}
              disabled={currentQuestion === quiz.questions.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warning for unanswered questions */}
      {getAnsweredCount() < quiz.questions.length && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {quiz.questions.length - getAnsweredCount()} questions remaining
            </span>
          </div>
        </div>
      )}
    </div>
  );
};