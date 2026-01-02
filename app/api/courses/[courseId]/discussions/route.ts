import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// GET all discussions for a course
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
    const filter = searchParams.get("filter"); // "all", "resolved", "unresolved"

    const discussions = await db.discussion.findMany({
      where: {
        courseId: params.courseId,
        ...(chapterId && { chapterId }),
        ...(filter === "resolved" && { isResolved: true }),
        ...(filter === "unresolved" && { isResolved: false }),
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(discussions);
  } catch (error) {
    console.log("[DISCUSSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST create a new discussion
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";
    const userName = user?.name ?? "Anonymous";
    const userImage = user?.image ?? null;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content, chapterId } = await req.json();

    if (!title || !content) {
      return new NextResponse("Title and content are required", { status: 400 });
    }

    const discussion = await db.discussion.create({
      data: {
        userId,
        userName,
        userImage,
        courseId: params.courseId,
        chapterId,
        title,
        content,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
        replies: true,
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.log("[DISCUSSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
