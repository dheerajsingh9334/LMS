import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

// POST: Issue or regenerate a certificate for a specific student in a course
// Body: { certificateId?: string, studentId?: string }
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure the requester is the course owner (teacher)
    const course = await db.course.findUnique({
      where: { id: params.courseId, userId: user.id },
      select: { id: true, title: true, user: { select: { name: true } } },
    });
    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const body = await req.json().catch(() => ({}) as any);
    const { certificateId, studentId } = body || {};

    // Locate certificate record
    let certificate = null as any;
    if (certificateId) {
      certificate = await db.certificate.findUnique({
        where: { id: String(certificateId) },
        include: { course: { select: { title: true } } },
      });
    } else if (studentId) {
      certificate = await db.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: String(studentId),
            courseId: params.courseId,
          },
        },
        include: { course: { select: { title: true } } },
      });
    }

    if (!certificate) {
      return new NextResponse("Certificate not found", { status: 404 });
    }

    // Prefer PDFGeneratorAPI if configured
    const apiKey = process.env.PDFGEN_API_KEY;
    const apiSecret = process.env.PDFGEN_API_SECRET;
    const templateId = process.env.PDFGEN_TEMPLATE_ID;
    const region = process.env.PDFGEN_REGION || "us1";
    const workspace = process.env.PDFGEN_WORKSPACE || user.id;

    if (apiKey && apiSecret && templateId) {
      const now = Math.floor(Date.now() / 1000);
      const aud = `https://${region}.pdfgeneratorapi.com`;
      const token = signJwtHS256(
        { iss: apiKey, sub: String(workspace), aud, iat: now, exp: now + 300 },
        apiSecret,
      );

      // Load template settings for title/requirements
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

      const teacherName = course.user?.name || "Instructor";
      const completionDateIso =
        certificate.issueDate || new Date().toISOString();
      const completionDateText = new Date(completionDateIso).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      );

      const reqParts: string[] = [];
      const requirementMinPercentage = Number(
        templateSettings?.minPercentage ?? 0,
      );
      const requirementAllChapters =
        templateSettings?.requireAllChapters ?? true;
      const requirementAllQuizzes = templateSettings?.requireAllQuizzes ?? true;
      const requirementAllAssignments =
        templateSettings?.requireAllAssignments ?? true;
      if (requirementAllChapters) reqParts.push("All chapters");
      if (requirementAllQuizzes) reqParts.push("All quizzes");
      if (requirementAllAssignments) reqParts.push("All assignments");
      if (requirementMinPercentage > 0)
        reqParts.push(`Minimum ${requirementMinPercentage}%`);
      const requirementsText = `Requirements: ${reqParts.join(", ")}`;
      const hasMetRequirements =
        Number(certificate.percentage || 0) >= requirementMinPercentage;

      const templateData = {
        studentName: String(certificate.studentName || "Student"),
        courseTitle: String(
          certificate.course?.title || course.title || "Course",
        ),
        courseName: String(
          certificate.course?.title || course.title || "Course",
        ),
        teacherName: String(templateSettings?.signatureName || teacherName),
        certificateTitle:
          templateSettings?.certificateTitle || "Certificate of Completion",
        organizationName: String(
          templateSettings?.organizationName || course.title || "",
        ),
        completionDate: completionDateIso,
        completionDateText,
        issueDate: certificate.issueDate || new Date().toISOString(),
        signatureName: String(templateSettings?.signatureName || teacherName),
        signatureTitle: String(
          templateSettings?.signatureTitle || "Course Instructor",
        ),
        requirementMinPercentage,
        requirementAllChapters,
        requirementAllQuizzes,
        requirementAllAssignments,
        requirementsText,
        hasMetRequirements,
        totalQuizzes: Number(certificate.totalQuizzes || 0),
        achievedScore: Number(certificate.achievedScore || 0),
        totalScore: Number(certificate.totalScore || 0),
        percentage: Number(certificate.percentage || 0),
        verificationCode: String(certificate.verificationCode || ""),
      };

      const genUrl = `${aud}/api/v4/documents/generate`;
      const payload = {
        template: { id: Number(templateId), data: [templateData] },
        format: "pdf",
        output: "file",
        name: `certificate-${params.courseId}-${certificate.userId}`,
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
        console.error("[CERT_ISSUE] PDFGeneratorAPI error:", res.status, text);
        return new NextResponse("Failed to generate certificate", {
          status: 502,
        });
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      let url: string | null = null;
      if (ct.includes("application/json")) {
        const json = await res.json().catch(() => null as any);
        url =
          json?.url ||
          json?.fileUrl ||
          json?.downloadUrl ||
          json?.response?.url ||
          json?.response?.fileUrl ||
          json?.response?.downloadUrl ||
          null;
      }

      // Persist the returned URL (if any)
      if (url) {
        await db.certificate.update({
          where: { id: certificate.id },
          data: { certificateUrl: url, isAutoGenerated: false },
        });
        return NextResponse.json({ ok: true, certificateUrl: url });
      }

      // Fallback: store bytes locally
      const pdfBytes = ct.includes("application/pdf")
        ? await res.arrayBuffer()
        : await res.arrayBuffer();
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `certificate-${params.courseId}-${
        certificate.userId
      }-${Date.now()}.pdf`;
      const fullPath = path.join(uploadsDir, filename);
      const bytes = new Uint8Array(pdfBytes as ArrayBuffer);
      await fs.writeFile(fullPath, bytes);
      const publicUrl = `/uploads/${filename}`;
      await db.certificate.update({
        where: { id: certificate.id },
        data: { certificateUrl: publicUrl, isAutoGenerated: false },
      });
      return NextResponse.json({ ok: true, certificateUrl: publicUrl });
    }

    // No external generator: create PDF using template image positions and save
    const template = await db.certificateTemplate.findUnique({
      where: { courseId: params.courseId },
    });
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();

    // Draw template image if available
    if (template?.templateUrl && template.templateType === "image") {
      try {
        let imgBytes: Uint8Array | null = null;
        const isRemote = /^https?:\/\//i.test(template.templateUrl);
        if (isRemote) {
          const imgRes = await fetch(template.templateUrl);
          if (imgRes.ok) {
            imgBytes = new Uint8Array(await imgRes.arrayBuffer());
          }
        } else {
          const rel = template.templateUrl.replace(/^\//, "");
          const fullPath = path.join(process.cwd(), "public", rel);
          imgBytes = new Uint8Array(await fs.readFile(fullPath));
        }
        if (imgBytes) {
          const lower = template.templateUrl.toLowerCase();
          const isPng = lower.endsWith(".png");
          const isJpg = lower.endsWith(".jpg") || lower.endsWith(".jpeg");
          let embedded;
          if (isPng) embedded = await pdfDoc.embedPng(imgBytes);
          else if (isJpg) embedded = await pdfDoc.embedJpg(imgBytes);
          if (embedded) {
            const imgW = embedded.width;
            const imgH = embedded.height;
            const scale = Math.min(width / imgW, height / imgH);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            page.drawImage(embedded, {
              x: (width - drawW) / 2,
              y: (height - drawH) / 2,
              width: drawW,
              height: drawH,
            });
          }
        }
      } catch (e) {
        console.warn("[CERT_ISSUE] Failed to load template image", e);
      }
    } else {
      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
    }

    // Font color
    const fontSize = template?.fontSize ?? 24;
    const fontColorHex = (template?.fontColor || "#000000").replace("#", "");
    const r = parseInt(fontColorHex.substring(0, 2), 16) / 255;
    const g = parseInt(fontColorHex.substring(2, 4), 16) / 255;
    const b = parseInt(fontColorHex.substring(4, 6), 16) / 255;
    const fontColor = rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);

    const studentName = String(certificate.studentName || "Student").substring(
      0,
      60,
    );
    const courseTitle = String(
      certificate.course?.title || course.title || "Course",
    ).substring(0, 80);
    const issueDate = certificate.issueDate
      ? new Date(certificate.issueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    const drawText = (
      text: string,
      size: number,
      x?: number | null,
      y?: number | null,
      bold?: boolean,
    ) => {
      const font = bold ? boldFont : regularFont;
      const textWidth = font.widthOfTextAtSize(text, size);
      const drawX = typeof x === "number" ? x : (width - textWidth) / 2;
      const drawY = typeof y === "number" ? y : height / 2;
      page.drawText(text, { x: drawX, y: drawY, size, font, color: fontColor });
    };

    drawText(
      courseTitle,
      Math.max(18, fontSize - 2),
      template?.coursePositionX,
      template?.coursePositionY,
      true,
    );
    drawText(
      studentName,
      fontSize,
      template?.namePositionX,
      template?.namePositionY,
      true,
    );
    drawText(
      `Issued on: ${issueDate}`,
      Math.max(12, fontSize - 10),
      template?.datePositionX,
      template?.datePositionY,
    );
    page.drawText(
      `Verification Code: ${String(certificate.verificationCode)}`,
      { x: 40, y: 40, size: 10, font: regularFont, color: rgb(0.4, 0.4, 0.4) },
    );

    const pdfBytes = await pdfDoc.save();
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `certificate-${params.courseId}-${
      certificate.userId
    }-${Date.now()}.pdf`;
    const fullPath = path.join(uploadsDir, filename);
    await fs.writeFile(fullPath, pdfBytes as Uint8Array);
    const publicUrl = `/uploads/${filename}`;

    await db.certificate.update({
      where: { id: certificate.id },
      data: { certificateUrl: publicUrl, isAutoGenerated: false },
    });

    return NextResponse.json({ ok: true, certificateUrl: publicUrl });
  } catch (error) {
    console.error("[CERTIFICATE_ISSUE_POST] Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
