"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface CertificateDisplayProps {
  courseId: string;
  courseTitle: string;
  initialCertificate?: any;
}

export const CertificateDisplay = ({
  courseId,
  courseTitle,
  initialCertificate,
}: CertificateDisplayProps) => {
  const [certificate, setCertificate] = useState(initialCertificate);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const generateCertificate = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/courses/${courseId}/certificate`);
      setCertificate(response.data);
      toast.success("Certificate generated successfully!");
      router.refresh();
    } catch (error: any) {
      const errorMessage =
        error.response?.data || "Failed to generate certificate";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCertificate = () => {
    // Create a canvas element to draw the certificate (matching PDF style)
    const canvas = document.createElement("canvas");
    const width = 1200; // Landscape A4 ratio
    const height = 850;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Load logo and draw certificate
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/marwadi-university-logo.png";

    const drawCertificate = () => {
      // Light background (matching PDF)
      ctx.fillStyle = "#fcfcff";
      ctx.fillRect(0, 0, width, height);

      // Outer border (gray)
      ctx.strokeStyle = "#b3b3cc";
      ctx.lineWidth = 3;
      ctx.strokeRect(25, 25, width - 50, height - 50);

      // Inner border (dark red/maroon)
      ctx.strokeStyle = "#801a1a";
      ctx.lineWidth = 4;
      ctx.strokeRect(42, 42, width - 84, height - 84);

      // Corner decorations (gold/brown color)
      const cornerColor = "#998033";
      const cornerSize = 40;
      ctx.strokeStyle = cornerColor;
      ctx.lineWidth = 3;

      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(48, height - 48);
      ctx.lineTo(48 + cornerSize, height - 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, height - 48);
      ctx.lineTo(48, height - 48 - cornerSize);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(width - 48 - cornerSize, height - 48);
      ctx.lineTo(width - 48, height - 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width - 48, height - 48);
      ctx.lineTo(width - 48, height - 48 - cornerSize);
      ctx.stroke();

      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(48, 48);
      ctx.lineTo(48 + cornerSize, 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, 48);
      ctx.lineTo(48, 48 + cornerSize);
      ctx.stroke();

      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(width - 48 - cornerSize, 48);
      ctx.lineTo(width - 48, 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width - 48, 48);
      ctx.lineTo(width - 48, 48 + cornerSize);
      ctx.stroke();

      // Draw logo at top center
      const logoWidth = 140;
      const logoHeight = 140;
      const logoX = (width - logoWidth) / 2;
      const logoY = height - 170;
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
      }

      // Organization name under logo
      const orgName = "Marwadi University";
      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#262640";
      ctx.textAlign = "center";
      ctx.fillText(orgName, width / 2, logoY - 15);

      // Function to wrap text
      const wrapText = (
        text: string,
        maxWidth: number,
        fontSize: number,
        fontWeight = "bold",
      ) => {
        ctx.font = `${fontWeight} ${fontSize}px Arial`;
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = "";

        for (let word of words) {
          let metrics = ctx.measureText(word);
          if (metrics.width > maxWidth) {
            while (
              ctx.measureText(word + "...").width > maxWidth - 20 &&
              word.length > 8
            ) {
              word = word.substring(0, word.length - 1);
            }
            word = word + "...";
          }
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Certificate title (blue color matching PDF)
      const title = "CERTIFICATE OF COMPLETION";
      const titleSize = 36;
      const maxTitleWidth = width - 200;
      ctx.font = `bold ${titleSize}px Arial`;
      ctx.fillStyle = "#264d80"; // Blue color matching PDF
      const titleLines = wrapText(title, maxTitleWidth, titleSize);
      let titleY = logoY - 60;
      for (const line of titleLines) {
        ctx.fillText(line, width / 2, titleY);
        titleY -= titleSize + 8;
      }
      const baseTitleY = logoY - 60;

      // Decorative line under title
      ctx.strokeStyle = "#998033";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, baseTitleY - 20);
      ctx.lineTo(width / 2 + 200, baseTitleY - 20);
      ctx.stroke();

      // "This is to certify that" (italic gray)
      ctx.font = "italic 18px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText("This is to certify that", width / 2, baseTitleY - 55);

      // Student name (bold black)
      const studentName = certificate.studentName.substring(0, 60);
      ctx.font = "bold 34px Arial";
      ctx.fillStyle = "#1a1a1a";
      const nameY = baseTitleY - 100;
      ctx.fillText(studentName, width / 2, nameY);

      // Underline for student name
      ctx.strokeStyle = "#4d4d4d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 160, nameY - 10);
      ctx.lineTo(width / 2 + 160, nameY - 10);
      ctx.stroke();

      // "has successfully completed the course" (italic gray)
      ctx.font = "italic 18px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(
        "has successfully completed the course",
        width / 2,
        nameY - 45,
      );

      // Course title (blue, wrapped)
      ctx.fillStyle = "#264d80";
      const courseLines = wrapText(courseTitle, width - 200, 28);
      let courseY = nameY - 85;
      ctx.font = "bold 28px Arial";
      for (const line of courseLines) {
        ctx.fillText(line, width / 2, courseY);
        courseY -= 32;
      }

      // Score info (green)
      const scoreText = `Score: ${certificate.percentage.toFixed(2)}%`;
      ctx.font = "16px Arial";
      ctx.fillStyle = "#1a8033";
      ctx.fillText(scoreText, width / 2, courseY - 25);

      // Date of completion
      const dateFormatted = new Date(certificate.issueDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );
      ctx.font = "15px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(`Date of Completion: `, width / 2 - 70, courseY - 55);
      ctx.font = "bold 15px Arial";
      ctx.fillStyle = "#333333";
      ctx.fillText(dateFormatted, width / 2 + 60, courseY - 55);

      // Signature section
      const sigY = 135;

      // Signature line
      ctx.strokeStyle = "#4d4d4d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 130, sigY);
      ctx.lineTo(width / 2 + 130, sigY);
      ctx.stroke();

      // Signature title
      ctx.font = "14px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText("Course Instructor", width / 2, sigY - 15);

      // Verification code if available
      if (certificate.verificationCode) {
        ctx.font = "11px Arial";
        ctx.fillStyle = "#808080";
        ctx.fillText(
          `Verification: ${certificate.verificationCode}`,
          width / 2,
          70,
        );
      }
    };

    // Wait for logo to load, then draw
    if (logo.complete) {
      drawCertificate();
      downloadCanvas();
    } else {
      logo.onload = () => {
        drawCertificate();
        downloadCanvas();
      };
      logo.onerror = () => {
        drawCertificate();
        downloadCanvas();
      };
    }

    function downloadCanvas() {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `certificate-${courseTitle.replace(/\s+/g, "-")}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Certificate downloaded!");
      });
    }
  };

  const downloadPdf = async () => {
    try {
      setIsLoading(true);
      // Prefer arraybuffer to avoid blob parsing quirks across browsers
      const response = await axios.get(
        `/api/courses/${courseId}/certificate/pdf`,
        {
          responseType: "arraybuffer",
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      if (!blob || blob.size === 0) {
        throw new Error("Empty PDF file received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${courseTitle.replace(/\s+/g, "-")}.pdf`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Certificate PDF downloaded!");
    } catch (error: any) {
      const message =
        error?.message || error?.response?.data || "Failed to download PDF";
      toast.error(String(message));
    } finally {
      setIsLoading(false);
    }
  };

  if (certificate) {
    return (
      <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-amber-50 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-yellow-600" />
              <CardTitle className="text-2xl text-gray-800">
                Certificate of Completion
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-md overflow-hidden bg-white border border-gray-200 shadow-sm">
                <Image
                  src="/marwadi-university-logo.png"
                  alt="College logo"
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                />
              </div>
              <Badge className="bg-green-600 text-white shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Earned
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-0">
          {/* Certificate Preview - matches PDF style */}
          <div className="relative mx-4 mt-4 rounded-lg overflow-hidden shadow-lg">
            {/* Certificate visual */}
            <div className="bg-[#fcfcff] p-8 border-4 border-[#801a1a] relative">
              {/* Corner decorations */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#998033]"></div>
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#998033]"></div>
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#998033]"></div>
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#998033]"></div>

              <div className="text-center space-y-4">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                  <div className="relative h-16 w-16">
                    <Image
                      src="/marwadi-university-logo.png"
                      alt="University Logo"
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                </div>

                {/* Organization name */}
                <p className="text-sm font-bold text-[#262640] tracking-wide">
                  Marwadi University
                </p>

                {/* Certificate title */}
                <h2 className="text-2xl font-bold text-[#264d80] tracking-widest">
                  CERTIFICATE OF COMPLETION
                </h2>

                {/* Decorative line */}
                <div className="flex justify-center">
                  <div className="w-48 h-0.5 bg-[#998033]"></div>
                </div>

                {/* Certify text */}
                <p className="text-gray-500 italic text-sm">
                  This is to certify that
                </p>

                {/* Student name */}
                <div className="py-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {certificate.studentName}
                  </h3>
                  <div className="flex justify-center mt-1">
                    <div className="w-40 h-px bg-gray-400"></div>
                  </div>
                </div>

                {/* Completed text */}
                <p className="text-gray-500 italic text-sm">
                  has successfully completed the course
                </p>

                {/* Course title */}
                <h4 className="text-xl font-bold text-[#264d80] px-8">
                  {courseTitle}
                </h4>

                {/* Score */}
                <p className="text-green-600 font-medium text-sm">
                  Score: {certificate.percentage.toFixed(2)}%
                </p>

                {/* Date */}
                <p className="text-gray-500 text-sm">
                  Date of Completion:{" "}
                  <span className="font-medium text-gray-700">
                    {new Date(certificate.issueDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </p>

                {/* Signature section */}
                <div className="pt-4">
                  <div className="flex justify-center">
                    <div className="w-32 h-px bg-gray-400"></div>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    Course Instructor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600">Total Quizzes</p>
                <p className="text-xl font-bold text-blue-600">
                  {certificate.totalQuizzes}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-xl font-bold text-green-600">
                  {certificate.completedQuizzes}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-gray-600">Your Score</p>
                <p className="text-xl font-bold text-purple-600">
                  {certificate.achievedScore}/{certificate.totalScore}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <p className="text-xs text-gray-600">Percentage</p>
                <p className="text-xl font-bold text-yellow-600">
                  {certificate.percentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
            <Button
              onClick={downloadCertificate}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={downloadPdf}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="w-8 h-8 text-gray-400" />
          <CardTitle className="text-2xl text-gray-600">
            Certificate Not Yet Earned
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Complete all quizzes in this course to earn your certificate of
          completion!
        </p>
        <Button
          onClick={generateCertificate}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Generating..." : "Generate Certificate"}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          * You must complete all quizzes with passing scores to generate the
          certificate
        </p>
      </CardContent>
    </Card>
  );
};
