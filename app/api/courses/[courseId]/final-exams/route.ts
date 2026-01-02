import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { title } = await req.json();

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

    const finalExam = await db.finalExam.create({
      data: {
        title,
        courseId: params.courseId,
      },
    });

    return NextResponse.json(finalExam);
  } catch (error) {
    console.log("[FINAL_EXAMS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}