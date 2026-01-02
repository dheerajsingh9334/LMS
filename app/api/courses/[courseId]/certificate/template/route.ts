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
    const body = await req.json();
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
      coursePositionY,
      templateUrl,
      autoIssue,
      autoDownload,
      // New editable text fields
      certificateTitle,
      signatureName,
      signatureTitle,
      organizationName,
      additionalText,
      // Requirements
      requireAllChapters,
      requireAllQuizzes,
      requireAllAssignments,
    } = body;

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
      templateUrl: templateUrl || "/default-certificate-template.svg",
      templateType: templateType || "image",
      minPercentage: minPercentage ?? 70,
      fontSize: fontSize ?? 24,
      fontColor: fontColor || "#000000",
      fontFamily: fontFamily || "Arial",
      namePositionX: namePositionX ?? 400,
      namePositionY: namePositionY ?? 300,
      datePositionX: datePositionX ?? 400,
      datePositionY: datePositionY ?? 350,
      coursePositionX: coursePositionX ?? 400,
      coursePositionY: coursePositionY ?? 250,
      autoIssue: typeof autoIssue === "boolean" ? autoIssue : true,
      autoDownload: typeof autoDownload === "boolean" ? autoDownload : false,
      // Text fields
      certificateTitle: certificateTitle || "Certificate of Completion",
      signatureName: signatureName || null,
      signatureTitle: signatureTitle || "Course Instructor",
      organizationName: organizationName || null,
      additionalText: additionalText || null,
      // Requirements
      requireAllChapters:
        typeof requireAllChapters === "boolean" ? requireAllChapters : true,
      requireAllQuizzes:
        typeof requireAllQuizzes === "boolean" ? requireAllQuizzes : true,
      requireAllAssignments:
        typeof requireAllAssignments === "boolean"
          ? requireAllAssignments
          : true,
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

    // If updating an existing template, regenerate all issued certificates
    if (certificateTemplate) {
      const issuedCertificates = await db.certificate.findMany({
        where: { courseId },
        select: { id: true },
      });

      if (issuedCertificates.length > 0) {
        // Trigger regeneration in background
        fetch(
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/api/courses/${courseId}/certificate/regenerate-all`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              certificateIds: issuedCertificates.map((c) => c.id),
            }),
          }
        ).catch((err) =>
          console.error(
            "[CERT_REGENERATE] Background regeneration failed:",
            err
          )
        );
      }
    }

    return NextResponse.json(certificateTemplate);
  } catch (error) {
    console.error("[CERTIFICATE_TEMPLATE_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;
    const body = await req.json();

    // Verify the user owns the course
    const course = await db.course.findUnique({
      where: { id: courseId, userId: user.id },
      select: { id: true },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const existing = await db.certificateTemplate.findUnique({
      where: { courseId },
    });

    if (!existing) {
      return new NextResponse("Certificate template not found", {
        status: 404,
      });
    }

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
      coursePositionY,
      templateUrl,
      autoIssue,
      autoDownload,
      // New text fields
      certificateTitle,
      signatureName,
      signatureTitle,
      organizationName,
      additionalText,
      // Requirements
      requireAllChapters,
      requireAllQuizzes,
      requireAllAssignments,
    } = body;

    const data: any = {};
    if (templateUrl !== undefined) data.templateUrl = templateUrl;
    if (templateType !== undefined) data.templateType = templateType;
    if (minPercentage !== undefined) data.minPercentage = minPercentage;
    if (fontSize !== undefined) data.fontSize = fontSize;
    if (fontColor !== undefined) data.fontColor = fontColor;
    if (fontFamily !== undefined) data.fontFamily = fontFamily;
    if (namePositionX !== undefined) data.namePositionX = namePositionX;
    if (namePositionY !== undefined) data.namePositionY = namePositionY;
    if (datePositionX !== undefined) data.datePositionX = datePositionX;
    if (datePositionY !== undefined) data.datePositionY = datePositionY;
    if (coursePositionX !== undefined) data.coursePositionX = coursePositionX;
    if (coursePositionY !== undefined) data.coursePositionY = coursePositionY;
    if (typeof autoIssue === "boolean") data.autoIssue = autoIssue;
    if (typeof autoDownload === "boolean") data.autoDownload = autoDownload;
    // Text fields
    if (certificateTitle !== undefined)
      data.certificateTitle = certificateTitle;
    if (signatureName !== undefined) data.signatureName = signatureName;
    if (signatureTitle !== undefined) data.signatureTitle = signatureTitle;
    if (organizationName !== undefined)
      data.organizationName = organizationName;
    if (additionalText !== undefined) data.additionalText = additionalText;
    // Requirements
    if (typeof requireAllChapters === "boolean")
      data.requireAllChapters = requireAllChapters;
    if (typeof requireAllQuizzes === "boolean")
      data.requireAllQuizzes = requireAllQuizzes;
    if (typeof requireAllAssignments === "boolean")
      data.requireAllAssignments = requireAllAssignments;

    const updated = await db.certificateTemplate.update({
      where: { courseId },
      data,
    });

    // Regenerate all issued certificates for this course
    const issuedCertificates = await db.certificate.findMany({
      where: { courseId },
      select: { id: true },
    });

    if (issuedCertificates.length > 0) {
      // Trigger regeneration in background (don't await to avoid blocking response)
      fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/courses/${courseId}/certificate/regenerate-all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            certificateIds: issuedCertificates.map((c) => c.id),
          }),
        }
      ).catch((err) =>
        console.error("[CERT_REGENERATE] Background regeneration failed:", err)
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CERTIFICATE_TEMPLATE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
