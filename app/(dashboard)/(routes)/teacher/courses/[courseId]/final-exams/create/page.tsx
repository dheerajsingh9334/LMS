import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import { FinalExamTitleForm } from "./_components/final-exam-title-form";

interface CreateFinalExamPageProps {
  params: {
    courseId: string;
  };
}

const CreateFinalExamPage = async ({ params }: CreateFinalExamPageProps) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId,
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl">
          Name your final exam
        </h1>
        <p className="text-sm text-slate-600">
          What would you like to name your final exam? Don&apos;t worry, you can change this later.
        </p>
        <FinalExamTitleForm courseId={params.courseId} />
      </div>
    </div>
  );
};

export default CreateFinalExamPage;