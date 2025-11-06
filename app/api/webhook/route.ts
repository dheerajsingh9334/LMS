import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;
  const purchaseId = session?.metadata?.purchaseId;

  if (event.type === "checkout.session.completed") {
    if (!userId || !courseId || !purchaseId) {
      return new NextResponse(`Webhook Error: Missing metadata`, {
        status: 400,
      });
    }

    // Update purchase status (stripeSessionId should already be set)
    await db.purchase.update({
      where: {
        id: purchaseId,
      },
      data: {
        paymentStatus: "completed",
      },
    });
  } else if (event.type === "checkout.session.expired") {
    if (purchaseId) {
      // Update purchase status to failed
      await db.purchase.update({
        where: {
          id: purchaseId,
        },
        data: {
          paymentStatus: "failed",
        },
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}
