"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChapterPreviewToggleProps {
  courseId: string;
  chapterId: string;
  isPreview: boolean;
}

export const ChapterPreviewToggle = ({
  courseId,
  chapterId,
  isPreview,
}: ChapterPreviewToggleProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setIsLoading(true);
      
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        isPreview: !isPreview,
      });

      toast.success(
        !isPreview 
          ? "Chapter marked as preview - students can watch for free!" 
          : "Chapter marked as locked - only enrolled students can access"
      );
      
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant={isPreview ? "default" : "outline"}
      size="sm"
      className="w-full"
    >
      {isPreview ? (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Preview Enabled
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Enable Preview
        </>
      )}
    </Button>
  );
};
