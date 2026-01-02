import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// POST create a reply
export async function POST(
  req: Request,
  { params }: { params: { courseId: string; discussionId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";
    const userName = user?.name ?? "Anonymous";
    const userImage = user?.image ?? null;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const reply = await db.discussionReply.create({
      data: {
        discussionId: params.discussionId,
        userId,
        userName,
        userImage,
        content,
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.log("[DISCUSSION_REPLY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
