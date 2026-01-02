import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const CourseLiveIndexPage = async ({
  params,
}: {
  params: { courseId: string };
}) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // If teacher, send to teacher live sessions dashboard
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: { userId: true },
  });

  if (!course) {
    return redirect("/dashboard");
  }

  if (course.userId === user.id) {
    return redirect(`/teacher/courses/${params.courseId}/live-sessions`);
  }

  // Ensure student is enrolled/purchased
  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      },
    },
  });

  if (!purchase) {
    return redirect(`/courses/${params.courseId}/overview`);
  }

  // Find active live session
  const liveSession = await db.liveSession.findFirst({
    where: {
      courseId: params.courseId,
      isLive: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (!liveSession) {
    // No current live session – send back to course overview
    return redirect(`/courses/${params.courseId}/overview`);
  }

  // Redirect student to the concrete live session route
  return redirect(`/courses/${params.courseId}/live/${liveSession.id}`);
};

export default CourseLiveIndexPage;
