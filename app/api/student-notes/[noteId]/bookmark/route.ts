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

    const { isBookmarked } = await request.json();

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
        isBookmarked,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("[NOTE_BOOKMARK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}