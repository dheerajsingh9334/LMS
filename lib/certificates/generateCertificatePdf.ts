import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import { promises as fs } from "fs";

export interface CertificatePdfOptions {
  certificateTitle: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  minPercentage: number;
  scorePercent: number;
  issueDate: Date;
  verificationCode?: string;
  signatureTitle?: string;
  /** Optional small text under the signature line (e.g., organization name for preview). */
  organizationNameUnderSignature?: string;
}

/**
 * Generate a Marwadi-university style certificate PDF using pdf-lib.
 * Returns the raw PDF bytes as Uint8Array.
 */
export async function generateCertificatePdf(
  options: CertificatePdfOptions,
): Promise<Uint8Array> {
  const {
    certificateTitle,
    studentName,
    courseTitle,
    teacherName,
    minPercentage,
    scorePercent,
    issueDate,
    verificationCode,
    signatureTitle = "Course Instructor",
    organizationNameUnderSignature,
  } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // Landscape A4
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  // Background + borders
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.99, 0.99, 1),
  });
  page.drawRectangle({
    x: 18,
    y: 18,
    width: width - 36,
    height: height - 36,
    borderColor: rgb(0.7, 0.7, 0.8),
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.5, 0.1, 0.1),
    borderWidth: 3,
  });

  // Logo + organization name (Marwadi University style)
  try {
    const logoRelativePath =
      process.env.CERTIFICATE_LOGO_PATH || "public/marwadi-university-logo.png";
    const logoPath = path.join(process.cwd(), logoRelativePath);
    const logoBytes = await fs.readFile(logoPath);
    const logoBytesArray = new Uint8Array(
      logoBytes.buffer,
      logoBytes.byteOffset,
      logoBytes.byteLength,
    );

    const isPng = logoRelativePath.toLowerCase().endsWith(".png");
    const logoImage = isPng
      ? await pdfDoc.embedPng(logoBytesArray)
      : await pdfDoc.embedJpg(logoBytesArray);

    const desiredWidth = 120;
    const scale = desiredWidth / logoImage.width;
    const logoHeight = logoImage.height * scale;

    const logoX = width / 2 - desiredWidth / 2;
    const logoY = height - 110;

    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: desiredWidth,
      height: logoHeight,
    });

    const orgName = process.env.CERTIFICATE_ORG_NAME || "Marwadi University";
    const orgFontSize = 16;
    const orgWidth = boldFont.widthOfTextAtSize(orgName, orgFontSize);
    page.drawText(orgName, {
      x: (width - orgWidth) / 2,
      y: logoY - 18,
      size: orgFontSize,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.25),
    });
  } catch {
    // If logo file or env is missing, continue without breaking certificate
  }

  // Corner decorations
  const cornerSize = 30;
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

  // Main certificate title
  const title = certificateTitle.toUpperCase();
  const titleSize = 32;
  const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
  const titleY = height - 155;
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: titleY,
    size: titleSize,
    font: boldFont,
    color: rgb(0.15, 0.3, 0.5),
  });

  page.drawLine({
    start: { x: width / 2 - 150, y: titleY - 15 },
    end: { x: width / 2 + 150, y: titleY - 15 },
    thickness: 1.5,
    color: rgb(0.6, 0.5, 0.2),
  });

  // "This is to certify that"
  const certifyText = "This is to certify that";
  const certifyWidth = italicFont.widthOfTextAtSize(certifyText, 14);
  const certifyY = titleY - 55;
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: certifyY,
    size: 14,
    font: italicFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Student name
  const trimmedStudentName = String(studentName).substring(0, 60);
  const nameSize = 28;
  const nameWidth = boldFont.widthOfTextAtSize(trimmedStudentName, nameSize);
  const nameY = certifyY - 35;
  page.drawText(trimmedStudentName, {
    x: (width - nameWidth) / 2,
    y: nameY,
    size: nameSize,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Underline for student name
  page.drawLine({
    start: { x: width / 2 - 120, y: nameY - 7 },
    end: { x: width / 2 + 120, y: nameY - 7 },
    thickness: 1,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Completion phrase
  const completedText = "has successfully completed the course";
  const completedWidth = italicFont.widthOfTextAtSize(completedText, 14);
  const completedY = nameY - 40;
  page.drawText(completedText, {
    x: (width - completedWidth) / 2,
    y: completedY,
    size: 14,
    font: italicFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Course title with wrapping
  const courseSize = 22;
  const maxCourseWidth = width - 160;

  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const w = boldFont.widthOfTextAtSize(test, courseSize);
      if (w > maxCourseWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const courseLines = wrapText(courseTitle, maxCourseWidth);
  let courseY = completedY - 30;
  for (const line of courseLines) {
    const lineWidth = boldFont.widthOfTextAtSize(line, courseSize);
    page.drawText(line, {
      x: (width - lineWidth) / 2,
      y: courseY,
      size: courseSize,
      font: boldFont,
      color: rgb(0.15, 0.3, 0.5),
    });
    courseY -= courseSize + 4;
  }

  // Instructor line
  const instructorLabel = "Instructor: ";
  const instructorLabelWidth = regularFont.widthOfTextAtSize(
    instructorLabel,
    12,
  );
  const instructorNameWidth = boldFont.widthOfTextAtSize(teacherName, 12);
  const totalInstructorWidth = instructorLabelWidth + instructorNameWidth;
  page.drawText(instructorLabel, {
    x: (width - totalInstructorWidth) / 2,
    y: courseY - 25,
    size: 12,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(teacherName, {
    x: (width - totalInstructorWidth) / 2 + instructorLabelWidth,
    y: courseY - 25,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Score and requirements
  const scoreText = `Score: ${scorePercent}% (Minimum Required: ${minPercentage}%)`;
  const scoreWidth = regularFont.widthOfTextAtSize(scoreText, 11);
  page.drawText(scoreText, {
    x: (width - scoreWidth) / 2,
    y: courseY - 45,
    size: 11,
    font: regularFont,
    color: rgb(0.1, 0.5, 0.2),
  });

  // Completion date
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
    y: courseY - 65,
    size: 11,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(dateFormatted, {
    x: (width - totalDateWidth) / 2 + dateLabelWidth,
    y: courseY - 65,
    size: 11,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Signature section
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

  const sigTitleToUse = signatureTitle || "Course Instructor";
  const sigTitleWidth = regularFont.widthOfTextAtSize(sigTitleToUse, 11);
  page.drawText(sigTitleToUse, {
    x: (width - sigTitleWidth) / 2,
    y: sigLineY - 18,
    size: 11,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Optional organization name under signature (used by sample preview)
  if (organizationNameUnderSignature && organizationNameUnderSignature.trim()) {
    const orgWidth = italicFont.widthOfTextAtSize(
      organizationNameUnderSignature,
      10,
    );
    page.drawText(organizationNameUnderSignature, {
      x: (width - orgWidth) / 2,
      y: sigLineY - 35,
      size: 10,
      font: italicFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Verification code at bottom
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
  return pdfBytes;
}
