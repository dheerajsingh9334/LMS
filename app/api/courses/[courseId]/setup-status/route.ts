import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is the course instructor
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      include: {
        chapters: {
          include: {
            assignments: {
              include: {
                submissions: {
                  where: {
                    status: {
                      in: ['submitted', 'graded']
                    }
                  }
                }
              },
              where: {
                isPublished: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check setup steps
    const steps = [];

    // Step 1: Check if assignments are verified
    const totalAssignments = course.chapters.reduce((acc, ch) => 
      acc + ch.assignments.length, 0
    );
    
    const assignmentsWithSubmissions = course.chapters.reduce((acc, ch) => 
      acc + ch.assignments.filter(assignment => 
        assignment.submissions.length > 0
      ).length, 0
    );

    const verifiedAssignments = course.chapters.reduce((acc, ch) => 
      acc + ch.assignments.filter(assignment => 
        assignment.verificationStatus === 'verified' && assignment.submissions.length > 0
      ).length, 0
    );

    steps.push({
      id: "verify-assignments",
      title: "Verify Assignment Submissions",
      description: `Review and verify student assignment submissions (${verifiedAssignments}/${assignmentsWithSubmissions} verified)`,
      completed: assignmentsWithSubmissions === 0 || verifiedAssignments === assignmentsWithSubmissions,
      action: assignmentsWithSubmissions > verifiedAssignments ? {
        label: "Review Assignments",
        href: `/teacher/courses/${params.courseId}/assignments`
      } : undefined
    });

    // Step 2: Check if final exam is enabled and has questions
    const hasQuestions = course.finalExamQuestions && 
      (course.finalExamQuestions as any[]).length > 0;

    steps.push({
      id: "create-final-exam",
      title: "Create Final Exam Questions",
      description: `Create questions for the final exam ${hasQuestions ? `(${(course.finalExamQuestions as any[]).length} questions created)` : '(0 questions)'}`,
      completed: hasQuestions,
      action: !hasQuestions ? {
        label: "Create Questions",
        href: `/teacher/courses/${params.courseId}/final-exams`
      } : undefined
    });

    steps.push({
      id: "enable-final-exam",
      title: "Enable Final Exam",
      description: "Enable the final exam for students to access",
      completed: course.finalExamEnabled,
      action: !course.finalExamEnabled ? {
        label: "Enable Exam",
        href: `/teacher/courses/${params.courseId}/final-exams`
      } : undefined
    });

    return NextResponse.json({
      steps,
      summary: {
        totalSteps: steps.length,
        completedSteps: steps.filter(s => s.completed).length,
        isSetupComplete: steps.every(s => s.completed)
      }
    });

  } catch (error) {
    console.log("[SETUP_STATUS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}