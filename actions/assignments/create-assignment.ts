"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface CreateAssignmentParams {
  title: string;
  description: string;
  courseId: string;
  chapterId?: string;
  dueDate: Date;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenalty: number;
  allowFileUpload: boolean;
  allowLinkSubmission: boolean;
  allowTextSubmission: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  enablePlagiarismCheck: boolean;
  plagiarismThreshold: number;
  isPublished: boolean;
}

export async function createAssignment(params: CreateAssignmentParams) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the user is a teacher and owns the course
    const course = await db.course.findUnique({
      where: { id: params.courseId },
    });

    if (!course || course.userId !== userId) {
      return { error: "Unauthorized" };
    }

    // Create the assignment
    const assignment = await db.assignment.create({
      data: {
        title: params.title,
        description: params.description,
        courseId: params.courseId,
        chapterId: params.chapterId,
        teacherId: userId,
        dueDate: params.dueDate,
        maxScore: params.maxScore,
        allowLateSubmission: params.allowLateSubmission,
        latePenalty: params.latePenalty,
        allowFileUpload: params.allowFileUpload,
        allowLinkSubmission: params.allowLinkSubmission,
        allowTextSubmission: params.allowTextSubmission,
        maxFileSize: params.maxFileSize,
        allowedFileTypes: params.allowedFileTypes,
        enablePlagiarismCheck: params.enablePlagiarismCheck,
        plagiarismThreshold: params.plagiarismThreshold,
        isPublished: params.isPublished,
      },
    });

    revalidatePath(`/teacher/courses/${params.courseId}`);
    return { success: true, assignment };
  } catch (error) {
    console.error("[CREATE_ASSIGNMENT]", error);
    return { error: "Failed to create assignment" };
  }
}
