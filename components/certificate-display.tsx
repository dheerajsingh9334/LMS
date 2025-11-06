"use client";

import { useState } from "react";
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
    // Create a canvas element to draw the certificate
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, "#1e3a8a");
    gradient.addColorStop(1, "#3b82f6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    // Border
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 20;
    ctx.strokeRect(30, 30, 1140, 740);

    // Inner border
    ctx.strokeStyle = "#fcd34d";
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 50, 1100, 700);

    // Title
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE OF COMPLETION", 600, 150);

    // Subtitle
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 24px Arial";
    ctx.fillText("This is to certify that", 600, 220);

    // Student name
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 48px Arial";
    ctx.fillText(certificate.studentName, 600, 300);

    // Course info
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.fillText("has successfully completed the course", 600, 360);

    // Course title
    ctx.fillStyle = "#fcd34d";
    ctx.font = "bold 32px Arial";
    const maxWidth = 900;
    const courseTitleText = courseTitle.length > 50 ? courseTitle.substring(0, 50) + "..." : courseTitle;
    ctx.fillText(courseTitleText, 600, 420);

    // Score box
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(400, 470, 400, 120);

    // Score details
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.fillText(`Total Quizzes: ${certificate.totalQuizzes}`, 600, 510);
    ctx.fillText(
      `Score: ${certificate.achievedScore} / ${certificate.totalScore}`,
      600,
      550
    );

    // Percentage
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 32px Arial";
    ctx.fillText(`${certificate.percentage.toFixed(2)}%`, 600, 590);

    // Date
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(
      `Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}`,
      600,
      680
    );

    // Convert to blob and download
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
  };

  if (certificate) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-yellow-500" />
              <CardTitle className="text-2xl">Certificate of Completion</CardTitle>
            </div>
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Earned
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Congratulations, {certificate.studentName}!
              </h3>
              <p className="text-gray-600">
                You have successfully completed <span className="font-semibold text-blue-600">{courseTitle}</span>
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Quizzes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {certificate.totalQuizzes}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {certificate.completedQuizzes}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {certificate.achievedScore}/{certificate.totalScore}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {certificate.percentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Issued on: {new Date(certificate.issueDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          <Button
            onClick={downloadCertificate}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Certificate
          </Button>
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
          Complete all quizzes in this course to earn your certificate of completion!
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
          * You must complete all quizzes with passing scores to generate the certificate
        </p>
      </CardContent>
    </Card>
  );
};
