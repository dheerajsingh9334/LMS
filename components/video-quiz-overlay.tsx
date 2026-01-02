"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Trophy, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface VideoQuizOverlayProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  onSkip?: () => void;
  onResume?: () => void;
  showTimer?: boolean;
  timeLimit?: number; // seconds per question
}

export const VideoQuizOverlay = ({
  questions,
  onComplete,
  onSkip,
  onResume,
  showTimer = false,
  timeLimit = 30,
}: VideoQuizOverlayProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [answers, setAnswers] = useState<{ questionId: string; correct: boolean }[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer
  useEffect(() => {
    if (!showTimer || isAnswered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return timeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTimer, isAnswered, currentQuestionIndex]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [currentQuestionIndex, timeLimit]);

  const handleSubmit = () => {
    if (selectedAnswer === null && !isAnswered) {
      // Time's up or skipped
      setAnswers([...answers, { questionId: currentQuestion.id, correct: false }]);
      setIsAnswered(true);
      return;
    }

    if (selectedAnswer !== null) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      if (isCorrect) {
        setScore(score + 1);
      }
      setAnswers([...answers, { questionId: currentQuestion.id, correct: isCorrect }]);
      setIsAnswered(true);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = (score / questions.length) * 100;
      onComplete(finalScore);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleSkipQuiz = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Quiz Time! 🎯</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardDescription>
            </div>
            
            {showTimer && !isAnswered && (
              <div className="flex items-center gap-2">
                <Timer className={cn(
                  "h-5 w-5",
                  timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                )} />
                <Badge
                  variant={timeLeft <= 10 ? "destructive" : "secondary"}
                  className="text-lg font-mono min-w-[4ch]"
                >
                  {timeLeft}s
                </Badge>
              </div>
            )}
          </div>

          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Options */}
            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(value) => !isAnswered && setSelectedAnswer(parseInt(value))}
              disabled={isAnswered}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;
                
                let optionStyle = "";
                if (isAnswered) {
                  if (isCorrectAnswer) {
                    optionStyle = "border-green-500 bg-green-50 dark:bg-green-950";
                  } else if (isSelected && !isCorrectAnswer) {
                    optionStyle = "border-red-500 bg-red-50 dark:bg-red-950";
                  }
                }

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                      isAnswered ? optionStyle : "hover:bg-accent",
                      isSelected && !isAnswered && "border-primary bg-primary/5"
                    )}
                    onClick={() => !isAnswered && setSelectedAnswer(index)}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {option}
                    </Label>
                    
                    {isAnswered && (
                      <>
                        {isCorrectAnswer && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {isSelected && !isCorrectAnswer && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div
              className={cn(
                "p-4 rounded-lg border-l-4 animate-in fade-in slide-in-from-top-2",
                isCorrect
                  ? "bg-green-50 dark:bg-green-950 border-green-500"
                  : "bg-red-50 dark:bg-red-950 border-red-500"
              )}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    {isCorrect ? "Correct! 🎉" : "Incorrect"}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score Display */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Current Score:</span>
            </div>
            <Badge variant="secondary" className="text-lg">
              {score} / {currentQuestionIndex + (isAnswered ? 1 : 0)}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          {onSkip && !isAnswered && (
            <Button variant="ghost" onClick={handleSkipQuiz}>
              Skip Quiz
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            {!isAnswered ? (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null}
                  size="lg"
                >
                  Submit Answer
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} size="lg">
                {isLastQuestion ? "Finish Quiz" : "Next Question"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// Quiz Results Component
interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onContinue: () => void;
  onRetake?: () => void;
}

export const QuizResults = ({
  score,
  totalQuestions,
  onContinue,
  onRetake,
}: QuizResultsProps) => {
  const percentage = (score / totalQuestions) * 100;
  const passed = percentage >= 70;

  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {passed ? (
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center animate-in zoom-in">
                <Trophy className="h-10 w-10 text-green-500" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center animate-in zoom-in">
                <AlertCircle className="h-10 w-10 text-yellow-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl">
            {passed ? "Congratulations! 🎉" : "Keep Trying! 💪"}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {passed
              ? "You passed the quiz!"
              : "You need 70% to pass. Review and try again!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <div className="text-6xl font-bold text-primary mb-2">
              {Math.round(percentage)}%
            </div>
            <p className="text-muted-foreground">
              {score} out of {totalQuestions} correct
            </p>
          </div>

          <Progress value={percentage} className="h-3" />

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="font-semibold text-green-600 dark:text-green-400">
                {score}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="font-semibold text-red-600 dark:text-red-400">
                {totalQuestions - score}
              </div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                {totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button onClick={onContinue} size="lg" className="w-full">
            Continue Learning
          </Button>
          {onRetake && !passed && (
            <Button onClick={onRetake} variant="outline" size="lg" className="w-full">
              Retake Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
