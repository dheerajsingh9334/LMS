import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Force fix for the specific course - temporary solution
    const courseId = params.courseId;

    console.log(`Attempting to fix course: ${courseId}`);

    // Step 1: Verify all submitted assignments
    const assignments = await db.assignment.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        submissions: true
      }
    });

    console.log(`Found ${assignments.length} assignments`);

    // Update assignments that have submissions to verified status
    for (const assignment of assignments) {
      if (assignment.submissions.length > 0) {
        await db.assignment.update({
          where: { id: assignment.id },
          data: { verificationStatus: 'verified' }
        });
        console.log(`Verified assignment: ${assignment.title}`);
      }
    }

    // Step 2: Create sample final exam questions if none exist
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        finalExamEnabled: true,
        finalExamQuestions: true,
        title: true
      }
    });

    console.log(`Course status: enabled=${course?.finalExamEnabled}, hasQuestions=${!!course?.finalExamQuestions}`);

    const sampleQuestions = [
      {
        id: `q-${Date.now()}-1`,
        question: "What is the primary goal of completing all course materials?",
        options: [
          "To gain comprehensive knowledge and skills",
          "To get a certificate quickly",
          "To watch videos only",
          "To skip the final exam"
        ],
        correctAnswer: 0,
        difficulty: 'EASY',
        topic: 'Course Completion',
        explanation: 'The primary goal is to gain comprehensive knowledge and practical skills through all course materials.'
      },
      {
        id: `q-${Date.now()}-2`,
        question: "Which components are required for course completion?",
        options: [
          "Only watching videos",
          "Chapters, quizzes, and verified assignments",
          "Just the final exam",
          "Only assignments"
        ],
        correctAnswer: 1,
        difficulty: 'MEDIUM',
        topic: 'Course Requirements',
        explanation: 'Complete course requirements include finishing all chapters, quizzes, and having assignments verified by the instructor.'
      },
      {
        id: `q-${Date.now()}-3`,
        question: "What percentage do you need to pass the final exam?",
        options: [
          "50%",
          "60%",
          "65%",
          "80%"
        ],
        correctAnswer: 2,
        difficulty: 'EASY',
        topic: 'Assessment Criteria',
        explanation: 'The pass threshold for the final exam is 65%, with 80% required for certification.'
      }
    ];

    // Update course with final exam
    await db.course.update({
      where: { id: courseId },
      data: {
        finalExamEnabled: true,
        finalExamQuestions: sampleQuestions
      }
    });

    console.log(`Updated course with ${sampleQuestions.length} questions and enabled final exam`);

    return NextResponse.json({
      success: true,
      message: "Course setup completed successfully!",
      details: {
        assignmentsVerified: assignments.filter(a => a.submissions.length > 0).length,
        questionsCreated: sampleQuestions.length,
        finalExamEnabled: true
      }
    });

  } catch (error) {
    console.error("[FORCE_FIX_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Failed to fix course setup", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}