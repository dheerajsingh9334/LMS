import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; finalExamId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { title, explanation, options, correctAnswer, points, position } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
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

    const question = await db.finalExamQuestion.create({
      data: {
        title,
        explanation,
        options,
        correctAnswer,
        points: points || 1,
        position: position || 0,
        finalExamId: params.finalExamId,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.log("[FINAL_EXAM_QUESTIONS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}