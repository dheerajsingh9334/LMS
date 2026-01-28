import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const QuizzesPage = async ({ params }: { params: { courseId: string } }) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId: user.id,
    },
    include: {
      chapters: {
        include: {
          quizzes: {
            include: {
              questions: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  const allQuizzes = course.chapters.flatMap((chapter) =>
    chapter.quizzes.map((quiz) => ({
      ...quiz,
      chapterTitle: chapter.title,
      chapterId: chapter.id,
    })),
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileQuestion className="h-6 w-6" />
            Course Quizzes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage quizzes for {course.title}
          </p>
        </div>
        <Link href={`/teacher/courses/${params.courseId}`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>

      {allQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No quizzes created yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
              Quizzes are created within individual chapters
            </p>
            <Link href={`/teacher/courses/${params.courseId}#chapters`}>
              <Button>Go to Chapters</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Overview</CardTitle>
              <CardDescription>
                {allQuizzes.length} quiz{allQuizzes.length !== 1 ? "zes" : ""}{" "}
                across {course.chapters.length} chapter
                {course.chapters.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
          </Card>

          {course.chapters.map((chapter) => {
            if (chapter.quizzes.length === 0) return null;

            return (
              <Card key={chapter.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{chapter.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chapter.quizzes.map((quiz) => (
                      <Link
                        key={quiz.id}
                        href={`/teacher/courses/${params.courseId}/chapters/${chapter.id}/quizzes/${quiz.id}`}
                      >
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          <div className="flex items-center gap-3">
                            <FileQuestion className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <div>
                              <h4 className="font-medium">{quiz.title}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {quiz.questions.length} question
                                {quiz.questions.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {quiz.passingScore && (
                              <Badge variant="outline">
                                Pass: {quiz.passingScore}%
                              </Badge>
                            )}
                            <Badge
                              variant={
                                quiz.isPublished ? "default" : "secondary"
                              }
                            >
                              {quiz.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Managing Quizzes
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To create or edit quizzes, navigate to the specific chapter and
              use the quiz management tools there. Each quiz is associated with
              a chapter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizzesPage;
