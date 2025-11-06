import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return new NextResponse("Message is required", { status: 400 });
    }

    const chatMessage = await db.liveChatMessage.create({
      data: {
        liveSessionId: params.sessionId,
        userId: user.id,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.log("[LIVE_CHAT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const messages = await db.liveChatMessage.findMany({
      where: {
        liveSessionId: params.sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 100, // Limit to last 100 messages
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.log("[LIVE_CHAT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
