import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// PATCH update a note
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; noteId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, timestamp } = await req.json();

    // Verify note ownership
    const existingNote = await db.studentNote.findUnique({
      where: {
        id: params.noteId,
      },
    });

    if (!existingNote || existingNote.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const note = await db.studentNote.update({
      where: {
        id: params.noteId,
      },
      data: {
        content,
        timestamp,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.log("[STUDENT_NOTE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE a note
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; noteId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify note ownership
    const existingNote = await db.studentNote.findUnique({
      where: {
        id: params.noteId,
      },
    });

    if (!existingNote || existingNote.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.studentNote.delete({
      where: {
        id: params.noteId,
      },
    });

    return new NextResponse("Note deleted", { status: 200 });
  } catch (error) {
    console.log("[STUDENT_NOTE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
