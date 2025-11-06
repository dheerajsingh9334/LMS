import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// GET all notes for current user across all courses
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const search = searchParams.get("search");

    const notes = await db.studentNote.findMany({
      where: {
        userId,
        ...(courseId && { courseId }),
        ...(search && {
          content: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
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
    console.log("[MY_NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
