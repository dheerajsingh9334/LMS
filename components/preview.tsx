"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";

import "react-quill/dist/quill.bubble.css";

interface PreviewProps {
  value: string;
};

export const Preview = ({
  value,
}: PreviewProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const ReactQuill = useMemo(() => dynamic(() => import("react-quill"), { ssr: false }), []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return a simple div for empty values to avoid hydration issues
  if (!value || value.trim() === '') {
    return <div className="text-muted-foreground italic">No content</div>;
  }

  // Show loading state during hydration
  if (!isMounted) {
    return (
      <div className="quill-content bg-gray-50 animate-pulse rounded p-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="quill-content" suppressHydrationWarning>
      <ReactQuill
        theme="bubble"
        value={value}
        readOnly
        modules={{
          toolbar: false,
        }}
      />
    </div>
  );
};
