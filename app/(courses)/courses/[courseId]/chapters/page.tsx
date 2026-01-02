import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ChaptersPage = async ({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
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
      position: "asc",
    },
    select: {
      id: true,
    },
  });

  if (!firstChapter) {
    // No chapters available, redirect to overview
    return redirect(`/courses/${params.courseId}/overview`);
  }

  // Preserve the Stripe success query param so that
  // CheckoutSuccessHandler can finalize the purchase.
  const successParam = searchParams?.success;
  const redirectUrl = successParam
    ? `/courses/${params.courseId}/chapters/${firstChapter.id}?success=${
        Array.isArray(successParam) ? successParam[0] : successParam
      }`
    : `/courses/${params.courseId}/chapters/${firstChapter.id}`;

  // Redirect to the first chapter (with optional success flag)
  return redirect(redirectUrl);
};

export default ChaptersPage;
