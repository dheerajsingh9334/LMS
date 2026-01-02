import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Only teachers can upload notes", { status: 403 });
    }

    const { title, description, fileUrl, fileName, courseId, chapterId } = await req.json();

    if (!title || !fileUrl || !fileName || !courseId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const note = await db.note.create({
      data: {
        title,
        description,
        fileUrl,
        fileName,
        courseId,
        chapterId,
        teacherId: user.id,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.log("[NOTES_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const chapterId = searchParams.get("chapterId");

    const where: any = {};
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (chapterId) {
      where.chapterId = chapterId;
    }

    const notes = await db.note.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.log("[NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
