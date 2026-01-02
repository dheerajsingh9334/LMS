"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface AdminCourseActionsProps {
  courseId: string;
  isPublished: boolean;
}

export const AdminCourseActions = ({
  courseId,
  isPublished,
}: AdminCourseActionsProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleHide = async () => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/admin/courses/${courseId}/unpublish`, {
        comment,
      });
      toast.success("Course unpublished and teacher notified");
      setOpen(false);
      setComment("");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update course");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPublished) {
    return (
      <span className="text-xs text-muted-foreground">Already unpublished</span>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        Hide & comment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide course & send feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              This will unpublish the course so students can no longer enroll.
              Add a short explanation for the instructor.
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain why you are hiding this course (e.g. missing content, policy issue, incorrect information)..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleHide} disabled={isLoading}>
              Confirm hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
