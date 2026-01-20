import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    console.log(
      "[COMPLETE_PURCHASE] Starting purchase completion for course:",
      params.courseId
    );

    const user = await currentUser();
    const { userId } = await req.json();

    console.log("[COMPLETE_PURCHASE] Auth check:", {
      authenticated: !!user,
      userId: userId,
      currentUserId: user?.id,
    });

    if (!user || !user.id) {
      console.error("[COMPLETE_PURCHASE] Unauthorized - no user session");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure the user can only complete their own purchases
    if (user.id !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    console.log("[COMPLETE_PURCHASE] Looking for pending purchase:", {
      userId: user.id,
      courseId: params.courseId,
    });

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
      select: {
        id: true,
        paymentStatus: true,
        stripeSessionId: true,
        createdAt: true,
      },
    });

    // If there is no pending purchase, it might already be completed by the webhook.
    if (!pendingPurchase) {
      console.error(
        "[COMPLETE_PURCHASE] No pending purchase found - checking for completed purchase"
      );

      const completedPurchase = await db.purchase.findFirst({
        where: {
          userId: user.id,
          courseId: params.courseId,
          paymentStatus: "completed",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          paymentStatus: true,
          stripeSessionId: true,
          createdAt: true,
        },
      });

      if (completedPurchase) {
        console.log(
          "[COMPLETE_PURCHASE] Found already completed purchase, returning success:",
          {
            purchaseId: completedPurchase.id,
            courseId: params.courseId,
          }
        );

        return NextResponse.json({
          success: true,
          purchaseId: completedPurchase.id,
          alreadyCompleted: true,
        });
      }

      console.error("[COMPLETE_PURCHASE] No purchase found for user & course");
      return new NextResponse("No pending purchase found", { status: 404 });
    }

    console.log("[COMPLETE_PURCHASE] Found pending purchase:", {
      purchaseId: pendingPurchase.id,
      status: pendingPurchase.paymentStatus,
      stripeSessionId: pendingPurchase.stripeSessionId,
    });

    try {
      // If it has a Stripe session ID, verify the payment status
      if (pendingPurchase.stripeSessionId) {
        console.log(
          "[COMPLETE_PURCHASE] Verifying Stripe session:",
          pendingPurchase.stripeSessionId
        );
        const session = await stripe.checkout.sessions.retrieve(
          pendingPurchase.stripeSessionId
        );

        if (session.payment_status !== "paid") {
          console.error("[COMPLETE_PURCHASE] Stripe session not paid:", {
            sessionId: session.id,
            status: session.payment_status,
          });
          return new NextResponse("Payment not completed", { status: 400 });
        }
      }

      // Update the purchase status to completed
      await db.purchase.update({
        where: {
          id: pendingPurchase.id,
        },
        data: {
          paymentStatus: "completed",
          updatedAt: new Date(),
        },
      });

      console.log("[COMPLETE_PURCHASE] Successfully completed purchase:", {
        purchaseId: pendingPurchase.id,
        courseId: params.courseId,
      });

      return NextResponse.json({
        success: true,
        purchaseId: pendingPurchase.id,
      });
    } catch (error) {
      console.error("[COMPLETE_PURCHASE] Failed to complete purchase:", error);
      return new NextResponse("Failed to complete purchase", { status: 500 });
    }
  } catch (error: any) {
    console.error("[COMPLETE_PURCHASE] Error:", error);
    return new NextResponse(`Internal Error: ${error.message}`, {
      status: 500,
    });
  }
}
