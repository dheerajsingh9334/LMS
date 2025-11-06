import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// PATCH update reply, toggle vote, or mark as best answer
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; discussionId: string; replyId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, content } = await req.json();

    if (action === "upvote" || action === "downvote") {
      const reply = await db.discussionReply.findUnique({
        where: { id: params.replyId },
      });

      if (!reply) {
        return new NextResponse("Reply not found", { status: 404 });
      }

      let upvotes = reply.upvotes;
      let downvotes = reply.downvotes;

      if (action === "upvote") {
        downvotes = downvotes.filter((id) => id !== userId);
        
        if (upvotes.includes(userId)) {
          upvotes = upvotes.filter((id) => id !== userId);
        } else {
          upvotes.push(userId);
        }
      } else if (action === "downvote") {
        upvotes = upvotes.filter((id) => id !== userId);
        
        if (downvotes.includes(userId)) {
          downvotes = downvotes.filter((id) => id !== userId);
        } else {
          downvotes.push(userId);
        }
      }

      const updatedReply = await db.discussionReply.update({
        where: { id: params.replyId },
        data: { upvotes, downvotes },
      });

      return NextResponse.json(updatedReply);
    }

    if (action === "mark-best") {
      // Verify user owns the discussion
      const discussion = await db.discussion.findUnique({
        where: { id: params.discussionId },
      });

      if (!discussion || discussion.userId !== userId) {
        return new NextResponse("Only discussion owner can mark best answer", { status: 401 });
      }

      // Remove best answer from all replies in this discussion
      await db.discussionReply.updateMany({
        where: { discussionId: params.discussionId },
        data: { isBestAnswer: false },
      });

      // Mark this reply as best answer
      const updatedReply = await db.discussionReply.update({
        where: { id: params.replyId },
        data: { isBestAnswer: true },
      });

      // Update discussion to mark as resolved
      await db.discussion.update({
        where: { id: params.discussionId },
        data: { 
          isResolved: true,
          bestAnswerId: params.replyId,
        },
      });

      return NextResponse.json(updatedReply);
    }

    // Default update for content
    const existingReply = await db.discussionReply.findUnique({
      where: { id: params.replyId },
    });

    if (!existingReply || existingReply.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedReply = await db.discussionReply.update({
      where: { id: params.replyId },
      data: { content },
    });

    return NextResponse.json(updatedReply);
  } catch (error) {
    console.log("[DISCUSSION_REPLY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE a reply
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; discussionId: string; replyId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingReply = await db.discussionReply.findUnique({
      where: { id: params.replyId },
    });

    if (!existingReply || existingReply.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.discussionReply.delete({
      where: { id: params.replyId },
    });

    return new NextResponse("Reply deleted", { status: 200 });
  } catch (error) {
    console.log("[DISCUSSION_REPLY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
