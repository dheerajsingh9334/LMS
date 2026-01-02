import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH - Update a specific video
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; videoId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, videoId } = params;
    const values = await req.json();

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

    // Update the video
    const chapterVideo = await db.chapterVideo.update({
      where: {
        id: videoId,
        chapterId
      },
      data: {
        ...values
      }
    });

    return NextResponse.json(chapterVideo);
  } catch (error) {
    console.log("[CHAPTER_VIDEO_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Delete a specific video
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; videoId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, videoId } = params;

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

    // Delete the video
    const deletedVideo = await db.chapterVideo.delete({
      where: {
        id: videoId,
        chapterId
      }
    });

    // Reorder remaining videos
    const remainingVideos = await db.chapterVideo.findMany({
      where: { chapterId },
      orderBy: { position: "asc" }
    });

    // Update positions
    for (let i = 0; i < remainingVideos.length; i++) {
      await db.chapterVideo.update({
        where: { id: remainingVideos[i].id },
        data: { position: i }
      });
    }

    return NextResponse.json(deletedVideo);
  } catch (error) {
    console.log("[CHAPTER_VIDEO_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}