import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizAttemptForm } from "./_components/quiz-attempt-form";

interface QuizPageProps {
  params: {
    courseId: string;
    chapterId: string;
    quizId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const QuizPage = async ({ params, searchParams }: QuizPageProps) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Get quiz details with questions
  const quiz = await db.quiz.findUnique({
    where: {
      id: params.quizId,
    },
    include: {
      chapter: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
        },
      },
      questions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      quizAttempts: {
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!quiz || !quiz.isPublished) {
    return redirect(`/courses/${params.courseId}/chapters/${params.chapterId}`);
  }

  // Check if user has purchased the course
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      },
    },
  });

  const isPurchased = !!purchase && purchase.paymentStatus === "completed";
  const isInstructor = quiz.chapter.course.userId === user.id;

  if (!isPurchased && !isInstructor) {
    return redirect(`/courses/${params.courseId}/overview`);
  }

  const isRetake = searchParams?.retake === "1";

  const userAttempt = !isRetake ? quiz.quizAttempts[0] : undefined; // Most recent attempt
  const hasAttempted = !!userAttempt;

  // Calculate score percentage
  const scorePercentage =
    hasAttempted && quiz.questions.length > 0
      ? Math.round((userAttempt.score / quiz.questions.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/courses/${params.courseId}/chapters/${params.chapterId}`}
          >
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chapter
            </Button>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {quiz.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    {quiz.chapter.course.title}
                  </span>
                  <span>• {quiz.chapter.title}</span>
                </div>
              </div>

              {/* Status Badge */}
              {hasAttempted && (
                <Badge
                  variant={scorePercentage >= 70 ? "default" : "secondary"}
                >
                  {scorePercentage >= 70 ? "Passed" : "Attempted"}
                </Badge>
              )}
            </div>

            {/* Quiz Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">Time Limit</p>
                  <p className="text-gray-600">{quiz.timeline} minutes</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">Questions</p>
                  <p className="text-gray-600">
                    {quiz.questions.length} questions
                  </p>
                </div>
              </div>

              {hasAttempted && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium">Your Score</p>
                    <p className="text-gray-600">
                      {userAttempt.score}/{quiz.questions.length} (
                      {scorePercentage}%)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Description */}
            {quiz.description && (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                <div className="whitespace-pre-wrap text-gray-700">
                  {quiz.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {hasAttempted ? "Quiz Results" : "Take Quiz"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAttempted ? (
              <div className="space-y-6">
                {/* Results Summary */}
                <div
                  className={`p-4 rounded-lg border ${
                    scorePercentage >= 70
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {scorePercentage >= 70 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        scorePercentage >= 70
                          ? "text-green-800"
                          : "text-yellow-800"
                      }`}
                    >
                      Quiz {scorePercentage >= 70 ? "Passed" : "Completed"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Score:</p>
                      <p
                        className={
                          scorePercentage >= 70
                            ? "text-green-700"
                            : "text-yellow-700"
                        }
                      >
                        {userAttempt.score} out of {quiz.questions.length} (
                        {scorePercentage}%)
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Completed:</p>
                      <p
                        className={
                          scorePercentage >= 70
                            ? "text-green-700"
                            : "text-yellow-700"
                        }
                      >
                        {new Date(userAttempt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Status:</p>
                      <p
                        className={
                          scorePercentage >= 70
                            ? "text-green-700"
                            : "text-yellow-700"
                        }
                      >
                        {scorePercentage >= 70
                          ? "Passing Grade"
                          : "Below Passing Grade"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Retake Option */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 mb-3">
                    {scorePercentage < 70
                      ? "You scored below the passing grade of 70%. You can retake the quiz to improve your score."
                      : "You have passed this quiz. You can retake it anytime to practice or try for a better score."}
                  </p>
                  <Link
                    href={`/courses/${params.courseId}/chapters/${params.chapterId}/quiz/${params.quizId}?retake=1`}
                  >
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Retake Quiz
                    </Button>
                  </Link>
                </div>

                {/* Question Review */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Question Review
                  </h3>
                  <div className="space-y-4">
                    {quiz.questions.map((question, index) => {
                      const userAnswer =
                        userAttempt.answers &&
                        typeof userAttempt.answers === "object"
                          ? (userAttempt.answers as any)[question.id]
                          : null;
                      const isCorrect = userAnswer === question.answer;

                      return (
                        <div
                          key={question.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium">
                              Question {index + 1}: {question.text}
                            </h4>
                            <Badge
                              variant={isCorrect ? "default" : "destructive"}
                            >
                              {isCorrect ? "Correct" : "Incorrect"}
                            </Badge>
                          </div>

                          {question.type === "MCQ" && (
                            <div className="space-y-2 text-sm">
                              {[
                                question.option1,
                                question.option2,
                                question.option3,
                                question.option4,
                              ]
                                .filter(Boolean)
                                .map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded ${
                                      option === question.answer
                                        ? "bg-green-100 border border-green-300"
                                        : option === userAnswer && !isCorrect
                                        ? "bg-red-100 border border-red-300"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      {option === question.answer && (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      )}
                                      {option === userAnswer && !isCorrect && (
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                      )}
                                      {option}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="mt-3 text-sm text-gray-600">
                            <p>
                              <strong>Your answer:</strong>{" "}
                              {userAnswer || "No answer"}
                            </p>
                            <p>
                              <strong>Correct answer:</strong> {question.answer}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <QuizAttemptForm
                quiz={quiz}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizPage;
