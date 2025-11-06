import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content, richContent } = await request.json();

    const note = await db.studentNote.findFirst({
      where: {
        id: params.noteId,
        userId: user.id,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    // Auto-save as draft
    const updatedNote = await db.studentNote.update({
      where: {
        id: params.noteId,
      },
      data: {
        title: title || note.title,
        content: content || note.content,
        richContent: richContent || note.richContent,
        status: "DRAFT",
        isDraft: true,
        lastSaved: new Date(),
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("[NOTE_DRAFT_SAVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}