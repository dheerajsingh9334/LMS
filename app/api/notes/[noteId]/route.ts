import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const note = await db.note.findUnique({
      where: {
        id: params.noteId,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    // Increment download count
    const updatedNote = await db.note.update({
      where: {
        id: params.noteId,
      },
      data: {
        downloads: note.downloads + 1,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.log("[NOTE_DOWNLOAD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const note = await db.note.findUnique({
      where: {
        id: params.noteId,
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    await db.note.delete({
      where: {
        id: params.noteId,
      },
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.log("[NOTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
