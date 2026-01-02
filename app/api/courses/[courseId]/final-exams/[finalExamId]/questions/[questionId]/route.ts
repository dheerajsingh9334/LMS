import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; finalExamId: string; questionId: string } }
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

    const finalExamOwner = await db.finalExam.findUnique({
      where: {
        id: params.finalExamId,
        courseId: params.courseId,
      },
    });

    if (!finalExamOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const question = await db.finalExamQuestion.findUnique({
      where: {
        id: params.questionId,
        finalExamId: params.finalExamId,
      },
    });

    if (!question) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const deletedQuestion = await db.finalExamQuestion.delete({
      where: {
        id: params.questionId,
      },
    });

    return NextResponse.json(deletedQuestion);
  } catch (error) {
    console.log("[FINAL_EXAM_QUESTION_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; finalExamId: string; questionId: string } }
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

    const finalExamOwner = await db.finalExam.findUnique({
      where: {
        id: params.finalExamId,
        courseId: params.courseId,
      },
    });

    if (!finalExamOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const question = await db.finalExamQuestion.update({
      where: {
        id: params.questionId,
        finalExamId: params.finalExamId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.log("[FINAL_EXAM_QUESTION_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}