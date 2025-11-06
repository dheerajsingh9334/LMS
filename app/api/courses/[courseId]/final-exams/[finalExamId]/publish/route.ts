import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
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
      include: {
        questions: true,
      },
    });

    if (!finalExam) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!finalExam.title || !finalExam.timeLimit || finalExam.questions.length === 0) {
      return new NextResponse("Missing required fields", { status: 401 });
    }

    const publishedFinalExam = await db.finalExam.update({
      where: {
        id: params.finalExamId,
        courseId: params.courseId,
      },
      data: {
        isPublished: true,
      },
    });

    return NextResponse.json(publishedFinalExam);
  } catch (error) {
    console.log("[FINAL_EXAM_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}