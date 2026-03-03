"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface StudentCertificatePreviewProps {
  courseId: string;
  certificateUrl?: string | null;
  className?: string;
}

export const StudentCertificatePreview = ({
  courseId,
  certificateUrl,
  className,
}: StudentCertificatePreviewProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadPreview = async () => {
    try {
      setIsLoading(true);
      
      // Add timestamp and refresh params to bust cache
      const timestamp = new Date().getTime();
      const previewApiUrl = `/api/courses/${courseId}/certificate/pdf?preview=1&refresh=1&t=${timestamp}`;
      
      console.log("[CERTIFICATE_PREVIEW] Loading:", previewApiUrl);
      setPreviewUrl(previewApiUrl);
    } catch (err: any) {
      console.error("[CERTIFICATE_PREVIEW] Error:", err);
      toast.error(String(err?.message || "Failed to load preview"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    // Cleanup object URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, certificateUrl]);

  return (
    <div className={className}>
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700">Certificate Preview</h3>
      </div>
      <div
        className="relative w-full border rounded-lg overflow-hidden bg-white"
        style={{ minHeight: 360 }}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-[360px]">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}
        {!isLoading && previewUrl && (
          <object
            data={previewUrl}
            type="application/pdf"
            className="w-full h-[480px]"
          >
            <div className="p-4 text-sm text-muted-foreground">
              PDF preview not supported in this browser. Use the download
              button.
            </div>
          </object>
        )}
        {!isLoading && !certificateUrl && (
          <div className="p-4 text-sm text-amber-700 bg-amber-50 border border-amber-200">
            Certificate not issued yet. Complete all requirements to receive
            your certificate.
          </div>
        )}
      </div>
    </div>
  );
};
