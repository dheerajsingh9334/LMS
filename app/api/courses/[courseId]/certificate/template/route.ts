import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;
    const { 
      templateType, 
      minPercentage, 
      fontSize, 
      fontColor, 
      fontFamily,
      namePositionX,
      namePositionY,
      datePositionX,
      datePositionY,
      coursePositionX,
      coursePositionY
    } = await req.json();

    // Verify the user owns the course
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check if certificate template already exists
    let certificateTemplate = await db.certificateTemplate.findUnique({
      where: {
        courseId: courseId,
      },
    });

    const templateData = {
      templateUrl: "/default-certificate-template.png", // Default template URL
      templateType,
      minPercentage,
      fontSize,
      fontColor,
      fontFamily,
      namePositionX,
      namePositionY,
      datePositionX,
      datePositionY,
      coursePositionX,
      coursePositionY,
    };

    if (certificateTemplate) {
      // Update existing template
      certificateTemplate = await db.certificateTemplate.update({
        where: {
          courseId: courseId,
        },
        data: templateData,
      });
    } else {
      // Create new template
      certificateTemplate = await db.certificateTemplate.create({
        data: {
          courseId,
          ...templateData,
        },
      });
    }

    return NextResponse.json(certificateTemplate);
  } catch (error) {
    console.error("[CERTIFICATE_TEMPLATE_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}