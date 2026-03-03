"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface CheckoutSuccessHandlerProps {
  courseId: string;
  userId: string;
}

export const CheckoutSuccessHandler = ({ courseId, userId }: CheckoutSuccessHandlerProps) => {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "1") {
      // Mark the purchase as completed
      fetch(`/api/courses/${courseId}/complete-purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }).then(async (response) => {
        if (response.ok) {
          // Remove the success parameter from the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Force a hard reload to update all states
          window.location.href = `/courses/${courseId}/chapters`;
        } else {
          throw new Error('Purchase completion failed');
        }
      }).catch((error) => {
        console.error("Failed to complete purchase:", error);
        // Reload anyway to ensure UI is in a consistent state
        window.location.reload();
      });
    }
  }, [success, courseId, userId]);

  return null;
};