"use client";

import { Button } from "@/components/ui/button";

interface StartLearningButtonProps {
  courseId: string;
}

export const StartLearningButton = ({ courseId }: StartLearningButtonProps) => {
  return (
    <Button
      onClick={() => window.location.href = `/courses/${courseId}/chapters`}
      size="lg"
      className="w-full md:w-auto bg-green-600 hover:bg-green-700"
    >
      Start Learning
    </Button>
  );
};