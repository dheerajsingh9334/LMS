import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPurchase } from "@/actions/Courses/get-purchase";
import { StudentFinalExam } from "./_components/student-final-exam";

interface FinalExamPageProps {
  params: {
    courseId: string;
  };
}

const FinalExamPage = async ({ params }: FinalExamPageProps) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  const userId = user.id;

  // Get course information
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      isPublished: true,
    },
    include: {
      chapters: {
        include: {
          userProgress: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect("/dashboard");
  }

  // Check if user has access to this course
  const purchase = await checkPurchase(userId, params.courseId);
  const isInstructor = course.userId === userId;

  if (!purchase && !isInstructor) {
    return redirect(`/courses/${params.courseId}`);
  }

  // Check if all chapters are completed
  const completedChapters = course.chapters.filter(chapter =>
    chapter.userProgress?.[0]?.isCompleted
  );

  const allChaptersCompleted = completedChapters.length === course.chapters.length;

  // Get published final exam
  const finalExam = await db.finalExam.findFirst({
    where: {
      courseId: params.courseId,
      isPublished: true,
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-4">Final Exam Not Available</h1>
        <p className="text-gray-600 text-center max-w-md">
          The final exam for this course is not yet available. Please contact your instructor for more information.
        </p>
      </div>
    );
  }

  // Check for existing attempt
  const existingAttempt = await db.finalExamAttempt.findFirst({
    where: {
      userId,
      courseId: params.courseId,
      finalExamId: finalExam.id,
    },
  });

  // These variables are not needed for StudentFinalExam component
  // but we keep allChaptersCompleted for the component prop

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <StudentFinalExam
          courseId={params.courseId}
          finalExam={finalExam}
          existingAttempt={existingAttempt}
          allChaptersCompleted={allChaptersCompleted}
          isInstructor={isInstructor}
        />
      </div>
    </div>
  );
};

export default FinalExamPage;