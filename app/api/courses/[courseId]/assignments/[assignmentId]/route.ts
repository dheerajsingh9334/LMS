import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
      },
      include: {
        course: {
          select: {
            title: true,
            userId: true,
          },
        },
        chapter: {
          select: {
            title: true,
          },
        },
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    const isTeacher = assignment.course.userId === userId;

    if (!isTeacher && !assignment.isPublished) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.log("[ASSIGNMENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
      },
      include: {
        course: true,
      },
    });

    if (!assignment || assignment.course.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const updatedAssignment = await db.assignment.update({
      where: {
        id: params.assignmentId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.log("[ASSIGNMENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
        courseId: params.courseId,
      },
      include: {
        course: true,
      },
    });

    if (!assignment || assignment.course.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.assignment.delete({
      where: {
        id: params.assignmentId,
      },
    });

    return NextResponse.json({ message: "Assignment deleted" });
  } catch (error) {
    console.log("[ASSIGNMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
