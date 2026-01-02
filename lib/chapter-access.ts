import { db } from "@/lib/db";

interface ChapterAccess {
  id: string;
  isAccessible: boolean;
  isCompleted: boolean;
  reason?: string;
}

interface ChapterWithContent {
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  isAccessible: boolean;
  isActive: boolean;
  videoCompleted: boolean;
  quizzes: Array<{
    id: string;
    title: string;
    position: number;
    isCompleted: boolean;
    timeline?: number;
    isAccessible: boolean;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: Date;
    isCompleted: boolean;
    isLate: boolean;
    isAccessible: boolean;
  }>;
}

export async function getChapterAccessibility(
  userId: string,
  courseId: string,
  isPurchased: boolean,
  isInstructor: boolean
): Promise<ChapterAccess[]> {
  // Get all chapters with user progress
  const chapters = await db.chapter.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    include: {
      userProgress: {
        where: {
          userId,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
  });

  const chapterAccess: ChapterAccess[] = [];
  let previousChapterCompleted = true; // First chapter should be accessible

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const userProgress = chapter.userProgress[0];
    const isCompleted = userProgress?.isCompleted || false;
    
    let isAccessible = false;
    let reason = "";

    // Instructors have full access
    if (isInstructor) {
      isAccessible = true;
      reason = "Instructor access";
    }
    // Free preview chapters are always accessible
    else if (chapter.isFree || chapter.isPreview) {
      isAccessible = true;
      reason = "Free/Preview chapter";
    }
    // Check if user has purchased the course
    else if (!isPurchased) {
      isAccessible = false;
      reason = "Course not purchased";
    }
    // First chapter is accessible if purchased
    else if (i === 0) {
      isAccessible = true;
      reason = "First chapter";
    }
    // Subsequent chapters require previous chapter completion
    else if (previousChapterCompleted) {
      isAccessible = true;
      reason = "Previous chapter completed";
    }
    // Chapter is locked if previous chapter not completed
    else {
      isAccessible = false;
      reason = "Previous chapter not completed";
    }

    chapterAccess.push({
      id: chapter.id,
      isAccessible,
      isCompleted,
      reason,
    });

    // Update previousChapterCompleted for next iteration
    previousChapterCompleted = isCompleted;
  }

  return chapterAccess;
}

export async function getNextAccessibleChapter(
  userId: string,
  courseId: string,
  currentChapterId: string,
  isPurchased: boolean,
  isInstructor: boolean
): Promise<string | null> {
  const accessibility = await getChapterAccessibility(userId, courseId, isPurchased, isInstructor);
  
  // Find current chapter index
  const currentIndex = accessibility.findIndex(ch => ch.id === currentChapterId);
  
  // Look for next accessible chapter
  for (let i = currentIndex + 1; i < accessibility.length; i++) {
    if (accessibility[i].isAccessible) {
      return accessibility[i].id;
    }
  }
  
  return null;
}

export async function getPreviousAccessibleChapter(
  userId: string,
  courseId: string,
  currentChapterId: string,
  isPurchased: boolean,
  isInstructor: boolean
): Promise<string | null> {
  const accessibility = await getChapterAccessibility(userId, courseId, isPurchased, isInstructor);
  
  // Find current chapter index
  const currentIndex = accessibility.findIndex(ch => ch.id === currentChapterId);
  
  // Look for previous accessible chapter
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (accessibility[i].isAccessible) {
      return accessibility[i].id;
    }
  }
  
  return null;
}

export async function getEnhancedChapterAccessibility(
  userId: string,
  courseId: string,
  isPurchased: boolean,
  isInstructor: boolean
): Promise<ChapterWithContent[]> {
  // Get basic chapter accessibility
  const chapterAccess = await getChapterAccessibility(userId, courseId, isPurchased, isInstructor);
  
  // Get chapters with full content (quizzes and assignments)
  const chapters = await db.chapter.findMany({
    where: { 
      courseId,
      isPublished: true,
    },
    include: {
      userProgress: {
        where: { userId },
      },
      quizzes: {
        include: {
          quizAttempts: {
            where: { userId },
          },
        },
        orderBy: { position: "asc" },
      },
      assignments: {
        include: {
          submissions: {
            where: { studentId: userId },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });

  return chapters.map(chapter => {
    const accessInfo = chapterAccess.find(access => access.id === chapter.id);
    const isCompleted = chapter.userProgress.some(progress => progress.isCompleted);
    const videoCompleted = isCompleted; // Assuming video completion marks chapter completion
    
    // For quizzes and assignments within a chapter, they're accessible if:
    // 1. The chapter is accessible AND
    // 2. For sequential content: previous content items are completed
    
    const chapterIsAccessible = accessInfo?.isAccessible || false;
    
    // Process quizzes
    const quizzes = chapter.quizzes.map((quiz, index) => {
      const quizCompleted = quiz.quizAttempts.length > 0;
      let quizAccessible = false;
      
      if (chapterIsAccessible) {
        if (index === 0) {
          // First quiz is accessible if video is completed or if instructor
          quizAccessible = videoCompleted || isInstructor;
        } else {
          // Subsequent quizzes require previous quiz completion
          const previousQuizCompleted = chapter.quizzes[index - 1]?.quizAttempts.length > 0;
          quizAccessible = previousQuizCompleted || isInstructor;
        }
      }
      
      return {
        id: quiz.id,
        title: quiz.title,
        position: quiz.position,
        isCompleted: quizCompleted,
        timeline: quiz.timeline,
        isAccessible: quizAccessible,
      };
    });
    
    // Process assignments
    const assignments = chapter.assignments.map(assignment => {
      // Assignment is completed if it has a submission AND is verified by teacher
      const hasValidSubmission = assignment.submissions.some(sub => 
        sub.status === 'submitted' || sub.status === 'graded'
      );
      const isVerified = assignment.verificationStatus === 'verified';
      const assignmentCompleted = hasValidSubmission && isVerified;
      
      const now = new Date();
      const isLate = now > assignment.dueDate && !assignmentCompleted;
      
      // Assignments are accessible if chapter is accessible and all quizzes are completed
      const allQuizzesCompleted = quizzes.every(quiz => quiz.isCompleted);
      const assignmentAccessible = chapterIsAccessible && (allQuizzesCompleted || quizzes.length === 0 || isInstructor);
      
      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        isCompleted: assignmentCompleted,
        isLate,
        isAccessible: assignmentAccessible,
      };
    });

    return {
      id: chapter.id,
      title: chapter.title,
      position: chapter.position,
      isCompleted,
      isAccessible: chapterIsAccessible,
      isActive: false, // Will be set by the component based on current route
      videoCompleted,
      quizzes,
      assignments,
    };
  });
}