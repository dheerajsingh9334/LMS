import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Update all assignments with submitted submissions to verified status
    const result = await db.assignment.updateMany({
      where: {
        courseId: params.courseId,
        verificationStatus: 'pending',
        submissions: {
          some: {
            status: {
              in: ['submitted', 'graded']
            }
          }
        }
      },
      data: {
        verificationStatus: 'verified'
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} assignments verified successfully!`,
      verifiedCount: result.count
    });

  } catch (error) {
    console.log("[VERIFY_ASSIGNMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}