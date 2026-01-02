import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const note = await db.studentNote.findFirst({
      where: {
        id: params.noteId,
        userId: user.id,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      title,
      content,
      richContent,
      color,
      tags,
      isBookmarked,
      status
    } = await request.json();

    const note = await db.studentNote.findFirst({
      where: {
        id: params.noteId,
        userId: user.id,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    const updatedNote = await db.studentNote.update({
      where: {
        id: params.noteId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(richContent !== undefined && { richContent }),
        ...(color !== undefined && { color }),
        ...(tags !== undefined && { tags }),
        ...(isBookmarked !== undefined && { isBookmarked }),
        ...(status !== undefined && { 
          status,
          isDraft: status === "DRAFT"
        }),
        lastSaved: new Date(),
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("[NOTE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const note = await db.studentNote.findFirst({
      where: {
        id: params.noteId,
        userId: user.id,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    await db.studentNote.delete({
      where: {
        id: params.noteId,
      },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("[NOTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}