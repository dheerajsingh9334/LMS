import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPurchase } from "@/actions/Courses/get-purchase";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get chapter and verify access
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        isPublished: true,
      },
      select: {
        videoUrl: true,
        courseId: true,
        isFree: true,
      },
    });

    if (!chapter || !chapter.videoUrl) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    // Check if user has access (either purchased or free chapter)
    if (!chapter.isFree) {
      const hasPurchased = await checkPurchase(user.id, chapter.courseId);
      if (!hasPurchased) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const videoUrl = chapter.videoUrl;
    const range = req.headers.get("range");

    // Forward the request to the actual video URL with range support
    const headers: HeadersInit = {};
    if (range) {
      headers["Range"] = range;
    }

    const videoResponse = await fetch(videoUrl, {
      headers,
      // Use a longer cache for CDN-hosted videos
      next: { revalidate: 3600 },
    });

    if (!videoResponse.ok) {
      return new NextResponse("Video not available", { status: 404 });
    }

    // Stream the video response
    const contentType = videoResponse.headers.get("Content-Type") || "video/mp4";
    const contentLength = videoResponse.headers.get("Content-Length");
    const contentRange = videoResponse.headers.get("Content-Range");
    const acceptRanges = videoResponse.headers.get("Accept-Ranges") || "bytes";

    // Determine status code based on whether it's a range request
    const status = range && contentRange ? 206 : 200;

    // Build response headers
    const responseHeaders: HeadersInit = {
      "Content-Type": contentType,
      "Accept-Ranges": acceptRanges,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    // Stream the response directly without loading into memory
    return new NextResponse(videoResponse.body, {
      status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[VIDEO_STREAM_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
