import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure the requester owns the course
    const course = await db.course.findUnique({
      where: { id: params.courseId, userId: user.id },
      select: { id: true },
    });
    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const allowed = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return new NextResponse("Unsupported file type", { status: 415 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext =
      file.type === "application/pdf"
        ? ".pdf"
        : file.type === "image/png"
        ? ".png"
        : ".jpg";
    const filename = `certificate-template-${
      params.courseId
    }-${Date.now()}${ext}`;
    const fullPath = path.join(uploadsDir, filename);

    await fs.writeFile(fullPath, buffer);

    const publicUrl = `/uploads/${filename}`;

    // Update or create certificate template with new templateUrl
    const existing = await db.certificateTemplate.findUnique({
      where: { courseId: params.courseId },
    });
    if (existing) {
      await db.certificateTemplate.update({
        where: { courseId: params.courseId },
        data: { templateUrl: publicUrl },
      });
    } else {
      await db.certificateTemplate.create({
        data: {
          courseId: params.courseId,
          templateUrl: publicUrl,
          templateType: file.type === "application/pdf" ? "pdf" : "image",
          minPercentage: 70,
          fontSize: 24,
          fontColor: "#000000",
          fontFamily: "Arial",
        },
      });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[CERTIFICATE_UPLOAD] Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
