"use client";

import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface CoursePurchaseButtonProps {
  courseId: string;
  price: number | null;
  isFree: boolean;
  isPurchased?: boolean;
}

export const CoursePurchaseButton = ({
  courseId,
  price,
  isFree,
  isPurchased = false,
}: CoursePurchaseButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);



  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isFree || !price) {
        // Free enrollment
        const response = await axios.post(`/api/courses/${courseId}/enroll`);

        if (response.data.success) {
          toast.success("Successfully enrolled in the course!");
          // Redirect with success parameter to trigger state update
          window.location.href = `/courses/${courseId}/chapters?success=1`;
        } else {
          console.error("Enrollment failed:", response.data);
          toast.error(response.data.message || "Failed to enroll in course");
        }
      } else {
        // Paid course - redirect to Stripe checkout
        const response = await axios.post(`/api/courses/${courseId}/checkout`);
        
        const url = response?.data?.url;
        if (url) {
          window.location.assign(url);
        } else {
          console.error("Checkout response:", response.data);
          toast.error("Checkout failed - please try again");
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data || error?.message || "Something went wrong";
      console.error("Purchase error:", error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Show purchased state - redirect to first chapter
  if (isPurchased) {
    return (
      <Button
        onClick={() => window.location.href = `/courses/${courseId}/chapters`}
        size="lg"
        className="w-full md:w-auto bg-green-600 hover:bg-green-700"
      >
        ✓ Start Learning
      </Button>
    );
  }

  // Debug: Add manual completion button in development
  const debugCompletePurchase = async () => {
    try {
      const response = await axios.post('/api/debug/complete-purchase', {
        courseId
      });
      console.log('Debug purchase completion:', response.data);
      toast.success("Purchase marked as completed (debug)");
      window.location.href = `/courses/${courseId}/chapters`;
    } catch (error) {
      console.error('Debug purchase error:', error);
      toast.error("Debug completion failed");
    }
  };

  const buttonText = isFree || !price 
    ? "Enroll for Free" 
    : `Buy for ₹${price}`;

  return (
    <div className="space-y-2">
      <Button
        onClick={onClick}
        disabled={isLoading}
        size="lg"
        className="w-full md:w-auto"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {isLoading ? "Processing..." : buttonText}
      </Button>
      
      {/* Debug button for development */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          onClick={debugCompletePurchase}
          variant="outline"
          size="sm"
          className="w-full md:w-auto text-xs"
        >
          🐛 Debug: Mark as Purchased
        </Button>
      )}
    </div>
  );
};
