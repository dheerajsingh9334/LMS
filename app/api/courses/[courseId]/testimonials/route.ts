import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const testimonial = await db.testimonial.create({
      data: {
        courseId: params.courseId,
        studentName: values.studentName,
        studentRole: values.studentRole || null,
        content: values.content,
        rating: values.rating || 5,
        imageUrl: values.imageUrl || null,
        isFeatured: values.isFeatured || false,
      },
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.log("[TESTIMONIALS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const testimonials = await db.testimonial.findMany({
      where: {
        courseId: params.courseId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.log("[TESTIMONIALS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
