import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/certificates/generateCertificatePdf";
import { uploadPdfToUT } from "@/lib/uploadthing-server";

// Clean, local pdf-lib based generator for the REAL student certificate.
// No external PDF generator, no unused crypto/template code.
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const isPreview = url.searchParams.get("preview") === "1";
    
    console.log("[CERTIFICATE_PDF] Request params:", { 
      courseId: params.courseId,
      forceRefresh,
      isPreview,
      timestamp: url.searchParams.get("t")
    });

    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const certificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
      include: {
        course: {
          select: {
            title: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return new NextResponse("Certificate not found", { status: 404 });
    }

    const template = await db.certificateTemplate.findUnique({
      where: { courseId: params.courseId },
    });
    const minPercentage = template?.minPercentage ?? 0;

    const scorePercent = Math.round(Number(certificate.percentage || 0));
    const issueDate = certificate.issueDate
      ? new Date(certificate.issueDate)
      : new Date();

    const pdfBytes = await generateCertificatePdf({
      certificateTitle:
        template?.certificateTitle || "Certificate of Completion",
      studentName: certificate.studentName || "Student",
      courseTitle: certificate.course?.title || "Course",
      teacherName:
        template?.signatureName ||
        certificate.course?.user?.name ||
        "Instructor",
      minPercentage,
      scorePercent,
      issueDate,
      verificationCode: certificate.verificationCode || undefined,
      signatureTitle: template?.signatureTitle || "Course Instructor",
      organizationNameUnderSignature: template?.organizationName || undefined,
    });

    // Upload to UploadThing and update certificateUrl
    let uploadedUrl: string | null = null;
    try {
      const filename = `certificate-${params.courseId}-${user.id}-${Date.now()}.pdf`;
      const pdfBuffer = Buffer.from(pdfBytes);
      
      console.log("[CERTIFICATE_PDF] Attempting UploadThing upload...", { filename, bufferSize: pdfBuffer.length });
      uploadedUrl = await uploadPdfToUT(pdfBuffer, filename);
      
      // Update certificate record with the cloud URL
      await db.certificate.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: params.courseId,
          },
        },
        data: { certificateUrl: uploadedUrl },
      });
      
      console.log("[CERTIFICATE_PDF] Successfully uploaded to UploadThing:", uploadedUrl);
    } catch (error) {
      console.error("[CERTIFICATE_PDF] Failed to upload to UploadThing:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Continue serving the PDF even if upload fails
    }

    return new Response(pdfBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-UploadThing-URL": uploadedUrl || "none",
      },
    });
  } catch (error) {
    console.error("[CERTIFICATE_PDF_GET] Error:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
