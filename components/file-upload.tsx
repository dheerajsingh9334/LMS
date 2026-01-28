"use client";

import toast from "react-hot-toast";
import { UploadDropzone } from "@/lib/uploadthing";
import { ourFileRouter } from "@/app/api/uploadthing/core";

interface FileUploadProps {
  onChange: (url?: string) => void;
  endpoint: keyof typeof ourFileRouter;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export const FileUpload = ({
  onChange,
  endpoint,
  maxSizeMB = 50, // default 50MB max
  allowedTypes = ["image", "video", "audio", "text", "pdf", "word", "zip"],
}: FileUploadProps) => {
  const validateFile = (file: File): boolean => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type.toLowerCase();

    console.log("Validating:", { fileExtension, mimeType, allowedTypes });

    // 1. Size check
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      toast.error(
        `File size exceeds ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`
      );
      return false;
    }

    // 2. Type check
    const isAllowed = allowedTypes.some((type) => {
      const t = type.toLowerCase();

      // MIME wildcards
      if (mimeType.startsWith(`${t}/`)) return true;

      // Specific file extensions
      if (fileExtension === t) return true;

      // Handle shortcuts
      if (t === "pdf" && mimeType === "application/pdf") return true;

      if (
        t === "word" &&
        (mimeType.includes("word") ||
          mimeType.includes("officedocument") ||
          ["doc", "docx"].includes(fileExtension))
      )
        return true;

      if (
        t === "zip" &&
        (mimeType === "application/zip" ||
          mimeType === "application/x-zip-compressed" ||
          ["zip", "rar", "7z"].includes(fileExtension))
      )
        return true;

      return false;
    });

    if (!isAllowed) {
      toast.error(
        `File type not allowed. Supported: ${allowedTypes.join(", ")}`
      );
      return false;
    }

    return true;
  };

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        if (res && res.length > 0) {
          onChange(res[0].url);
          toast.success("Upload complete!");
        }
      }}
      onUploadError={(error: Error) => {
        console.error("[FileUpload] Upload error details:", {
          error: error?.message || "Unknown error",
          stack: error?.stack,
          endpoint,
          timestamp: new Date().toISOString()
        });
        
        const msg = error?.message || "Unknown upload error";
        
        if (msg.includes("FileSizeMismatch") || msg.includes("size")) {
          toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
        } else if (msg.includes("InvalidFileType") || msg.includes("type")) {
          toast.error(`Unsupported file type. Allowed: ${allowedTypes.join(", ")}`);
        } else if (msg.includes("Unauthorized") || msg.includes("auth")) {
          toast.error("Authentication failed. Please refresh and try again.");
        } else if (msg.includes("Network") || msg.includes("fetch")) {
          toast.error("Network error. Check your internet connection.");
        } else {
          toast.error(`Upload failed: ${msg.length > 100 ? msg.substring(0, 100) + "..." : msg}`);
        }
      }}
      onBeforeUploadBegin={(files) => {
        const validFiles = files.filter(validateFile);
        return validFiles.length > 0 ? validFiles : [];
      }}
      appearance={{
        button:
          "ut-ready:bg-blue-600 ut-uploading:cursor-not-allowed bg-blue-500 text-white px-4 py-2 rounded-md transition hover:bg-blue-600",
        container:
          "w-full flex-col rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 transition",
        allowedContent:
          "flex h-8 flex-col items-center justify-center px-2 text-gray-500 text-sm",
      }}
    />
  );
};
