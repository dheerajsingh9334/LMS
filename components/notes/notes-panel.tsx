"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Plus, Search, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteEditor } from "./note-editor";
import { NoteCard } from "./note-card";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface Note {
  id: string;
  content: string;
  timestamp?: number;
  createdAt: Date;
  chapter?: {
    id: string;
    title: string;
  };
}

interface NotesPanelProps {
  courseId: string;
  chapterId?: string;
  currentVideoTime?: number;
  onSeekTo?: (timestamp: number) => void;
}

export const NotesPanel = ({
  courseId,
  chapterId,
  currentVideoTime,
  onSeekTo,
}: NotesPanelProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (chapterId) params.append("chapterId", chapterId);
      if (searchQuery) params.append("search", searchQuery);

      const response = await axios.get(
        `/api/courses/${courseId}/student-notes?${params.toString()}`
      );
      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, searchQuery]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async (content: string, timestamp?: number) => {
    try {
      if (editingNote) {
        // Update existing note
        await axios.patch(
          `/api/courses/${courseId}/student-notes/${editingNote.id}`,
          { content, timestamp }
        );
        toast.success("Note updated");
      } else {
        // Create new note
        await axios.post(`/api/courses/${courseId}/student-notes`, {
          content,
          timestamp,
          chapterId,
        });
        toast.success("Note created");
      }
      
      setIsEditorOpen(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await axios.delete(`/api/courses/${courseId}/student-notes/${noteId}`);
      toast.success("Note deleted");
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
      throw error;
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const lineHeight = 7;
      let yPosition = margin;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Course Notes", margin, yPosition);
      yPosition += 15;

      // Date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Exported: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // Notes
      pdf.setFontSize(12);
      notes.forEach((note, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        // Note header
        pdf.setFont("helvetica", "bold");
        const headerText = `Note ${index + 1}${note.chapter ? ` - ${note.chapter.title}` : ""}`;
        pdf.text(headerText, margin, yPosition);
        yPosition += lineHeight;

        // Timestamp
        if (note.timestamp !== undefined) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, "0")}`;
          };
          pdf.text(`Timestamp: ${formatTime(note.timestamp)}`, margin, yPosition);
          yPosition += lineHeight;
        }

        // Content
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(note.content, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 5; // Space between notes
      });

      pdf.save(`course-notes-${new Date().getTime()}.pdf`);
      toast.success("Notes exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export notes");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingNote(null);
              setIsEditorOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            disabled={notes.length === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {isEditorOpen && (
        <NoteEditor
          initialContent={editingNote?.content}
          initialTimestamp={editingNote?.timestamp}
          currentVideoTime={currentVideoTime}
          onSave={handleSaveNote}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingNote(null);
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">
              {searchQuery
                ? "No notes found matching your search"
                : "No notes yet. Start taking notes while watching!"}
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              content={note.content}
              timestamp={note.timestamp}
              createdAt={note.createdAt}
              chapterTitle={note.chapter?.title}
              onEdit={() => handleEditNote(note)}
              onDelete={handleDeleteNote}
              onSeekTo={onSeekTo}
            />
          ))
        )}
      </div>
    </div>
  );
};
