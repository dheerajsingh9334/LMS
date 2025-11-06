import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
        minPercentage: values.minPercentage,
        requireAllChapters: values.requireAllChapters,
        requireAllQuizzes: values.requireAllQuizzes,
        requireAllAssignments: values.requireAllAssignments,
      },
      create: {
        courseId: params.courseId,
        templateUrl: "", // Will be set later
        minPercentage: values.minPercentage || 70,
        requireAllChapters: values.requireAllChapters ?? true,
        requireAllQuizzes: values.requireAllQuizzes ?? true,
        requireAllAssignments: values.requireAllAssignments ?? true,
      },
    });

    return NextResponse.json(certificateTemplate);
  } catch (error) {
    console.log("[CERTIFICATE_REQUIREMENTS_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
