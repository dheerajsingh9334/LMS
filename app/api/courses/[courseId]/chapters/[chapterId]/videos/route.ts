import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Fetch all videos for a chapter
export async function GET(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId } = params;

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId
      }
    });

    if (!course) {
      return new NextResponse("Course not found or unauthorized", { status: 404 });
    }

    // Fetch all videos for the chapter
    const chapterVideos = await db.chapterVideo.findMany({
      where: {
        chapterId
      },
      orderBy: {
        position: "asc"
      }
    });

    return NextResponse.json(chapterVideos);
  } catch (error) {
    console.log("[CHAPTER_VIDEOS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Create a new video for a chapter
export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId } = params;
    const { title, videoUrl, duration } = await req.json();

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId
      }
    });

    if (!course) {
      return new NextResponse("Course not found or unauthorized", { status: 404 });
    }

    // Get the next position
    const lastVideo = await db.chapterVideo.findFirst({
      where: { chapterId },
      orderBy: { position: "desc" }
    });

    const nextPosition = lastVideo ? lastVideo.position + 1 : 0;

    // Create the new video
    const chapterVideo = await db.chapterVideo.create({
      data: {
        chapterId,
        title,
        videoUrl,
        duration: duration || null,
        position: nextPosition
      }
    });

    return NextResponse.json(chapterVideo);
  } catch (error) {
    console.log("[CHAPTER_VIDEO_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}