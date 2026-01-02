import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// GET all notes for a course
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    const search = searchParams.get("search");

    const notes = await db.studentNote.findMany({
      where: {
        userId,
        courseId: params.courseId,
        ...(chapterId && { chapterId }),
        ...(search && {
          content: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.log("[STUDENT_NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST create a new note
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, timestamp, chapterId } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const note = await db.studentNote.create({
      data: {
        userId,
        courseId: params.courseId,
        chapterId,
        content,
        timestamp,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.log("[STUDENT_NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
