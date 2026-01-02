import Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    console.log("[STRIPE_WEBHOOK] Received webhook request");
    
    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string | null;

    if (!signature) {
      console.error("[STRIPE_WEBHOOK] Missing Stripe-Signature header");
      return new NextResponse("Webhook Error: Missing Stripe-Signature header", { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[STRIPE_WEBHOOK] Missing STRIPE_WEBHOOK_SECRET env variable");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log("[STRIPE_WEBHOOK] Event verified:", event.type);
    } catch (error: any) {
      console.error("[STRIPE_WEBHOOK] Verification failed:", error.message);
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Only process events we care about with detailed logging
    const relevantEvents = ['checkout.session.completed', 'checkout.session.expired'];
    if (!relevantEvents.includes(event.type)) {
      return new NextResponse(null, { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session?.metadata?.userId;
    const courseId = session?.metadata?.courseId;
    const purchaseId = session?.metadata?.purchaseId;

    console.log("[STRIPE_WEBHOOK] Processing session:", {
      eventType: event.type,
      sessionId: session.id,
      metadata: { userId, courseId, purchaseId }
    });

    if (event.type === "checkout.session.completed") {
      if (!userId || !courseId || !purchaseId) {
        console.error("[STRIPE_WEBHOOK] Missing metadata:", { userId, courseId, purchaseId });
        return new NextResponse("Webhook Error: Missing metadata", { status: 400 });
      }

      try {
        // Verify purchase exists and hasn't been processed
        const existingPurchase = await db.purchase.findUnique({
          where: { id: purchaseId },
          select: { id: true, paymentStatus: true }
        });

        if (!existingPurchase) {
          console.error("[STRIPE_WEBHOOK] Purchase not found:", purchaseId);
          return new NextResponse("Purchase not found", { status: 404 });
        }

        if (existingPurchase.paymentStatus === "completed") {
          console.log("[STRIPE_WEBHOOK] Purchase already completed:", purchaseId);
          return new NextResponse(null, { status: 200 });
        }

        // Update purchase status
        await db.purchase.update({
          where: { id: purchaseId },
          data: {
            paymentStatus: "completed",
            updatedAt: new Date()
          },
        });
        console.log("[STRIPE_WEBHOOK] Purchase marked as completed:", purchaseId);
      } catch (error) {
        console.error("[STRIPE_WEBHOOK] Failed to update purchase:", error);
        return new NextResponse("Failed to update purchase", { status: 500 });
      }
    } else if (event.type === "checkout.session.expired") {
      if (purchaseId) {
        try {
          await db.purchase.update({
            where: { id: purchaseId },
            data: {
              paymentStatus: "failed",
              updatedAt: new Date()
            },
          });
          console.log("[STRIPE_WEBHOOK] Purchase marked as failed:", purchaseId);
        } catch (error) {
          console.error("[STRIPE_WEBHOOK] Failed to mark purchase as failed:", error);
          return new NextResponse("Failed to update purchase", { status: 500 });
        }
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Unhandled error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
