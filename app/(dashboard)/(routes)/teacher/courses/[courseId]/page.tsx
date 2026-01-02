import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import {
  CircleDollarSign,
  LayoutDashboard,
  ListChecks,
  File,
  Video,
  GraduationCap,
  Award,
  Pencil,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { TitleForm } from "./_components/title-form";
import { ImageForm } from "./_components/image-form";
import { AttachmentForm } from "./_components/attachment-form";
import { currentUser } from "@/lib/auth";
import { DescriptionForm } from "./_components/description-form";
import { Banner } from "@/components/banner";
import { CategoryForm } from "./_components/category-form";
import { ChaptersForm } from "./_components/chapters-form";
import { Actions } from "./_components/actions";
import { LiveSessionForm } from "./_components/live-session-form";
import { PriceForm } from "./_components/price-form";
import { LearningOutcomesForm } from "./_components/learning-outcomes-form";
import { TagsForm } from "./_components/tags-form";
import { PrerequisitesForm } from "./_components/prerequisites-form";
import { HighlightsForm } from "./_components/highlights-form";
import { ProjectsForm } from "./_components/projects-form";
import { AudienceForm } from "./_components/audience-form";
import { FAQForm } from "./_components/faq-form";
import { PromoVideoForm } from "./_components/promo-video-form";
import { TestimonialsManagement } from "./_components/testimonials-management";
import { CourseNavbar } from "@/components/course-navbar";
import { CertificateManager } from "./_components/certificate-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateTemplateForm } from "./certificates/_components/certificate-template-form";
import { CertificateRequirements } from "./certificates/_components/certificate-requirements";
import { IssuedCertificatesList } from "./certificates/_components/issued-certificates-list";

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const user = await currentUser();
  let userId = user?.id ?? "";

  if (!userId) {
    return redirect("/");
  }

  // Optimized query with only necessary fields
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      imageUrl: true,
      price: true,
      isFree: true,
      isPublished: true,
      adminComment: true,
      categoryId: true,
      learningOutcomes: true,
      tags: true,
      prerequisites: true,
      courseObjectives: true,
      highlights: true,
      projectsIncluded: true,
      whoIsThisFor: true,
      faqs: true,
      promoVideoUrl: true,
      promoVideoType: true,
      finalExamQuestions: true,
      finalExamEnabled: true,
      createdAt: true,
      updatedAt: true,
      chapters: {
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
        },
        orderBy: {
          position: "asc",
        },
      },
      attachments: {
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
          fileType: true,
          courseId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      certificateTemplate: true,
    },
  });

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Fetch testimonials
  const testimonials = await db.testimonial.findMany({
    where: {
      courseId: params.courseId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Check for active live session
  const activeLiveSession = await db.liveSession.findFirst({
    where: {
      courseId: params.courseId,
      isLive: true,
    },
  });

  // Counts for requirements tabs
  const totalQuizzes = await db.quiz.count({
    where: {
      chapter: {
        courseId: params.courseId,
        isPublished: true,
      },
      isPublished: true,
    },
  });

  const totalAssignments = await db.assignment.count({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
  });

  // Recent issued certificates (for issued tab)
  const courseCertificates = await db.certificate.findMany({
    where: {
      courseId: params.courseId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  if (!course) {
    return redirect("/");
  }

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.categoryId,
    course.isFree || course.price,
    course.chapters.some((chapter) => chapter.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!course.isPublished && (
        <Banner
          label={
            course.adminComment
              ? `This course was unpublished by admin: ${course.adminComment}`
              : "This course is unpublished. It will not be visible to the students."
          }
        />
      )}
      <CourseNavbar courseId={params.courseId} />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">Course setup</h1>
            <span className="text-sm text-slate-700">
              Complete all fields {completionText}
            </span>
          </div>
          <Actions
            disabled={!isComplete}
            courseId={params.courseId}
            isPublished={course.isPublished}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Customize your course</h2>
            </div>
            <TitleForm initialData={course} courseId={course.id} />
            <DescriptionForm initialData={course} courseId={course.id} />
            <ImageForm initialData={course} courseId={course.id} />
            <CategoryForm
              initialData={course}
              courseId={course.id}
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />
            <PriceForm initialData={course} courseId={course.id} />
            <LearningOutcomesForm initialData={course} courseId={course.id} />
            <TagsForm initialData={course} courseId={course.id} />
            <PrerequisitesForm initialData={course} courseId={course.id} />
            <HighlightsForm initialData={course} courseId={course.id} />
            <ProjectsForm initialData={course} courseId={course.id} />
            <AudienceForm initialData={course} courseId={course.id} />
            <FAQForm initialData={course} courseId={course.id} />
            <PromoVideoForm initialData={course} courseId={course.id} />
            <TestimonialsManagement
              courseId={course.id}
              testimonials={testimonials}
            />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">Course chapters</h2>
              </div>
              <ChaptersForm initialData={course} courseId={course.id} />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={File} />
                <h2 className="text-xl">Resources & Attachments</h2>
              </div>
              <AttachmentForm initialData={course} courseId={course.id} />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Video} />
                <h2 className="text-xl">Live Streaming</h2>
              </div>
              <div className="mt-2">
                <LiveSessionForm
                  courseId={course.id}
                  activeLiveSession={activeLiveSession}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={GraduationCap} />
                <h2 className="text-xl">Final Exam</h2>
              </div>
              <div className="mt-2">
                <div className="border bg-slate-100 rounded-md p-4">
                  <div className="font-medium flex items-center justify-between">
                    Manage Final Exams
                    <Link href={`/teacher/courses/${course.id}/final-exams`}>
                      <Button variant="ghost">
                        <Pencil className="h-4 w-4 mr-2" />
                        Manage Exams
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm mt-2">
                    Create and manage comprehensive final exams for your course
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Video} />
                <h2 className="text-xl">Live Sessions</h2>
              </div>
              <div className="mt-2">
                <LiveSessionForm
                  courseId={course.id}
                  activeLiveSession={activeLiveSession}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Award} />
                <h2 className="text-xl">Certificate Template</h2>
              </div>
              <div className="mt-2">
                <CertificateManager
                  courseId={course.id}
                  certificateTemplate={course.certificateTemplate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
