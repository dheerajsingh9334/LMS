import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function fixCourse() {
  try {
    const courseId = 'cmhhpkkqd0002qh4zaibwgxya';
    
    console.log('Starting course fix...');

    // Step 1: Verify all assignments with submissions
    const assignments = await db.assignment.findMany({
      where: { courseId },
      include: { submissions: true }
    });

    console.log(`Found ${assignments.length} assignments`);

    for (const assignment of assignments) {
      if (assignment.submissions.length > 0) {
        await db.assignment.update({
          where: { id: assignment.id },
          data: { verificationStatus: 'verified' }
        });
        console.log(`✓ Verified assignment: ${assignment.title}`);
      }
    }

    // Step 2: Create final exam questions and enable exam
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

    await db.course.update({
      where: { id: courseId },
      data: {
        finalExamEnabled: true,
        finalExamQuestions: sampleQuestions
      }
    });

    console.log(`✓ Created ${sampleQuestions.length} final exam questions`);
    console.log('✓ Enabled final exam');
    console.log('🎉 Course setup completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing course:', error);
  } finally {
    await db.$disconnect();
  }
}

fixCourse();