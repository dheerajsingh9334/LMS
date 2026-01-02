import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

interface FinalExamsPageProps {
  params: {
    courseId: string;
  };
}

const FinalExamsPage = async ({ params }: FinalExamsPageProps) => {
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

  const finalExams = await db.finalExam.findMany({
    where: {
      courseId: params.courseId,
    },
    include: {
      questions: true,
      attempts: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <Link
            href={`/teacher/courses/${params.courseId}`}
            className="flex items-center text-sm hover:opacity-75 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to course setup
          </Link>
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-y-2">
              <h1 className="text-2xl font-medium">
                Course Final Exams
              </h1>
              <span className="text-sm text-slate-700">
                Create and manage final exams for &quot;{course.title}&quot;
              </span>
            </div>
            <Link href={`/teacher/courses/${params.courseId}/final-exams/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Final Exam
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <DataTable columns={columns} data={finalExams} />
      </div>
    </div>
  );
};

export default FinalExamsPage;