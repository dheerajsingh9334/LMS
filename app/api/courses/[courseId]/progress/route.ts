import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Calculate comprehensive course progress
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;

    // Get course with all chapters, quizzes, and assignments
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          where: { isPublished: true },
          include: {
            chapterVideos: true,
            quizzes: {
              where: { isPublished: true }
            },
            assignments: true,
            userProgress: {
              where: { userId }
            }
          },
          orderBy: { position: "asc" }
        }
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    let totalItems = 0;
    let completedItems = 0;
    
    const chapterProgress: any[] = [];

    // Calculate progress for each chapter
    for (const chapter of course.chapters) {
      let chapterTotalItems = 0;
      let chapterCompletedItems = 0;

      // Count chapter videos (use chapterVideos if available, otherwise count chapter itself)
      const videoCount = chapter.chapterVideos.length > 0 ? chapter.chapterVideos.length : 1;
      chapterTotalItems += videoCount;
      
      // Check if chapter is completed (video watched)
      const chapterCompleted = chapter.userProgress.length > 0 && chapter.userProgress[0].isCompleted;
      if (chapterCompleted) {
        chapterCompletedItems += videoCount;
      }

      // Count quizzes
      chapterTotalItems += chapter.quizzes.length;
      
      // Check completed quizzes
      for (const quiz of chapter.quizzes) {
        const quizAttempt = await db.quizAttempt.findFirst({
          where: {
            userId,
            quizId: quiz.id
          }
        });
        if (quizAttempt) {
          chapterCompletedItems++;
        }
      }

      // Count assignments
      chapterTotalItems += chapter.assignments.length;
      
      // Check completed assignments
      for (const assignment of chapter.assignments) {
        const submission = await db.assignmentSubmission.findFirst({
          where: {
            studentId: userId,
            assignmentId: assignment.id,
            status: "SUBMITTED"
          }
        });
        if (submission) {
          chapterCompletedItems++;
        }
      }

      const chapterProgressPercent = chapterTotalItems > 0 ? (chapterCompletedItems / chapterTotalItems) * 100 : 0;

      chapterProgress.push({
        chapterId: chapter.id,
        title: chapter.title,
        totalItems: chapterTotalItems,
        completedItems: chapterCompletedItems,
        progressPercent: Math.round(chapterProgressPercent),
        isCompleted: chapterProgressPercent === 100
      });

      totalItems += chapterTotalItems;
      completedItems += chapterCompletedItems;
    }

    const overallProgressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isCompletelyFinished = overallProgressPercent === 100;

    // Check if certificate exists
    const certificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    const progressData = {
      courseId,
      userId,
      totalItems,
      completedItems,
      progressPercent: Math.round(overallProgressPercent),
      isCompleted: isCompletelyFinished,
      chapters: chapterProgress,
      certificateId: certificate?.id || null,
      hasCertificate: !!certificate
    };

    return NextResponse.json(progressData);
  } catch (error) {
    console.log("[COURSE_PROGRESS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}