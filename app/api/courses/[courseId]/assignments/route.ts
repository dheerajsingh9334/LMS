import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eventBus, EventName } from "@/lib/events";
import "@/lib/events/init";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { courseId } = params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId,
      },
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const assignment = await db.assignment.create({
      data: {
        courseId,
        teacherId: userId,
        ...values,
      },
    });

    // Emit assignment created event
    eventBus.emit(EventName.ASSIGNMENT_CREATED, {
      assignmentId: assignment.id,
      assignmentTitle: values.title || "New Assignment",
      courseId,
      courseTitle: course.title || "Course",
      dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
      timestamp: new Date(),
      triggeredBy: userId,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.log("[ASSIGNMENTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { courseId } = params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const isTeacher = course.userId === userId;

    const assignments = await db.assignment.findMany({
      where: {
        courseId,
        ...(isTeacher ? {} : { isPublished: true }),
      },
      include: {
        chapter: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.log("[ASSIGNMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
