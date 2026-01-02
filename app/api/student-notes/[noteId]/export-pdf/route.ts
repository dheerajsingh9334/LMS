import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export async function POST(
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
      include: {
        course: {
          select: {
            title: true,
          },
        },
        chapter: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!note) {
      return new NextResponse("Note not found", { status: 404 });
    }

    // Create PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize = 12, isBold = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      
      // Check if we need a new page
      if (yPosition + (lines.length * fontSize * 0.35) > pdf.internal.pageSize.height - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.35 + 5;
      
      return yPosition;
    };

    // Add header
    addText(`${note.course.title}`, 16, true);
    if (note.chapter) {
      addText(`Chapter: ${note.chapter.title}`, 12, true);
    }
    
    // Add note metadata
    addText(`Context: ${note.context.replace('_', ' ')}`, 10);
    addText(`Created: ${format(new Date(note.createdAt), 'PPP')}`, 10);
    if (note.timestamp) {
      const minutes = Math.floor(note.timestamp / 60);
      const seconds = Math.floor(note.timestamp % 60);
      addText(`Video Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10);
    }
    
    if (note.tags.length > 0) {
      addText(`Tags: ${note.tags.join(', ')}`, 10);
    }
    
    // Add separator
    yPosition += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Add note title
    addText(note.title, 14, true);
    
    // Add note content
    // Strip HTML tags from rich content and convert to plain text
    const plainContent = note.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    
    if (plainContent) {
      addText(plainContent, 11);
    }

    // Add footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${totalPages} | Generated on ${format(new Date(), 'PPP')}`,
        margin,
        pdf.internal.pageSize.height - 10
      );
    }

    // Update note record to track PDF generation
    await db.studentNote.update({
      where: {
        id: params.noteId,
      },
      data: {
        pdfGenerated: true,
        exportCount: {
          increment: 1,
        },
      },
    });

    // Return PDF as Uint8Array
    const pdfOutput = pdf.output('arraybuffer');
    
    return new NextResponse(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[NOTE_EXPORT_PDF]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}