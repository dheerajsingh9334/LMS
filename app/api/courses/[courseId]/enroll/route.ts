import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (purchase) {
      return new NextResponse("Already purchased", { status: 400 });
    }

    try {
      const purchase = await db.purchase.create({
        data: {
          userId: user.id,
          courseId: params.courseId,
          amount: 0,
          paymentStatus: "completed",
          // Give free/enroll purchases a unique synthetic session id
          stripeSessionId: `enroll_${user.id}_${params.courseId}_${Date.now()}`,
        },
      });

      console.log("[COURSE_ENROLL] Successfully created enrollment:", {
        userId: user.id,
        courseId: params.courseId,
        purchaseId: purchase.id,
      });

      return NextResponse.json({
        success: true,
        message: "Course enrolled successfully",
        purchaseId: purchase.id,
      });
    } catch (error) {
      console.error("[COURSE_ENROLL] Failed to create enrollment:", error);
      return new NextResponse("Failed to create enrollment", { status: 500 });
    }
  } catch (error) {
    console.log("[COURSE_ID_ENROLL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
