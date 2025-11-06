"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import axios from "axios";

interface Attachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface CourseAttachmentsProps {
  courseId: string;
}

export const CourseAttachments = ({ courseId }: CourseAttachmentsProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}/attachments`);
        setAttachments(response.data);
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
        setAttachments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttachments();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="px-6 py-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading attachments...</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="px-6 py-4">
        <p className="text-sm text-gray-500 italic">No attachments available</p>
      </div>
    );
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (type?: string) => {
    if (type?.includes("pdf")) return "📄";
    if (type?.includes("zip") || type?.includes("rar")) return "📦";
    if (type?.includes("doc")) return "📝";
    if (type?.includes("image")) return "🖼️";
    if (type?.includes("video")) return "🎥";
    return "📁";
  };

  return (
    <div className="px-4 pb-4">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => window.open(attachment.url, "_blank")}
        >
          <span className="text-lg">{getFileIcon(attachment.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {attachment.name}
            </p>
            {attachment.size && (
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            )}
          </div>
          <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};