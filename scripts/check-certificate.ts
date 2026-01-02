import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkCertificate() {
  try {
    const courseId = 'cmhhpkkqd0002qh4zaibwgxya';
    
    // Find the student user (assuming the current user from the screenshot)
    const users = await db.user.findMany({
      where: {
        email: {
          contains: 'dheeraj' // or whatever identifier helps find the user
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log('Found users:', users);

    if (users.length > 0) {
      const userId = users[0].id;
      
      // Check if certificate exists
      const certificate = await db.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId
          }
        }
      });

      console.log('Certificate found:', !!certificate);
      if (certificate) {
        console.log('Certificate details:', {
          id: certificate.id,
          grade: certificate.grade,
          percentage: certificate.percentage,
          verificationCode: certificate.verificationCode,
          issueDate: certificate.issueDate
        });
      }

      // Check final exam attempt
      const finalExam = await db.finalExamAttempt.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      });

      console.log('Final exam attempt:', !!finalExam);
      if (finalExam) {
        console.log('Final exam details:', {
          score: finalExam.score,
          passed: finalExam.passed,
          grade: finalExam.grade,
          certificateEligible: finalExam.certificateEligible
        });
      }
    }

  } catch (error) {
    console.error('Error checking certificate:', error);
  } finally {
    await db.$disconnect();
  }
}

checkCertificate();