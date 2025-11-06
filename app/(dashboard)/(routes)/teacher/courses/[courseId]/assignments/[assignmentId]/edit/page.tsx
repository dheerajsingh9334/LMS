import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateAssignmentForm } from "@/components/assignments/create-assignment-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EditAssignmentPage = async ({
  params
}: {
  params: { courseId: string; assignmentId: string }
}) => {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Verify the teacher owns this course
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId
    },
    select: {
      id: true,
      title: true,
      chapters: {
        select: {
          id: true,
          title: true,
          position: true
        },
        orderBy: {
          position: "asc"
        }
      }
    }
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  // Fetch the assignment
  const assignment = await db.assignment.findUnique({
    where: {
      id: params.assignmentId,
      courseId: params.courseId
    }
  });

  if (!assignment) {
    return redirect(`/teacher/courses/${params.courseId}/assignments`);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href={`/teacher/courses/${params.courseId}/assignments/${params.assignmentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignment
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Edit Assignment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update assignment for {course.title}
          </p>
        </div>

        <CreateAssignmentForm
          courseId={params.courseId}
          chapters={course.chapters}
          initialData={assignment}
          isEditing
        />
      </div>
    </div>
  );
};

export default EditAssignmentPage;
