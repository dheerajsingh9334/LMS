import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// PATCH update discussion or toggle vote/resolve
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; discussionId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, title, content } = await req.json();

    if (action === "upvote" || action === "downvote") {
      const discussion = await db.discussion.findUnique({
        where: { id: params.discussionId },
      });

      if (!discussion) {
        return new NextResponse("Discussion not found", { status: 404 });
      }

      let upvotes = discussion.upvotes;
      let downvotes = discussion.downvotes;

      if (action === "upvote") {
        // Remove from downvotes if exists
        downvotes = downvotes.filter((id) => id !== userId);
        
        // Toggle upvote
        if (upvotes.includes(userId)) {
          upvotes = upvotes.filter((id) => id !== userId);
        } else {
          upvotes.push(userId);
        }
      } else if (action === "downvote") {
        // Remove from upvotes if exists
        upvotes = upvotes.filter((id) => id !== userId);
        
        // Toggle downvote
        if (downvotes.includes(userId)) {
          downvotes = downvotes.filter((id) => id !== userId);
        } else {
          downvotes.push(userId);
        }
      }

      const updatedDiscussion = await db.discussion.update({
        where: { id: params.discussionId },
        data: { upvotes, downvotes },
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return NextResponse.json(updatedDiscussion);
    }

    if (action === "resolve" || action === "unresolve") {
      const discussion = await db.discussion.update({
        where: { id: params.discussionId },
        data: { isResolved: action === "resolve" },
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return NextResponse.json(discussion);
    }

    // Default update for title/content
    const existingDiscussion = await db.discussion.findUnique({
      where: { id: params.discussionId },
    });

    if (!existingDiscussion || existingDiscussion.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedDiscussion = await db.discussion.update({
      where: { id: params.discussionId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedDiscussion);
  } catch (error) {
    console.log("[DISCUSSION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE a discussion
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; discussionId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingDiscussion = await db.discussion.findUnique({
      where: { id: params.discussionId },
    });

    if (!existingDiscussion || existingDiscussion.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.discussion.delete({
      where: { id: params.discussionId },
    });

    return new NextResponse("Discussion deleted", { status: 200 });
  } catch (error) {
    console.log("[DISCUSSION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
