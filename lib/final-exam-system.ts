import { db } from "@/lib/db";

interface FinalExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;
}

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  passed: boolean;
  grade: string;
  certificateEligible: boolean;
}

export class FinalExamSystem {
  private courseId: string;
  private userId: string;
  
  // Certification thresholds (like Infosys SpringBoot)
  private static readonly PASS_THRESHOLD = 65; // 65% to pass
  private static readonly CERTIFICATION_THRESHOLD = 65; // 80% for certificate
  private static readonly EXCELLENCE_THRESHOLD = 90; // 90% for excellence

  constructor(courseId: string, userId: string) {
    this.courseId = courseId;
    this.userId = userId;
  }

  /**
   * Check if user is eligible to take final exam
   */
  async checkExamEligibility(): Promise<{
    eligible: boolean;
    reason?: string;
    progress: {
      chaptersCompleted: number;
      totalChapters: number;
      quizzesCompleted: number;
      totalQuizzes: number;
      assignmentsCompleted: number;
      totalAssignments: number;
    };
  }> {
    const course = await db.course.findUnique({
      where: { id: this.courseId },
      include: {
        chapters: {
          include: {
            userProgress: {
              where: { userId: this.userId }
            },
            quizzes: {
              include: {
                quizAttempts: {
                  where: { userId: this.userId }
                }
              }
            },
            assignments: {
              include: {
                submissions: {
                  where: { studentId: this.userId }
                }
              },
              where: {
                isPublished: true // Only published assignments
              }
            }
          }
        }
      }
    });

    if (!course) {
      return { eligible: false, reason: "Course not found", progress: { chaptersCompleted: 0, totalChapters: 0, quizzesCompleted: 0, totalQuizzes: 0, assignmentsCompleted: 0, totalAssignments: 0 } };
    }

    // Check if final exam is enabled by teacher
    if (!course.finalExamEnabled) {
      return { 
        eligible: false, 
        reason: "The instructor has not enabled the final exam for this course yet. Please contact your instructor.", 
        progress: { chaptersCompleted: 0, totalChapters: 0, quizzesCompleted: 0, totalQuizzes: 0, assignmentsCompleted: 0, totalAssignments: 0 } 
      };
    }

    const totalChapters = course.chapters.length;
    const chaptersCompleted = course.chapters.filter(ch => 
      ch.userProgress.some(up => up.isCompleted)
    ).length;

    const totalQuizzes = course.chapters.reduce((acc, ch) => acc + ch.quizzes.length, 0);
    const quizzesCompleted = course.chapters.reduce((acc, ch) => 
      acc + ch.quizzes.filter(quiz => quiz.quizAttempts.length > 0).length, 0
    );

    // Only count assignments that are verified by teacher and available to students
    const verifiedAssignments = course.chapters.reduce((acc, ch) => 
      acc + ch.assignments.filter(assignment => assignment.verificationStatus === 'verified').length, 0
    );
    const totalAssignments = verifiedAssignments; // Only verified assignments count towards completion

    const assignmentsCompleted = course.chapters.reduce((acc, ch) => 
      acc + ch.assignments.filter(assignment => 
        assignment.verificationStatus === 'verified' && // Must be verified first
        assignment.submissions.some(sub => 
          sub.status === 'submitted' || sub.status === 'graded' // Count both submitted and graded
        )
      ).length, 0
    );

    // Debug logging to understand what's happening
    console.log('Final Exam Debug:', {
      totalAssignments: totalAssignments,
      assignmentsCompleted: assignmentsCompleted,
      allAssignments: course.chapters.map(ch => 
        ch.assignments.map(a => ({
          id: a.id,
          verificationStatus: a.verificationStatus,
          hasSubmissions: a.submissions.length > 0,
          submissionStatuses: a.submissions.map(s => s.status)
        }))
      ).flat()
    });

    const progress = {
      chaptersCompleted,
      totalChapters,
      quizzesCompleted,
      totalQuizzes,
      assignmentsCompleted,
      totalAssignments
    };

    // Requirements for final exam eligibility
    const allChaptersCompleted = chaptersCompleted === totalChapters;
    const allQuizzesCompleted = totalQuizzes === 0 || quizzesCompleted === totalQuizzes;
    const allAssignmentsCompleted = totalAssignments === 0 || assignmentsCompleted === totalAssignments;

    if (!allChaptersCompleted) {
      return {
        eligible: false,
        reason: `Complete all chapters (${chaptersCompleted}/${totalChapters})`,
        progress
      };
    }

    if (!allQuizzesCompleted) {
      return {
        eligible: false,
        reason: `Complete all chapter quizzes (${quizzesCompleted}/${totalQuizzes})`,
        progress
      };
    }

    if (!allAssignmentsCompleted) {
      // Check if there are unverified assignments that the student has submitted
      const submittedButNotVerified = course.chapters.reduce((acc, ch) => 
        acc + ch.assignments.filter(assignment => 
          assignment.verificationStatus !== 'verified' && // Not verified yet
          assignment.submissions.some(sub => sub.status === 'submitted' || sub.status === 'graded')
        ).length, 0
      );
      
      const message = submittedButNotVerified > 0 
        ? `Assignments pending teacher verification (${assignmentsCompleted}/${totalAssignments} verified)`
        : `Submit all assignments (${assignmentsCompleted}/${totalAssignments})`;
        
      return {
        eligible: false,
        reason: message,
        progress
      };
    }

    return { eligible: true, progress };
  }

