import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";
import { generateCertificatePdf } from "@/lib/certificates/generateCertificatePdf";

// Clean, local pdf-lib based generator for the REAL student certificate.
// No external PDF generator, no unused crypto/template code.
export async function GET(
  _req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
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

    // Save locally and update certificateUrl (optional convenience)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `certificate-${params.courseId}-${
        user.id
      }-${Date.now()}.pdf`;
      const fullPath = path.join(uploadsDir, filename);
      const bytes = new Uint8Array(pdfBytes);
      await fs.writeFile(fullPath, bytes);
      const publicUrl = `/uploads/${filename}`;
      await db.certificate.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: params.courseId,
          },
        },
        data: { certificateUrl: publicUrl },
      });
    } catch (e) {
      console.warn("[CERTIFICATE_PDF] Failed to persist PDF", e);
    }

    return new Response(pdfBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate.pdf"`,
        "Cache-Control": "no-cache",
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
