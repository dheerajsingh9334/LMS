"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface GradeSubmissionParams {
  submissionId: string;
  score: number;
  feedback?: string;
}

export async function gradeSubmission(params: GradeSubmissionParams) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get submission with assignment details
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: params.submissionId },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      return { error: "Submission not found" };
    }

    // Verify the grader is the teacher of the course
    if (submission.assignment.course.userId !== userId) {
      return { error: "Unauthorized" };
    }

    // Validate score
    if (params.score < 0 || params.score > submission.assignment.maxScore) {
      return { error: `Score must be between 0 and ${submission.assignment.maxScore}` };
    }

    // Apply late penalty if applicable
    let finalScore = params.score;
    if (submission.isLate && submission.assignment.allowLateSubmission) {
      const penaltyAmount = (params.score * submission.assignment.latePenalty * submission.daysLate) / 100;
      finalScore = Math.max(0, params.score - penaltyAmount);
    }

    // Update submission with grade
    const gradedSubmission = await db.assignmentSubmission.update({
      where: { id: params.submissionId },
      data: {
        score: Math.round(finalScore),
        feedback: params.feedback,
        gradedAt: new Date(),
        gradedBy: userId,
        status: "graded",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath(`/teacher/courses/${submission.assignment.courseId}/assignments/${submission.assignment.id}`);
    return { success: true, submission: gradedSubmission };
  } catch (error) {
    console.error("[GRADE_SUBMISSION]", error);
    return { error: "Failed to grade submission" };
  }
}

export async function getSubmissionsForAssignment(assignmentId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get assignment and verify teacher
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    if (assignment.course.userId !== userId) {
      return { error: "Unauthorized" };
    }

    // Get all submissions for this assignment
    const submissions = await db.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        grader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return { success: true, submissions, assignment };
  } catch (error) {
    console.error("[GET_SUBMISSIONS]", error);
    return { error: "Failed to fetch submissions" };
  }
}
