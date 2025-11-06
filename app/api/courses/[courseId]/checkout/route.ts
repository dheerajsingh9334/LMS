import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check if course is free
    if (course.isFree || !course.price) {
      console.log("[COURSE_CHECKOUT] Processing free course:", { 
        courseId: params.courseId, 
        isFree: course.isFree, 
        price: course.price 
      });
      
      // Directly create purchase for free courses
      const purchase = await db.purchase.create({
        data: {
          userId: user.id,
          courseId: params.courseId,
          amount: 0,
          paymentStatus: "completed",
        },
      });

      return NextResponse.json({ url: `/courses/${params.courseId}/chapters` });
    }

    // Check if already purchased
    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (existingPurchase && existingPurchase.paymentStatus === "completed") {
      return new NextResponse("Already purchased", { status: 400 });
    }

    // Create Stripe checkout session
    const line_items: any[] = [
      {
        quantity: 1,
        price_data: {
          currency: "INR",
          product_data: {
            name: course.title,
            description: course.description || undefined,
          },
          unit_amount: Math.round(course.price * 100), // Convert to cents
        },
      },
    ];

    // Handle existing pending purchases
    if (existingPurchase && existingPurchase.paymentStatus === "pending") {
      // Check if it has a valid Stripe session
      if (existingPurchase.stripeSessionId) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(existingPurchase.stripeSessionId);
          
          // If session is still valid and not expired, return it
          if (existingSession.status !== 'expired') {
            return NextResponse.json({ url: existingSession.url });
          }
        } catch (error) {
          console.log("[CHECKOUT] Could not retrieve existing session:", error);
        }
      }
      
      // Delete the old pending purchase (expired or invalid)
      await db.purchase.delete({
        where: {
          id: existingPurchase.id,
        },
      });
    }

    // Create new pending purchase
    const pendingPurchase = await db.purchase.create({
      data: {
        userId: user.id,
        courseId: params.courseId,
        amount: course.price,
        paymentStatus: "pending",
      },
    });

    // Create new Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}/chapters?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}/overview?canceled=1`,
      metadata: {
        courseId: course.id,
        userId: user.id,
        purchaseId: pendingPurchase.id,
      },
    });

    // Update purchase with session ID
    await db.purchase.update({
      where: {
        id: pendingPurchase.id,
      },
      data: {
        stripeSessionId: session.id,
      },
    });

    // Check if session URL exists
    if (!session.url) {
      console.error("[COURSE_CHECKOUT] Stripe session created but no URL returned:", session);
      return new NextResponse("Stripe session created but no redirect URL available", { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.log("[COURSE_CHECKOUT]", error);
    console.error("[COURSE_CHECKOUT] Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
