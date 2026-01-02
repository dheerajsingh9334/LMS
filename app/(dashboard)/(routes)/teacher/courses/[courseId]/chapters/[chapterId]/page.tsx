import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  LayoutDashboard,
  PlusCircle,
  Video,
  FileText,
} from "lucide-react";

import { db } from "@/lib/db";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";

import { ChapterTitleForm } from "./_components/chapter-title-form";
import { ChapterDescriptionForm } from "./_components/chapter-description-form";
import { ChapterVideoForm } from "./_components/chapter-video-form";
import { ChapterVideosForm } from "./_components/chapter-videos-form";
import { ChapterQuizForm } from "./_components/chapter-quiz-form";
import { ChapterAssignmentForm } from "./_components/chapter-assignment-form";
import { ChapterActions } from "./_components/chapter-actions";
import { ChapterPreviewToggle } from "../../_components/chapter-preview-toggle";
import { currentUser } from "@/lib/auth";

const ChapterIdPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const user = await currentUser();
  let userId = user?.id ?? "";

  if (!userId) {
    return redirect("/");
  }

  const chapter = await db.chapter.findUnique({
    where: {
      id: params.chapterId,
      courseId: params.courseId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      videoUrl: true,
      position: true,
      isPublished: true,
      isFree: true,
      isPreview: true,
      courseId: true,
      createdAt: true,
      updatedAt: true,
      chapterVideos: {
        orderBy: {
          position: "asc",
        },
      },
      quizzes: {
        include: {
          questions: true,
        },
      },
      assignments: {
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      },
    },
  });

  if (!chapter) {
    return redirect("/");
  }

  const isQuizCompleted = (quiz: { questions: string | any[] }) => {
    return quiz.questions.length > 0;
  };

  const isQuizzesComplete =
    chapter.quizzes.length > 0 && chapter.quizzes.every(isQuizCompleted);

  const requiredFields = [
    chapter.title,
    chapter.description,
    isQuizzesComplete ? chapter.quizzes : null,
    // Video is now optional - not required for chapter completion
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(
    (field) => field !== null
  ).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!chapter.isPublished && (
        <Banner
          variant="warning"
          label="This chapter is unpublished. It will not be visible in the course"
        />
      )}
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
                <h1 className="text-2xl font-medium">Chapter Creation</h1>
                <span className="text-sm text-slate-700">
                  Complete all fields {completionText}
                </span>
              </div>
              <ChapterActions
                disabled={!isComplete}
                courseId={params.courseId}
                chapterId={params.chapterId}
                isPublished={chapter.isPublished}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">Customize your chapter</h2>
              </div>
              <ChapterTitleForm
                initialData={chapter}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
              <ChapterDescriptionForm
                initialData={chapter}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
              <ChapterQuizForm
                initialData={chapter}
                chapterId={params.chapterId}
                courseId={params.courseId}
              />
              <ChapterAssignmentForm
                initialData={chapter}
                chapterId={params.chapterId}
                courseId={params.courseId}
              />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Video} />
                <h2 className="text-xl">Add a video</h2>
              </div>
              <ChapterVideoForm
                initialData={chapter}
                chapterId={params.chapterId}
                courseId={params.courseId}
              />

              {/* Multiple Videos Form */}
              <ChapterVideosForm
                initialData={chapter}
                chapterId={params.chapterId}
                courseId={params.courseId}
              />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Eye} />
                <h2 className="text-xl">Preview Access</h2>
              </div>
              <div className="mt-2">
                <p className="text-sm text-slate-600 mb-4">
                  Allow students to preview this chapter for free before
                  enrolling in the course.
                </p>
                <ChapterPreviewToggle
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  isPreview={chapter.isPreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterIdPage;
