import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const chapterId = searchParams.get("chapterId");
    const context = searchParams.get("context");
    const liveSessionId = searchParams.get("liveSessionId");

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Build where clause
    const where: any = {
      userId: user.id,
      courseId,
    };

    if (chapterId) {
      where.chapterId = chapterId;
    }

    if (context) {
      where.context = context;
    }

    if (liveSessionId) {
      where.liveSessionId = liveSessionId;
    }

    const notes = await db.studentNote.findMany({
      where,
      orderBy: [
        { isBookmarked: "desc" },
        { updatedAt: "desc" }
      ],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[STUDENT_NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      title,
      content,
      richContent,
      courseId,
      chapterId,
      context,
      timestamp,
      liveSessionId,
      color,
      tags,
      isBookmarked,
      status = "SAVED"
    } = await request.json();

    if (!courseId || !content) {
      return new NextResponse("Course ID and content are required", { status: 400 });
    }

    // Verify user has access to the course
    const enrollment = await db.purchase.findFirst({
      where: {
        userId: user.id,
        courseId,
      },
    });

    const course = await db.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { userId: user.id }, // User is instructor
          { isFree: true },    // Course is free
        ]
      }
    });

    if (!enrollment && !course) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const note = await db.studentNote.create({
      data: {
        userId: user.id,
        courseId,
        chapterId,
        title: title || "Untitled Note",
        content,
        richContent,
        context: context || "GENERAL",
        timestamp,
        liveSessionId,
        color,
        tags: tags || [],
        isBookmarked: isBookmarked || false,
        status: status,
        isDraft: status === "DRAFT",
        lastSaved: new Date(),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[STUDENT_NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}