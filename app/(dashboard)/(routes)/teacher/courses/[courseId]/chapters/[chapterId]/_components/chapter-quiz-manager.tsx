"use client";

import { useState } from "react";
import { Chapter, Quiz, Question } from "@prisma/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChapterQuizForm } from "./chapter-quiz-form";
import { QuizQuestionsForm } from "../quizzes/[quizId]/_components/quiz-question-form";

type ChapterWithQuizzesAndQuestions = Chapter & {
  quizzes: (Quiz & { questions: Question[] })[];
};

interface ChapterQuizManagerProps {
  initialData: ChapterWithQuizzesAndQuestions;
  courseId: string;
  chapterId: string;
}

export const ChapterQuizManager = ({
  initialData,
  courseId,
  chapterId,
}: ChapterQuizManagerProps) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string | undefined>(
    initialData.quizzes[0]?.id
  );

  const handleQuizCreated = (quizId: string) => {
    setSelectedQuizId(quizId);
  };

  const handleQuizSelected = (quizId: string) => {
    setSelectedQuizId(quizId);
  };

  const selectedQuiz = initialData.quizzes.find(
    (quiz) => quiz.id === selectedQuizId
  );

  return (
    <div className="space-y-6">
      <ChapterQuizForm
        initialData={initialData}
        courseId={courseId}
        chapterId={chapterId}
        onQuizCreated={handleQuizCreated}
        onQuizSelected={handleQuizSelected}
      />

      {selectedQuiz && (
        <Card className="mt-6 border bg-slate-100">
          <CardHeader>
            <CardTitle>Quiz Questions</CardTitle>
            <CardDescription>
              Add and manage all questions for the quiz {selectedQuiz.title}{" "}
              directly from the chapter setup, similar to the final exam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuizQuestionsForm
              initialData={selectedQuiz.questions}
              courseId={courseId}
              chapterId={chapterId}
              quizId={selectedQuiz.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChapterQuizManager;
