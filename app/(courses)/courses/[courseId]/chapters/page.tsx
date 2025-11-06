import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ChaptersPage = async ({
  params
}: {
  params: { courseId: string };
}) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  // Get the first published chapter of this course
  const firstChapter = await db.chapter.findFirst({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
    orderBy: {
      position: "asc"
    },
    select: {
      id: true,
    }
  });

  if (!firstChapter) {
    // No chapters available, redirect to overview
    return redirect(`/courses/${params.courseId}/overview`);
  }

  // Redirect to the first chapter
  return redirect(`/courses/${params.courseId}/chapters/${firstChapter.id}`);
};

export default ChaptersPage;