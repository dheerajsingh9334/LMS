import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwtHS256(payload: Record<string, any>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  const encSig = base64url(sig);
  return `${data}.${encSig}`;
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
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
          },
        },
      },
    });

    if (!certificate) {
      return new NextResponse("Certificate not found", { status: 404 });
    }

    const urlObj = new URL(req.url);
    const qp = urlObj.searchParams;
    const useLocal =
      qp.get("useLocal") === "1" || qp.get("useLocal") === "true";

    // If PDF Generator API (pdfgeneratorapi.com) is configured AND explicitly enabled, use it
    const pdfGenApiKey = process.env.PDFGEN_API_KEY;
    const pdfGenApiSecret = process.env.PDFGEN_API_SECRET;
    const pdfGenTemplateId = process.env.PDFGEN_TEMPLATE_ID;
    const pdfGenRegion = process.env.PDFGEN_REGION || "us1"; // us1 or eu1
    const pdfGenWorkspace = process.env.PDFGEN_WORKSPACE || user.id; // default to user id
    const pdfGenEnabled = process.env.PDFGEN_ENABLED === "true";

    if (
      !useLocal &&
      pdfGenEnabled &&
      pdfGenApiKey &&
      pdfGenApiSecret &&
      pdfGenTemplateId
    ) {
      // Allow teacher overrides via query params for edit/preview flows
      const urlObj = new URL(req.url);
      const qp = urlObj.searchParams;
      // Fetch additional course/teacher context for richer template data
      const courseContext = await db.course.findUnique({
        where: { id: params.courseId },
        select: {
          title: true,
          user: {
            select: { name: true },
          },
        },
      });

      // Fetch certificate template (for title and requirements)
      const templateSettings = await db.certificateTemplate.findUnique({
        where: { courseId: params.courseId },
        select: {
          certificateTitle: true,
          minPercentage: true,
          requireAllChapters: true,
          requireAllQuizzes: true,
          requireAllAssignments: true,
        },
      });

      const resolvedCourseTitle = String(
        certificate.course?.title || courseContext?.title || "Course"
      );
      const resolvedTeacherName = String(
        courseContext?.user?.name || "Instructor"
      );
      const completionDateIso =
        certificate.issueDate || new Date().toISOString();
      const completionDateText = new Date(completionDateIso).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );

      // Query param overrides (optional)
      const studentNameOverride = qp.get("studentName") || qp.get("name");
      const courseNameOverride = qp.get("courseName") || qp.get("courseTitle");
      const teacherNameOverride =
        qp.get("teacherName") || qp.get("instructorName");
      const signatureNameOverride = qp.get("signatureName");
      const signatureTitleOverride = qp.get("signatureTitle");
      const completionDateOverride = qp.get("completionDate") || qp.get("date");
      const certificateTitleOverride = qp.get("certificateTitle");

      const finalStudentName = String(
        studentNameOverride || certificate.studentName || "Student"
      );
      const finalCourseTitle = String(
        courseNameOverride || resolvedCourseTitle
      );
      const finalTeacherName = String(
        teacherNameOverride || resolvedTeacherName
      );
      const finalCompletionDateIso = String(
        completionDateOverride || completionDateIso
      );
      const finalCompletionDateText = new Date(
        finalCompletionDateIso
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const finalSignatureName = String(
        signatureNameOverride || finalTeacherName
      );
      const finalSignatureTitle = String(
        signatureTitleOverride || "Course Instructor"
      );

      // Requirement values and human-readable text
      const requirementMinPercentage =
        typeof templateSettings?.minPercentage === "number"
          ? Number(templateSettings.minPercentage)
          : 0;
      const requirementAllChapters =
        templateSettings?.requireAllChapters ?? true;
      const requirementAllQuizzes = templateSettings?.requireAllQuizzes ?? true;
      const requirementAllAssignments =
        templateSettings?.requireAllAssignments ?? true;
      const reqParts: string[] = [];
      if (requirementAllChapters) reqParts.push("All chapters");
      if (requirementAllQuizzes) reqParts.push("All quizzes");
      if (requirementAllAssignments) reqParts.push("All assignments");
      reqParts.push(`Minimum ${requirementMinPercentage}%`);
      const requirementsText = `Requirements: ${reqParts.join(", ")}`;
      const hasMetRequirements =
        Number(certificate.percentage || 0) >= requirementMinPercentage;
      const now = Math.floor(Date.now() / 1000);
      const aud = `https://${pdfGenRegion}.pdfgeneratorapi.com`;
      const token = signJwtHS256(
        {
          iss: pdfGenApiKey,
          sub: String(pdfGenWorkspace),
          aud,
          iat: now,
          exp: now + 60 * 5,
        },
        pdfGenApiSecret
      );

      const genUrl = `${aud}/api/v4/documents/generate`;
      const templateData = {
        // Core identity fields
        studentName: finalStudentName,
        courseTitle: finalCourseTitle,
        courseName: finalCourseTitle,
        teacherName: finalTeacherName,
        // Optional title for certificate top text (if template uses it)
        certificateTitle:
          certificateTitleOverride ||
          templateSettings?.certificateTitle ||
          "Certificate of Completion",
        // Optional organization name used in some templates
        organizationName: (courseContext?.title || "").toString(),
        // Dates
        completionDate: finalCompletionDateIso,
        completionDateText: finalCompletionDateText,
        issueDate: certificate.issueDate || new Date().toISOString(),
        // Signature block
        signatureName: finalSignatureName,
        signatureTitle: finalSignatureTitle,
        // Requirements (auto-fetched)
        requirementMinPercentage,
        requirementAllChapters,
        requirementAllQuizzes,
        requirementAllAssignments,
        requirementsText,
        hasMetRequirements,
        // Scores/verification
        totalQuizzes: Number(certificate.totalQuizzes || 0),
        achievedScore: Number(certificate.achievedScore || 0),
        totalScore: Number(certificate.totalScore || 0),
        percentage: Number(certificate.percentage || 0),
        verificationCode: String(certificate.verificationCode || ""),
      };
      const payload = {
        template: { id: Number(pdfGenTemplateId), data: [templateData] },
        format: "pdf",
        output: "file",
        name: `certificate-${params.courseId}-${user.id}`,
      } as any;

      const res = await fetch(genUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf, application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "[CERTIFICATE_PDF] PDFGeneratorAPI error:",
          res.status,
          text
        );
        return new NextResponse("Failed to generate PDF", { status: 502 });
      }

      // Robust handling: direct PDF, JSON base64, or JSON URL
      let pdfBuffer: ArrayBuffer | null = null;
      let generatedUrl: string | null = null;
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("application/pdf")) {
        pdfBuffer = await res.arrayBuffer();
      } else if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => null as any);
        const b64 =
          json?.document ||
          json?.file ||
          json?.pdf ||
          json?.base64 ||
          json?.content ||
          json?.data ||
          json?.response?.document ||
          json?.response?.file ||
          json?.response?.pdf ||
          json?.response?.base64 ||
          json?.response?.content ||
          json?.response?.data;

        if (typeof b64 === "string" && b64.length > 0) {
          const cleaned = b64.startsWith("data:application/pdf;base64,")
            ? b64.replace(/^data:application\/pdf;base64\,/, "")
            : b64;
          const buf = Buffer.from(cleaned, "base64");
          pdfBuffer = buf.buffer.slice(
            buf.byteOffset,
            buf.byteOffset + buf.byteLength
          );
        } else {
          const url =
            json?.url ||
            json?.fileUrl ||
            json?.downloadUrl ||
            json?.response?.url ||
            json?.response?.fileUrl ||
            json?.response?.downloadUrl;
          if (typeof url === "string" && url.length > 0) {
            generatedUrl = url;
            const fileRes = await fetch(url, {
              headers: { Accept: "application/pdf" },
            });
            if (!fileRes.ok) {
              const t = await fileRes.text().catch(() => "");
              console.error(
                "[CERTIFICATE_PDF] Failed to fetch PDF URL:",
                fileRes.status,
                t
              );
              return new NextResponse("Failed to fetch PDF file", {
                status: 502,
              });
            }
            pdfBuffer = await fileRes.arrayBuffer();
          } else {
            return new NextResponse("Invalid PDF response from generator", {
              status: 502,
            });
          }
        }
      } else {
        pdfBuffer = await res.arrayBuffer();
      }

      if (!pdfBuffer || pdfBuffer.byteLength === 0) {
        return new NextResponse("Empty PDF from generator", { status: 502 });
      }

      // Persist the generated file URL to the certificate if available
      if (generatedUrl && !certificate.certificateUrl) {
        try {
          await db.certificate.update({
            where: {
              userId_courseId: {
                userId: user.id,
                courseId: params.courseId,
              },
            },
            data: { certificateUrl: generatedUrl },
          });
        } catch (e) {
          console.warn("[CERTIFICATE_PDF] Failed to persist certificateUrl", e);
        }
      }

      // If we received raw bytes and no generated URL, persist locally
      if (!generatedUrl) {
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          await fs.mkdir(uploadsDir, { recursive: true });
          const filename = `certificate-${params.courseId}-${
            user.id
          }-${Date.now()}.pdf`;
          const fullPath = path.join(uploadsDir, filename);
          const bytes = new Uint8Array(pdfBuffer);
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
          console.warn("[CERTIFICATE_PDF] Failed to persist local PDF", e);
        }
      }

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="certificate.pdf"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // If external generic PDF generator is configured AND explicitly enabled, delegate PDF creation
    const pdfGeneratorUrl = process.env.PDF_GENERATOR_URL;
    const pdfGeneratorApiKey = process.env.PDF_GENERATOR_API_KEY;
    const pdfGeneratorEnabled = process.env.PDF_GENERATOR_ENABLED === "true";

    if (
      !useLocal &&
      pdfGeneratorEnabled &&
      pdfGeneratorUrl &&
      pdfGeneratorApiKey
    ) {
      // Optionally fetch certificate template settings for richer rendering
      const template = await db.certificateTemplate.findUnique({
        where: { courseId: params.courseId },
      });

      const payload = {
        courseId: params.courseId,
        studentName: String(certificate.studentName || "Student"),
        courseTitle: String(certificate.course?.title || "Course"),
        totalQuizzes: Number(certificate.totalQuizzes || 0),
        achievedScore: Number(certificate.achievedScore || 0),
        totalScore: Number(certificate.totalScore || 0),
        percentage: Number(certificate.percentage || 0),
        verificationCode: String(certificate.verificationCode || ""),
        issueDate: certificate.issueDate || new Date().toISOString(),
        // Template and styling (best-effort; service may ignore unknown fields)
        templateUrl: template?.templateUrl || undefined,
        fontSize: template?.fontSize || 18,
        fontColor: template?.fontColor || "#000000",
        fontFamily: template?.fontFamily || "Helvetica",
        namePositionX: template?.namePositionX,
        namePositionY: template?.namePositionY,
        datePositionX: template?.datePositionX,
        datePositionY: template?.datePositionY,
        coursePositionX: template?.coursePositionX,
        coursePositionY: template?.coursePositionY,
        minPercentage: template?.minPercentage || 0,
      };

      const res = await fetch(pdfGeneratorUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pdfGeneratorApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "[CERTIFICATE_PDF] External generator failed:",
          res.status,
          text
        );
        return new NextResponse("Failed to generate PDF", { status: 502 });
      }

      const pdfBytes = await res.arrayBuffer();
      if (!pdfBytes || (pdfBytes as ArrayBuffer).byteLength === 0) {
        return new NextResponse("Empty PDF from generator", { status: 502 });
      }
      // Persist locally so student proxy can serve the asset
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
        console.warn("[CERTIFICATE_PDF] Failed to persist external PDF", e);
      }

      return new Response(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="certificate.pdf"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Fallback: use the same kind of layout as the teacher's sample preview,
    // but with the REAL student + certificate data.
    const template = await db.certificateTemplate.findUnique({
      where: { courseId: params.courseId },
    });
    const minPercentage = template?.minPercentage ?? 0;

    // Optionally fetch teacher name for display
    const courseInfo = await db.course.findUnique({
      where: { id: params.courseId },
      select: { user: { select: { name: true } } },
    });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // Landscape A4
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const { width, height } = page.getSize();

    // Background + borders (similar to sample route)
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.95, 0.97, 1),
    });
    page.drawRectangle({
      x: 15,
      y: 15,
      width: width - 30,
      height: height - 30,
      borderColor: rgb(0.7, 0.75, 0.85),
      borderWidth: 2,
    });
    page.drawRectangle({
      x: 25,
      y: 25,
      width: width - 50,
      height: height - 50,
      borderColor: rgb(0.2, 0.35, 0.6),
      borderWidth: 3,
    });

    const cornerSize = 30;
    // Top-left
    page.drawLine({
      start: { x: 35, y: height - 35 },
      end: { x: 35 + cornerSize, y: height - 35 },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    page.drawLine({
      start: { x: 35, y: height - 35 },
      end: { x: 35, y: height - 35 - cornerSize },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    // Top-right
    page.drawLine({
      start: { x: width - 35 - cornerSize, y: height - 35 },
      end: { x: width - 35, y: height - 35 },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    page.drawLine({
      start: { x: width - 35, y: height - 35 },
      end: { x: width - 35, y: height - 35 - cornerSize },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    // Bottom-left
    page.drawLine({
      start: { x: 35, y: 35 },
      end: { x: 35 + cornerSize, y: 35 },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    page.drawLine({
      start: { x: 35, y: 35 },
      end: { x: 35, y: 35 + cornerSize },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    // Bottom-right
    page.drawLine({
      start: { x: width - 35 - cornerSize, y: 35 },
      end: { x: width - 35, y: 35 },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });
    page.drawLine({
      start: { x: width - 35, y: 35 },
      end: { x: width - 35, y: 35 + cornerSize },
      thickness: 2,
      color: rgb(0.6, 0.5, 0.2),
    });

    const certificateTitle =
      template?.certificateTitle || "Certificate of Completion";
    const title = certificateTitle.toUpperCase();
    const titleSize = 32;
    const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 85,
      size: titleSize,
      font: boldFont,
      color: rgb(0.15, 0.3, 0.5),
    });

    page.drawLine({
      start: { x: width / 2 - 150, y: height - 100 },
      end: { x: width / 2 + 150, y: height - 100 },
      thickness: 1.5,
      color: rgb(0.6, 0.5, 0.2),
    });

    const certifyText = "This is to certify that";
    const certifyWidth = italicFont.widthOfTextAtSize(certifyText, 14);
    page.drawText(certifyText, {
      x: (width - certifyWidth) / 2,
      y: height - 140,
      size: 14,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const studentName = String(certificate.studentName || "Student").substring(
      0,
      60
    );
    const nameSize = 28;
    const nameWidth = boldFont.widthOfTextAtSize(studentName, nameSize);
    page.drawText(studentName, {
      x: (width - nameWidth) / 2,
      y: height - 175,
      size: nameSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawLine({
      start: { x: width / 2 - 120, y: height - 182 },
      end: { x: width / 2 + 120, y: height - 182 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    const completedText = "has successfully completed the course";
    const completedWidth = italicFont.widthOfTextAtSize(completedText, 14);
    page.drawText(completedText, {
      x: (width - completedWidth) / 2,
      y: height - 215,
      size: 14,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const courseTitle = String(certificate.course?.title || "Course").substring(
      0,
      80
    );
    const courseSize = 22;
    const courseWidth = boldFont.widthOfTextAtSize(courseTitle, courseSize);
    page.drawText(courseTitle, {
      x: (width - courseWidth) / 2,
      y: height - 250,
      size: courseSize,
      font: boldFont,
      color: rgb(0.15, 0.3, 0.5),
    });

    const teacherName =
      courseInfo?.user?.name || template?.organizationName || "Instructor";
    const instructorLabel = "Instructor: ";
    const instructorLabelWidth = regularFont.widthOfTextAtSize(
      instructorLabel,
      12
    );
    const instructorNameWidth = boldFont.widthOfTextAtSize(teacherName, 12);
    const totalInstructorWidth = instructorLabelWidth + instructorNameWidth;
    page.drawText(instructorLabel, {
      x: (width - totalInstructorWidth) / 2,
      y: height - 285,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(teacherName, {
      x: (width - totalInstructorWidth) / 2 + instructorLabelWidth,
      y: height - 285,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    const scorePercent = Math.round(Number(certificate.percentage || 0));
    const scoreText = `Score: ${scorePercent}% (Minimum Required: ${minPercentage}%)`;
    const scoreWidth = regularFont.widthOfTextAtSize(scoreText, 11);
    page.drawText(scoreText, {
      x: (width - scoreWidth) / 2,
      y: height - 310,
      size: 11,
      font: regularFont,
      color: rgb(0.1, 0.5, 0.2),
    });

    const issueDate = certificate.issueDate
      ? new Date(certificate.issueDate)
      : new Date();
    const dateFormatted = issueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateLabel = "Date of Completion: ";
    const dateLabelWidth = regularFont.widthOfTextAtSize(dateLabel, 11);
    const dateValueWidth = boldFont.widthOfTextAtSize(dateFormatted, 11);
    const totalDateWidth = dateLabelWidth + dateValueWidth;
    page.drawText(dateLabel, {
      x: (width - totalDateWidth) / 2,
      y: height - 335,
      size: 11,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(dateFormatted, {
      x: (width - totalDateWidth) / 2 + dateLabelWidth,
      y: height - 335,
      size: 11,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    const sigLineY = 95;
    page.drawLine({
      start: { x: width / 2 - 100, y: sigLineY },
      end: { x: width / 2 + 100, y: sigLineY },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    const signatureName = teacherName;
    const sigNameWidth = boldFont.widthOfTextAtSize(signatureName, 14);
    page.drawText(signatureName, {
      x: (width - sigNameWidth) / 2,
      y: sigLineY + 15,
      size: 14,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });

    const signatureTitle = "Course Instructor";
    const sigTitleWidth = regularFont.widthOfTextAtSize(signatureTitle, 11);
    page.drawText(signatureTitle, {
      x: (width - sigTitleWidth) / 2,
      y: sigLineY - 18,
      size: 11,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const verificationCode = String(certificate.verificationCode || "");
    if (verificationCode) {
      const verifyText = `Verification: ${verificationCode}`;
      const verifyWidth = regularFont.widthOfTextAtSize(verifyText, 8);
      page.drawText(verifyText, {
        x: (width - verifyWidth) / 2,
        y: 40,
        size: 8,
        font: regularFont,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    const pdfBytes = await pdfDoc.save();

    // Persist locally so student proxy can serve the asset
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
      console.warn("[CERTIFICATE_PDF] Failed to persist fallback PDF", e);
    }

    return new Response(pdfBytes, {
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
