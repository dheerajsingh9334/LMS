import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; finalExamId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const finalExam = await db.finalExam.findUnique({
      where: {
        id: params.finalExamId,
        courseId: params.courseId,
      },
    });

    if (!finalExam) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const deletedFinalExam = await db.finalExam.delete({
      where: {
        id: params.finalExamId,
      },
    });

    return NextResponse.json(deletedFinalExam);
  } catch (error) {
    console.log("[FINAL_EXAM_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; finalExamId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { ...values } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const finalExam = await db.finalExam.update({
      where: {
        id: params.finalExamId,
        courseId: params.courseId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(finalExam);
  } catch (error) {
    console.log("[FINAL_EXAM_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}