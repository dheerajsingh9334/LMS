"use client";

import { useState, useEffect } from "react";

interface SafeRichContentProps {
  content: string;
  className?: string;
}

export const SafeRichContent = ({ 
  content, 
  className = "" 
}: SafeRichContentProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return loading state during hydration
  if (!isMounted) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Sanitize HTML to prevent invalid nesting
  const sanitizedContent = content
    .replace(/<div([^>]*)>/g, '<span$1 style="display: block;">')
    .replace(/<\/div>/g, '</span>');

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      suppressHydrationWarning
    />
  );
};