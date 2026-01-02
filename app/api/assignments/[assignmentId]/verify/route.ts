import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { verificationStatus, verificationNotes } = await req.json();

    // Validate verification status
    if (!["verified", "rejected"].includes(verificationStatus)) {
      return new NextResponse("Invalid verification status", { status: 400 });
    }

    // Get assignment and verify ownership
    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
      },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    // Check if user is the course owner/teacher
    if (assignment.course.userId !== user.id && assignment.teacherId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update assignment verification status
    const updatedAssignment = await db.assignment.update({
      where: {
        id: params.assignmentId,
      },
      data: {
        verificationStatus,
        verificationNotes: verificationNotes || null,
        verifiedAt: verificationStatus === "verified" ? new Date() : null,
        verifiedBy: verificationStatus === "verified" ? user.id : null,
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("[ASSIGNMENT_VERIFY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}