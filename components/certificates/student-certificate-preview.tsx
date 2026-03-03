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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const timestamp = new Date().getTime();
      const previewApiUrl = `/api/courses/${courseId}/certificate/pdf?preview=1&refresh=1&t=${timestamp}`;

      const response = await fetch(previewApiUrl);
      if (!response.ok) {
        throw new Error("Failed to load certificate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err: any) {
      console.error("[CERTIFICATE_PREVIEW] Error:", err);
      setError(err?.message || "Failed to load preview");
      toast.error(String(err?.message || "Failed to load preview"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, certificateUrl]);

  return (
    <div className={className}>
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Certificate Preview
        </h3>
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
        {!isLoading && blobUrl && (
          <iframe
            src={blobUrl}
            title="Certificate Preview"
            className="w-full h-[480px] border-0"
          />
        )}
        {!isLoading && error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}
        {!isLoading && !certificateUrl && !error && (
          <div className="p-4 text-sm text-amber-700 bg-amber-50 border border-amber-200">
            Certificate not issued yet. Complete all requirements to receive
            your certificate.
          </div>
        )}
      </div>
    </div>
  );
};
