import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      include: {
        chapters: {
          include: {
            quizzes: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Generate sample final exam questions from existing quiz questions
    const allQuizQuestions: any[] = [];
    course.chapters.forEach(chapter => {
      chapter.quizzes.forEach(quiz => {
        quiz.questions.forEach(question => {
          if (question.type === 'MCQ' && question.option1 && question.option2) {
            allQuizQuestions.push({
              id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              question: question.text,
              options: [
                question.option1,
                question.option2,
                question.option3 || "Option C",
                question.option4 || "Option D"
              ],
              correctAnswer: 0, // Default to first option - teacher can edit
              difficulty: 'MEDIUM',
              topic: chapter.title,
              explanation: `Review the ${chapter.title} chapter for more details.`
            });
          }
        });
      });
    });

    // If no quiz questions found, create sample questions
    if (allQuizQuestions.length === 0) {
      allQuizQuestions.push(
        {
          id: `q-${Date.now()}-1`,
          question: "What is the main objective of this course?",
          options: [
            "To provide comprehensive knowledge on the subject",
            "To complete assignments only",
            "To watch videos",
            "To download materials"
          ],
          correctAnswer: 0,
          difficulty: 'EASY',
          topic: 'Course Overview',
          explanation: 'The main objective is to provide comprehensive knowledge that helps students master the subject matter.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: "Which best describes successful completion of this course?",
          options: [
            "Watching all videos",
            "Completing all chapters, quizzes, and assignments with verification",
            "Just passing the final exam",
            "Downloading the certificate"
          ],
          correctAnswer: 1,
          difficulty: 'MEDIUM',
          topic: 'Course Completion',
          explanation: 'Successful completion requires engaging with all course materials and having assignments verified by the instructor.'
        }
      );
    }

    // Take up to 10 questions for the final exam
    const finalExamQuestions = allQuizQuestions.slice(0, Math.min(10, allQuizQuestions.length));

    // Update course with final exam questions and enable it
    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
      },
      data: {
        finalExamQuestions,
        finalExamEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Final exam enabled successfully!",
      questionsCreated: finalExamQuestions.length,
      finalExamEnabled: true
    });

  } catch (error) {
    console.log("[QUICK_SETUP_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}