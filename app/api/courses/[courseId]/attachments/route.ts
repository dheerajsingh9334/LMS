import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    let userId = user?.id ?? "";
    const { url, name, type, fileType } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Determine the attachment name
    let attachmentName = name;
    if (!attachmentName) {
      // Extract name from URL if not provided
      const urlParts = url.split("/");
      attachmentName = urlParts[urlParts.length - 1];
    }

    const attachment = await db.attachment.create({
      data: {
        url,
        name: attachmentName,
        type: type || "file", // "file" or "link"
        fileType: fileType, // "pdf", "excel", "zip", etc.
        courseId: params.courseId,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.log("COURSE_ID_ATTACHMENTS", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has purchased the course or is the instructor
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
      select: {
        userId: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    const isPurchased = !!purchase && purchase.paymentStatus === "completed";
    const isInstructor = course.userId === user.id;

    if (!isPurchased && !isInstructor) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Get course attachments
    const attachments = await db.attachment.findMany({
      where: {
        courseId: params.courseId,
      },
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        fileType: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("[COURSE_ATTACHMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}