"use client";

import axios from "axios";
import { Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface FinalExamActionsProps {
  disabled: boolean;
  courseId: string;
  finalExamId: string;
  isPublished: boolean;
}

export const FinalExamActions = ({
  disabled,
  courseId,
  finalExamId,
  isPublished,
}: FinalExamActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(`/api/courses/${courseId}/final-exams/${finalExamId}/unpublish`);
        toast.success("Final exam unpublished");
      } else {
        await axios.patch(`/api/courses/${courseId}/final-exams/${finalExamId}/publish`);
        toast.success("Final exam published");
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/courses/${courseId}/final-exams/${finalExamId}`);

      toast.success("Final exam deleted");
      router.push(`/teacher/courses/${courseId}/final-exams`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button onClick={onClick} disabled={disabled || isLoading} variant="outline" size="sm">
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};