import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ChaptersForm } from "../_components/chapters-form";

const ChaptersPage = async ({ params }: { params: { courseId: string } }) => {
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
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Course Chapters</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage the chapters for {course.title}
          </p>
        </div>
        <Link href={`/teacher/courses/${params.courseId}`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>

      <ChaptersForm initialData={course} courseId={course.id} />
    </div>
  );
};

export default ChaptersPage;
