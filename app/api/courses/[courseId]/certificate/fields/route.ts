import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Auto-fetch all required certificate fields for a course
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch course with related data
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: {
        id: true,
        title: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
        certificateTemplate: {
          select: {
            minPercentage: true,
            requireAllChapters: true,
            requireAllQuizzes: true,
            requireAllAssignments: true,
            // Text fields
            certificateTitle: true,
            signatureName: true,
            signatureTitle: true,
            organizationName: true,
            additionalText: true,
            // Styling
            fontSize: true,
            fontColor: true,
            fontFamily: true,
            // Positions
            namePositionX: true,
            namePositionY: true,
            datePositionX: true,
            datePositionY: true,
            coursePositionX: true,
            coursePositionY: true,
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Count quizzes in the course
    const quizCount = await db.quiz.count({
      where: {
        chapter: {
          courseId: params.courseId,
          isPublished: true,
        },
      },
    });

    // Count assignments in the course
    const assignmentCount = await db.assignment.count({
      where: {
        chapter: {
          courseId: params.courseId,
          isPublished: true,
        },
      },
    });

    // Build auto-fetched fields
    const teacherName = course.user?.name || course.user?.email || "Instructor";
    const courseTitle = course.title || "Course";
    const categoryName = course.category?.name || "General";
    const chapterCount = course.chapters?.length || 0;

    // Template settings (defaults if not set)
    const template = course.certificateTemplate;
    const minPercentage = template?.minPercentage ?? 70;
    const requireAllChapters = template?.requireAllChapters ?? true;
    const requireAllQuizzes = template?.requireAllQuizzes ?? true;
    const requireAllAssignments = template?.requireAllAssignments ?? true;

    // Build requirements summary
    const reqParts: string[] = [];
    if (requireAllChapters && chapterCount > 0) {
      reqParts.push(`Complete all ${chapterCount} chapters`);
    }
    if (requireAllQuizzes && quizCount > 0) {
      reqParts.push(`Pass all ${quizCount} quizzes`);
    }
    if (requireAllAssignments && assignmentCount > 0) {
      reqParts.push(`Submit all ${assignmentCount} assignments`);
    }
    reqParts.push(`Achieve minimum ${minPercentage}% score`);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Return all auto-fetched fields
    return NextResponse.json({
      // Core fields
      courseTitle,
      courseName: courseTitle,
      teacherName,
      instructorName: teacherName,
      categoryName,

      // Certificate title options (use saved value if exists)
      certificateTitle:
        template?.certificateTitle || "Certificate of Completion",
      certificateTitleOptions: [
        "Certificate of Completion",
        "Certificate of Achievement",
        "Certificate of Excellence",
        "Course Completion Certificate",
        "Professional Certificate",
      ],

      // Signature fields (use saved values if exist)
      signatureName: template?.signatureName || teacherName,
      signatureTitle: template?.signatureTitle || "Course Instructor",
      signatureTitleOptions: [
        "Course Instructor",
        "Lead Instructor",
        "Program Director",
        "Academic Director",
        "Course Creator",
      ],

      // Organization (use saved value if exists)
      organizationName: template?.organizationName || "",
      additionalText: template?.additionalText || "",

      // Styling (use saved values if exist)
      fontSize: template?.fontSize || 24,
      fontColor: template?.fontColor || "#000000",
      fontFamily: template?.fontFamily || "Arial",

      // Positions (use saved values if exist)
      namePositionX: template?.namePositionX || 400,
      namePositionY: template?.namePositionY || 300,
      datePositionX: template?.datePositionX || 400,
      datePositionY: template?.datePositionY || 350,
      coursePositionX: template?.coursePositionX || 400,
      coursePositionY: template?.coursePositionY || 250,

      // Date fields
      completionDate: currentDate.toISOString(),
      completionDateText: formattedDate,
      issueDateText: formattedDate,

      // Course stats
      chapterCount,
      quizCount,
      assignmentCount,

      // Requirements
      minPercentage,
      requireAllChapters,
      requireAllQuizzes,
      requireAllAssignments,
      requirementsText: reqParts.join(", "),
      requirementsList: reqParts,

      // Sample student for preview
      sampleStudentName: "John Doe",
      sampleScore: 95,
      sampleVerificationCode: "SAMPLE-XXXX-XXXX",

      // Placeholders info (for template design reference)
      availablePlaceholders: [
        {
          key: "studentName",
          description: "Student's full name",
          example: "John Doe",
        },
        {
          key: "courseTitle",
          description: "Course title",
          example: courseTitle,
        },
        {
          key: "courseName",
          description: "Course name (same as title)",
          example: courseTitle,
        },
        {
          key: "teacherName",
          description: "Instructor's name",
          example: teacherName,
        },
        {
          key: "instructorName",
          description: "Instructor's name (alias)",
          example: teacherName,
        },
        {
          key: "certificateTitle",
          description: "Certificate heading",
          example: "Certificate of Completion",
        },
        {
          key: "completionDate",
          description: "Date (ISO format)",
          example: currentDate.toISOString(),
        },
        {
          key: "completionDateText",
          description: "Date (formatted)",
          example: formattedDate,
        },
        {
          key: "signatureName",
          description: "Signature name",
          example: teacherName,
        },
        {
          key: "signatureTitle",
          description: "Signature title",
          example: "Course Instructor",
        },
        {
          key: "percentage",
          description: "Student's score percentage",
          example: "95",
        },
        {
          key: "verificationCode",
          description: "Unique verification code",
          example: "ABC123XYZ",
        },
        {
          key: "requirementsText",
          description: "Requirements summary",
          example: reqParts.join(", "),
        },
        {
          key: "totalQuizzes",
          description: "Number of quizzes",
          example: String(quizCount),
        },
        { key: "achievedScore", description: "Points earned", example: "45" },
        {
          key: "totalScore",
          description: "Total points possible",
          example: "50",
        },
      ],
    });
  } catch (error) {
    console.error("[CERTIFICATE_FIELDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
