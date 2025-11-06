import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const values = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const certificateTemplate = await db.certificateTemplate.create({
      data: {
        courseId: params.courseId,
        templateUrl: values.templateUrl,
        autoIssue: values.autoIssue ?? true,
        autoDownload: values.autoDownload ?? false,
        namePositionX: values.namePositionX,
        namePositionY: values.namePositionY,
        fontSize: values.fontSize || 24,
        fontColor: values.fontColor || "#000000",
      },
    });

    return NextResponse.json(certificateTemplate);
  } catch (error) {
    console.log("[CERTIFICATE_TEMPLATE_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const values = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const certificateTemplate = await db.certificateTemplate.upsert({
      where: {
        courseId: params.courseId,
      },
      update: {
        templateUrl: values.templateUrl,
        autoIssue: values.autoIssue,
        autoDownload: values.autoDownload,
        namePositionX: values.namePositionX,
        namePositionY: values.namePositionY,
        fontSize: values.fontSize,
        fontColor: values.fontColor,
      },
      create: {
        courseId: params.courseId,
        templateUrl: values.templateUrl,
        autoIssue: values.autoIssue ?? true,
        autoDownload: values.autoDownload ?? false,
        namePositionX: values.namePositionX,
        namePositionY: values.namePositionY,
        fontSize: values.fontSize || 24,
        fontColor: values.fontColor || "#000000",
      },
    });

    return NextResponse.json(certificateTemplate);
  } catch (error) {
    console.log("[CERTIFICATE_TEMPLATE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
