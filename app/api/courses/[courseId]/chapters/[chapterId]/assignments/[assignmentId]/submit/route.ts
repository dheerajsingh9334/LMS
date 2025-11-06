import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; assignmentId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Assignment submission request body:", body);
    
    const {
      submissionType,
      fileUrl,
      fileName,
      linkUrl,
      textContent
    } = body;

    // Validate submission type
    if (!submissionType || !["file", "link", "text"].includes(submissionType)) {
      console.error("Invalid submission type:", submissionType);
      return new NextResponse("Invalid submission type", { status: 400 });
    }

    // Validate required fields based on submission type
    if (submissionType === "file" && (!fileUrl || !fileName)) {
      console.error("Missing file data:", { fileUrl, fileName });
      return new NextResponse("File URL and name are required for file submissions", { status: 400 });
    }
    
    if (submissionType === "link" && !linkUrl) {
      console.error("Missing link URL");
      return new NextResponse("Link URL is required for link submissions", { status: 400 });
    }
    
    if (submissionType === "text" && !textContent?.trim()) {
      console.error("Missing text content");
      return new NextResponse("Text content is required for text submissions", { status: 400 });
    }

    // Get assignment details
    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
      },
      include: {
        course: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    // Check if user has purchased the course or is the instructor
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    const isPurchased = !!purchase && purchase.paymentStatus === "completed";
    const isInstructor = assignment.course.userId === user.id;

    if (!isPurchased && !isInstructor) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Check if student already has a submission
    const existingSubmission = await db.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: params.assignmentId,
          studentId: user.id,
        },
      },
    });

    if (existingSubmission) {
      return new NextResponse("Assignment already submitted", { status: 400 });
    }

    // Check if assignment is overdue
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isLate = now > dueDate;
    const daysLate = isLate ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Check if late submissions are allowed
    if (isLate && !assignment.allowLateSubmission) {
      return new NextResponse("Late submissions not allowed", { status: 400 });
    }

    // Prepare submission data
    let submissionData: any = {
      assignmentId: params.assignmentId,
      studentId: user.id,
      submissionType,
      status: "submitted",
      isLate,
      daysLate,
    };

    // Add type-specific data
    switch (submissionType) {
      case "file":
        if (!fileUrl) {
          return new NextResponse("File URL is required", { status: 400 });
        }
        submissionData.fileUrl = fileUrl;
        submissionData.fileName = fileName;
        break;
      case "link":
        if (!linkUrl) {
          return new NextResponse("Link URL is required", { status: 400 });
        }
        submissionData.linkUrl = linkUrl;
        break;
      case "text":
        if (!textContent?.trim()) {
          return new NextResponse("Text content is required", { status: 400 });
        }
        submissionData.textContent = textContent.trim();
        break;
    }

    // Create submission
    const submission = await db.assignmentSubmission.create({
      data: submissionData,
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMIT]", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return new NextResponse("You have already submitted this assignment", { status: 400 });
      }
      if (error.message.includes('Foreign key constraint')) {
        return new NextResponse("Assignment or course not found", { status: 404 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}