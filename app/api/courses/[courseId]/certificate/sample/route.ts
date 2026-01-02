import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

    // Ensure the requester is the course owner (teacher)
    const course = await db.course.findUnique({
      where: { id: params.courseId, userId: user.id },
      select: {
        title: true,
        user: { select: { name: true } },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Template is optional - we can generate preview without it
    const template = await db.certificateTemplate.findUnique({
      where: { courseId: params.courseId },
    });

    // Get query params for overrides
    const urlObj = new URL(req.url);
    const qp = urlObj.searchParams;

    // Try PDFGeneratorAPI first if configured (unless useLocal=true)
    const apiKey = process.env.PDFGEN_API_KEY;
    const apiSecret = process.env.PDFGEN_API_SECRET;
    const templateId = process.env.PDFGEN_TEMPLATE_ID;
    const region = process.env.PDFGEN_REGION || "us1";
    const workspace = process.env.PDFGEN_WORKSPACE || user.id;
    const useLocal =
      qp.get("useLocal") === "1" || qp.get("useLocal") === "true";

    if (apiKey && apiSecret && templateId && !useLocal) {
      // Use teacher name from course
      const teacherName = (course as any).user?.name || "Instructor";
      const now = Math.floor(Date.now() / 1000);
      const aud = `https://${region}.pdfgeneratorapi.com`;
      const token = signJwtHS256(
        {
          iss: apiKey,
          sub: String(workspace),
          aud,
          iat: now,
          exp: now + 60 * 5,
        },
        apiSecret
      );

      const genUrl = `${aud}/api/v4/documents/generate`;
      // Resolve editable fields and requirements
      const resolvedCourseTitle = String(course.title || "Course");
      const resolvedTeacherName = String(teacherName);
      const completionDateIso = new Date().toISOString();
      const completionDateText = new Date(completionDateIso).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );

      const studentNameOverride = qp.get("studentName") || qp.get("name");
      const courseNameOverride = qp.get("courseName") || qp.get("courseTitle");
      const teacherNameOverride =
        qp.get("teacherName") || qp.get("instructorName");
      const signatureNameOverride = qp.get("signatureName");
      const signatureTitleOverride = qp.get("signatureTitle");
      const organizationNameOverride = qp.get("organizationName") || "";
      const completionDateOverride = qp.get("completionDate") || qp.get("date");
      const certificateTitleOverride = qp.get("certificateTitle");

      const finalStudentName = String(studentNameOverride || "Sample Student");
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

      // Requirements from template (use defaults if no template)
      const requirementMinPercentage =
        typeof template?.minPercentage === "number"
          ? Number(template.minPercentage)
          : 70;
      const requirementAllChapters = template?.requireAllChapters ?? true;
      const requirementAllQuizzes = template?.requireAllQuizzes ?? true;
      const requirementAllAssignments = template?.requireAllAssignments ?? true;
      const reqParts: string[] = [];
      if (requirementAllChapters) reqParts.push("All chapters");
      if (requirementAllQuizzes) reqParts.push("All quizzes");
      if (requirementAllAssignments) reqParts.push("All assignments");
      reqParts.push(`Minimum ${requirementMinPercentage}%`);
      const requirementsText = `Requirements: ${reqParts.join(", ")}`;
      const hasMetRequirements = 100 >= requirementMinPercentage;

      const templateData = {
        // Core identity fields
        studentName: finalStudentName,
        courseTitle: finalCourseTitle,
        courseName: finalCourseTitle,
        teacherName: finalTeacherName,
        // Optional top title
        certificateTitle:
          certificateTitleOverride || "Certificate of Completion",
        // Dates
        completionDate: finalCompletionDateIso,
        completionDateText: finalCompletionDateText,
        issueDate: new Date().toISOString(),
        // Signature block
        signatureName: finalSignatureName,
        signatureTitle: finalSignatureTitle,
        organizationName: organizationNameOverride,
        // Requirements (auto)
        requirementMinPercentage,
        requirementAllChapters,
        requirementAllQuizzes,
        requirementAllAssignments,
        requirementsText,
        hasMetRequirements,
        // Scores/verification (sample defaults)
        totalQuizzes: 10,
        achievedScore: 9,
        totalScore: 10,
        percentage: requirementMinPercentage || 70,
        verificationCode: "SAMPLE-CERT-XXXX",
      };
      const payload = {
        template: { id: Number(templateId), data: [templateData] },
        format: "pdf",
        output: "file",
        name: `sample-certificate-${params.courseId}`,
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
        console.error("[CERT_SAMPLE] PDFGeneratorAPI error:", res.status, text);
        return new NextResponse("Failed to generate sample PDF", {
          status: 502,
        });
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      let pdfBuffer: ArrayBuffer | null = null;
      if (ct.includes("application/pdf")) {
        pdfBuffer = await res.arrayBuffer();
      } else {
        const json = await res.json().catch(() => null as any);
        const b64 =
          json?.document || json?.file || json?.base64 || json?.content;
        if (typeof b64 === "string" && b64.length > 0) {
          const cleaned = b64.startsWith("data:application/pdf;base64,")
            ? b64.replace(/^data:application\/pdf;base64\,/, "")
            : b64;
          const buf = Buffer.from(cleaned, "base64");
          pdfBuffer = buf.buffer.slice(
            buf.byteOffset,
            buf.byteOffset + buf.byteLength
          );
        } else if (typeof json?.url === "string") {
          const fileRes = await fetch(json.url, {
            headers: { Accept: "application/pdf" },
          });
          if (!fileRes.ok) {
            const t = await fileRes.text().catch(() => "");
            console.error(
              "[CERT_SAMPLE] Failed to fetch PDF URL:",
              fileRes.status,
              t
            );
            return new NextResponse("Failed to fetch sample PDF", {
              status: 502,
            });
          }
          pdfBuffer = await fileRes.arrayBuffer();
        }
      }

      if (!pdfBuffer || pdfBuffer.byteLength === 0) {
        return new NextResponse("Empty sample PDF", { status: 502 });
      }

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="sample-certificate.pdf"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Fallback: simple sample PDF via pdf-lib
    // Use the already-defined urlObj and qp from above

    // Read editable fields from query params (matching sidebar fields)
    const certificateTitleParam =
      qp.get("certificateTitle") || "Certificate of Completion";
    const courseTitleParam =
      qp.get("courseTitle") || qp.get("courseName") || course.title || "Course";
    const teacherNameParam =
      qp.get("teacherName") ||
      qp.get("instructorName") ||
      (course as any).user?.name ||
      "Instructor";
    const signatureNameParam = qp.get("signatureName") || teacherNameParam;
    const signatureTitleParam = qp.get("signatureTitle") || "Course Instructor";
    const organizationNameParam = qp.get("organizationName") || "";
    const studentNameParam = qp.get("studentName") || "Sample Student";
    const minPercentage = template?.minPercentage ?? 70;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // Landscape A4
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const { width, height } = page.getSize();

    // Background gradient effect (light blue to white)
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.95, 0.97, 1),
    });

    // Decorative border - outer
    page.drawRectangle({
      x: 15,
      y: 15,
      width: width - 30,
      height: height - 30,
      borderColor: rgb(0.7, 0.75, 0.85),
      borderWidth: 2,
    });

    // Inner border
    page.drawRectangle({
      x: 25,
      y: 25,
      width: width - 50,
      height: height - 50,
      borderColor: rgb(0.2, 0.35, 0.6),
      borderWidth: 3,
    });

    // Corner decorations (simple lines)
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

    // Certificate Title (editable) - main heading
    const title = certificateTitleParam.toUpperCase();
    const titleSize = 32;
    const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 85,
      size: titleSize,
      font: boldFont,
      color: rgb(0.15, 0.3, 0.5),
    });

    // Decorative line under title
    page.drawLine({
      start: { x: width / 2 - 150, y: height - 100 },
      end: { x: width / 2 + 150, y: height - 100 },
      thickness: 1.5,
      color: rgb(0.6, 0.5, 0.2),
    });

    // "This is to certify that"
    const certifyText = "This is to certify that";
    const certifyWidth = italicFont.widthOfTextAtSize(certifyText, 14);
    page.drawText(certifyText, {
      x: (width - certifyWidth) / 2,
      y: height - 140,
      size: 14,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Student Name (Sample Student for preview)
    const nameSize = 28;
    const nameWidth = boldFont.widthOfTextAtSize(studentNameParam, nameSize);
    page.drawText(studentNameParam, {
      x: (width - nameWidth) / 2,
      y: height - 175,
      size: nameSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Underline for student name
    page.drawLine({
      start: { x: width / 2 - 120, y: height - 182 },
      end: { x: width / 2 + 120, y: height - 182 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    // "has successfully completed the course"
    const completedText = "has successfully completed the course";
    const completedWidth = italicFont.widthOfTextAtSize(completedText, 14);
    page.drawText(completedText, {
      x: (width - completedWidth) / 2,
      y: height - 215,
      size: 14,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Course Title (editable)
    const courseSize = 22;
    const courseWidth = boldFont.widthOfTextAtSize(
      courseTitleParam,
      courseSize
    );
    page.drawText(courseTitleParam, {
      x: (width - courseWidth) / 2,
      y: height - 250,
      size: courseSize,
      font: boldFont,
      color: rgb(0.15, 0.3, 0.5),
    });

    // Instructor Name (editable)
    const instructorLabel = "Instructor: ";
    const instructorLabelWidth = regularFont.widthOfTextAtSize(
      instructorLabel,
      12
    );
    const instructorNameWidth = boldFont.widthOfTextAtSize(
      teacherNameParam,
      12
    );
    const totalInstructorWidth = instructorLabelWidth + instructorNameWidth;
    page.drawText(instructorLabel, {
      x: (width - totalInstructorWidth) / 2,
      y: height - 285,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(teacherNameParam, {
      x: (width - totalInstructorWidth) / 2 + instructorLabelWidth,
      y: height - 285,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Score and Requirements
    const scoreText = `Score: 95% (Minimum Required: ${minPercentage}%)`;
    const scoreWidth = regularFont.widthOfTextAtSize(scoreText, 11);
    page.drawText(scoreText, {
      x: (width - scoreWidth) / 2,
      y: height - 310,
      size: 11,
      font: regularFont,
      color: rgb(0.1, 0.5, 0.2),
    });

    // Completion Date
    const dateFormatted = new Date().toLocaleDateString("en-US", {
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

    // Signature Section (centered at bottom)
    const sigLineY = 95;

    // Signature line
    page.drawLine({
      start: { x: width / 2 - 100, y: sigLineY },
      end: { x: width / 2 + 100, y: sigLineY },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Signature Name (editable)
    const sigNameWidth = boldFont.widthOfTextAtSize(signatureNameParam, 14);
    page.drawText(signatureNameParam, {
      x: (width - sigNameWidth) / 2,
      y: sigLineY + 15,
      size: 14,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.15),
    });

    // Signature Title (editable)
    const sigTitleWidth = regularFont.widthOfTextAtSize(
      signatureTitleParam,
      11
    );
    page.drawText(signatureTitleParam, {
      x: (width - sigTitleWidth) / 2,
      y: sigLineY - 18,
      size: 11,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Organization Name (editable) - if provided
    if (organizationNameParam && organizationNameParam.trim()) {
      const orgWidth = italicFont.widthOfTextAtSize(organizationNameParam, 10);
      page.drawText(organizationNameParam, {
        x: (width - orgWidth) / 2,
        y: sigLineY - 35,
        size: 10,
        font: italicFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Verification code at bottom
    const verificationCode =
      "SAMPLE-PREVIEW-" + Date.now().toString(36).toUpperCase().slice(-6);
    const verifyText = `Verification: ${verificationCode}`;
    const verifyWidth = regularFont.widthOfTextAtSize(verifyText, 8);
    page.drawText(verifyText, {
      x: (width - verifyWidth) / 2,
      y: 40,
      size: 8,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sample-certificate.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[CERTIFICATE_SAMPLE_GET] Error:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