  /**
   * Get final exam questions created by teacher
   */
  async generateFinalExam(): Promise<FinalExamQuestion[]> {
    // Get final exam questions from course
    const course = await db.course.findUnique({
      where: {
        id: this.courseId
      },
      select: {
        finalExamQuestions: true,
        finalExamEnabled: true
      }
    });

    if (!course) {
      throw new Error("Course not found");
    }
    
    if (!course.finalExamEnabled) {
      throw new Error("The instructor has not enabled the final exam for this course yet");
    }
    
    if (!course.finalExamQuestions) {
      throw new Error("The instructor has not created questions for the final exam yet");
    }

    const questions = course.finalExamQuestions as unknown as FinalExamQuestion[];
    
    if (!questions || questions.length === 0) {
      throw new Error("No questions have been created for the final exam");
    }

    // Shuffle questions to prevent cheating
    return questions.sort(() => Math.random() - 0.5);
  }

  private determineDifficulty(questionText: string): 'EASY' | 'MEDIUM' | 'HARD' {
    const text = questionText.toLowerCase();
    
    // Simple heuristics for difficulty
    if (text.includes('advanced') || text.includes('complex') || text.includes('analyze')) {
      return 'HARD';
    } else if (text.includes('explain') || text.includes('describe') || text.includes('compare')) {
      return 'MEDIUM';
    } else {
      return 'EASY';
    }
  }

  private selectExamQuestions(allQuestions: FinalExamQuestion[]): FinalExamQuestion[] {
    // Aim for 20-30 questions for final exam
    const targetCount = Math.min(25, Math.max(10, allQuestions.length));
    
    // Distribute difficulty levels
    const easyCount = Math.ceil(targetCount * 0.3); // 30% easy
    const mediumCount = Math.ceil(targetCount * 0.5); // 50% medium
    const hardCount = targetCount - easyCount - mediumCount; // 20% hard

    const easy = allQuestions.filter(q => q.difficulty === 'EASY').slice(0, easyCount);
    const medium = allQuestions.filter(q => q.difficulty === 'MEDIUM').slice(0, mediumCount);
    const hard = allQuestions.filter(q => q.difficulty === 'HARD').slice(0, hardCount);

    // If not enough questions of a difficulty, fill from others
    let selectedQuestions = [...easy, ...medium, ...hard];
    
    if (selectedQuestions.length < targetCount) {
      const remaining = allQuestions.filter(q => !selectedQuestions.includes(q))
        .slice(0, targetCount - selectedQuestions.length);
      selectedQuestions = [...selectedQuestions, ...remaining];
    }

    // Shuffle questions
    return selectedQuestions.sort(() => Math.random() - 0.5);
  }

  /**
   * Calculate exam result and determine certification eligibility
   */
  calculateResult(userAnswers: number[], correctAnswers: number[]): ExamResult {
    const totalQuestions = correctAnswers.length;
    const correctCount = userAnswers.reduce((count, answer, index) => 
      answer === correctAnswers[index] ? count + 1 : count, 0
    );

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= FinalExamSystem.PASS_THRESHOLD;
    const certificateEligible = score >= FinalExamSystem.CERTIFICATION_THRESHOLD;

    let grade = 'F';
    if (score >= FinalExamSystem.EXCELLENCE_THRESHOLD) {
      grade = 'A+'; // Excellence
    } else if (score >= FinalExamSystem.CERTIFICATION_THRESHOLD) {
      grade = 'A'; // Certificate eligible
    } else if (score >= FinalExamSystem.PASS_THRESHOLD) {
      grade = 'B'; // Pass but no certificate
    } else if (score >= 60) {
      grade = 'C';
    } else if (score >= 50) {
      grade = 'D';
    }

    return {
      totalQuestions,
      correctAnswers: correctCount,
      score,
      passed,
      grade,
      certificateEligible
    };
  }

  /**
   * Save exam attempt to database
   */
  async saveExamAttempt(
    questions: FinalExamQuestion[],
    userAnswers: number[],
    result: ExamResult
  ): Promise<string> {
    const examAttempt = await db.finalExamAttempt.create({
      data: {
        userId: this.userId,
        courseId: this.courseId,
        questions: JSON.stringify(questions),
        userAnswers: JSON.stringify(userAnswers),
        score: result.score,
        passed: result.passed,
        grade: result.grade,
        certificateEligible: result.certificateEligible,
        completedAt: new Date()
      }
    });

    return examAttempt.id;
  }

  /**
   * Get user's exam history
   */
  async getExamHistory(): Promise<any[]> {
    return await db.finalExamAttempt.findMany({
      where: {
        userId: this.userId,
        courseId: this.courseId
      },
      orderBy: {
        completedAt: 'desc'
      }
    });
  }

  /**
   * Get best exam result for certificate generation
   */
  async getBestResult(): Promise<ExamResult | null> {
    const bestAttempt = await db.finalExamAttempt.findFirst({
      where: {
        userId: this.userId,
        courseId: this.courseId
      },
      orderBy: {
        score: 'desc'
      }
    });

    if (!bestAttempt) return null;

    return {
      totalQuestions: JSON.parse(bestAttempt.questions as string).length,
      correctAnswers: Math.round((bestAttempt.score / 100) * JSON.parse(bestAttempt.questions as string).length),
      score: bestAttempt.score,
      passed: bestAttempt.passed,
      grade: bestAttempt.grade,
      certificateEligible: bestAttempt.certificateEligible
    };
  }
}