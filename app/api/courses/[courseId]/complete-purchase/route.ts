import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    const { userId } = await req.json();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure the user can only complete their own purchases
    if (user.id !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Find the pending purchase for this user and course
    const pendingPurchase = await db.purchase.findFirst({
      where: {
        userId: user.id,
        courseId: params.courseId,
        paymentStatus: "pending",
      },
      orderBy: {
        createdAt: "desc", // Get the most recent one
      },
    });

    if (!pendingPurchase) {
      return new NextResponse("No pending purchase found", { status: 404 });
    }

    // Update the purchase status to completed
    await db.purchase.update({
      where: {
        id: pendingPurchase.id,
      },
      data: {
        paymentStatus: "completed",
      },
    });

    console.log(`[COMPLETE_PURCHASE] Successfully completed purchase ${pendingPurchase.id} for course ${params.courseId}`);

    return NextResponse.json({ success: true, purchaseId: pendingPurchase.id });
  } catch (error: any) {
    console.error("[COMPLETE_PURCHASE] Error:", error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}