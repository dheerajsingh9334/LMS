import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user || user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { comment } = await req.json().catch(() => ({ comment: "" }));

    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
      },
      data: {
        isPublished: false,
        adminComment: comment || null,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.log("[ADMIN_COURSE_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
