import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleHelp, LayoutDashboard } from "lucide-react";

import { db } from "@/lib/db";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";

import { FinalExamTitleForm } from "./_components/final-exam-title-form";
import { FinalExamTimelineForm } from "./_components/final-exam-timeline-form";
import { FinalExamQuestionsForm } from "./_components/final-exam-questions-form";
import { FinalExamActions } from "./_components/final-exam-actions";
import { currentUser } from "@/lib/auth";

const FinalExamIdPage = async ({
  params
}: {
  params: { courseId: string; finalExamId: string }
}) => {
  const user = await currentUser();
  let userId = user?.id ?? "";

  if (!userId) {
    return redirect("/");
  }

  const finalExam = await db.finalExam.findUnique({
    where: {
      id: params.finalExamId,
    },
    include: {
      questions: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!finalExam) {
    return redirect("/")
  }

  const requiredFields = [
    finalExam.title,
    finalExam.timeLimit,
    finalExam.questions.length > 0
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!finalExam.isPublished && (
        <Banner
          variant="warning"
          label="This final exam is unpublished. It will not be visible to students"
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/teacher/courses/${params.courseId}/final-exams`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to final exams
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-2xl font-medium">
                  Final Exam Setup
                </h1>
                <span className="text-sm text-slate-700">
                  Complete all fields {completionText}
                </span>
              </div>
              <FinalExamActions
                disabled={!isComplete}
                courseId={params.courseId}
                finalExamId={params.finalExamId}
                isPublished={finalExam.isPublished}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">
                  Customize your final exam
                </h2>
              </div>
              <FinalExamTitleForm
                initialData={finalExam}
                courseId={params.courseId}
                finalExamId={params.finalExamId}
              />
              <FinalExamTimelineForm
                initialData={finalExam}
                courseId={params.courseId}
                finalExamId={params.finalExamId}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={CircleHelp} />
              <h2 className="text-xl">
                Add Questions
              </h2>
            </div>
            <FinalExamQuestionsForm
              initialData={finalExam.questions}
              courseId={params.courseId}
              finalExamId={params.finalExamId}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default FinalExamIdPage;