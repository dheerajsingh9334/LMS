"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface StudentCertificateDownloadButtonProps {
  courseId: string;
  fileName: string;
  className?: string;
  sourceUrl?: string | null;
}

export const StudentCertificateDownloadButton = ({
  courseId,
  fileName,
  className,
  sourceUrl,
}: StudentCertificateDownloadButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);

      // Use the local PDF generation endpoint so details always match
      const res = await axios.get(
        `/api/courses/${courseId}/certificate/pdf?useLocal=1`,
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "certificate.pdf";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Certificate downloaded!");
    } catch (err: any) {
      console.error("Certificate download error:", err);
      toast.error(err?.response?.data || "Failed to download certificate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className={className}
      size="lg"
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-2" />
      {isLoading ? "Downloading..." : "Download Certificate"}
    </Button>
  );
};
