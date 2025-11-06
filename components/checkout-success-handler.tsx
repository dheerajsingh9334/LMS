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
      }).then(() => {
        // Remove the success parameter from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Reload the page to reflect the purchase status
        window.location.reload();
      }).catch((error) => {
        console.error("Failed to complete purchase:", error);
      });
    }
  }, [success, courseId, userId]);

  return null;
};