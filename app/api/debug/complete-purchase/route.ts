import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// DEBUG ENDPOINT - Remove in production
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = await req.json();
    
    if (!courseId) {
      return new NextResponse("Course ID required", { status: 400 });
    }

    // Find existing purchase
    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingPurchase) {
      // Update existing purchase to completed
      const updatedPurchase = await db.purchase.update({
        where: {
          id: existingPurchase.id,
        },
        data: {
          paymentStatus: "completed",
        },
      });
      
      return NextResponse.json({ 
        message: "Purchase marked as completed", 
        purchase: updatedPurchase 
      });
    } else {
      // Create new completed purchase
      const newPurchase = await db.purchase.create({
        data: {
          userId: user.id,
          courseId: courseId,
          amount: 0,
          paymentStatus: "completed",
        },
      });
      
      return NextResponse.json({ 
        message: "New purchase created and completed", 
        purchase: newPurchase 
      });
    }
  } catch (error: any) {
    console.error("[DEBUG_COMPLETE_PURCHASE]", error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}