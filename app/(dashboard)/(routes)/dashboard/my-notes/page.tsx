"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search, FileDown, Loader2, BookOpen, Clock, Play, Trash2, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";

interface Note {
  id: string;
  content: string;
  timestamp?: number;
  createdAt: Date;
  course: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
}

const MyNotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();

  // Get unique courses from notes
  const courses = Array.from(
    new Map(notes.map((note) => [note.course.id, note.course])).values()
  );

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCourse !== "all") params.append("courseId", selectedCourse);

      const response = await axios.get(`/api/my-notes?${params.toString()}`);
      setNotes(response.data);
      setFilteredNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCourse]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDeleteNote = async (noteId: string, courseId: string) => {
    try {
      await axios.delete(`/api/courses/${courseId}/student-notes/${noteId}`);
      toast.success("Note deleted");
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
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
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("My Course Notes", margin, yPosition);
      yPosition += 12;

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Total Notes: ${filteredNotes.length}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Exported: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 15;

      // Group notes by course
      const notesByCourse = filteredNotes.reduce((acc, note) => {
        const courseTitle = note.course.title;
        if (!acc[courseTitle]) {
          acc[courseTitle] = [];
        }
        acc[courseTitle].push(note);
        return acc;
      }, {} as Record<string, Note[]>);

      // Render notes by course
      Object.entries(notesByCourse).forEach(([courseTitle, courseNotes]) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        // Course title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(courseTitle, margin, yPosition);
        yPosition += 10;

        // Course notes
        courseNotes.forEach((note, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
          }

          // Note header
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          let headerText = `Note ${index + 1}`;
          if (note.chapter) {
            headerText += ` - ${note.chapter.title}`;
          }
          pdf.text(headerText, margin, yPosition);
          yPosition += lineHeight;

          // Timestamp and date
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9);
          let metaText = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
          if (note.timestamp !== undefined) {
            metaText += ` • Timestamp: ${formatTime(note.timestamp)}`;
          }
          pdf.text(metaText, margin, yPosition);
          yPosition += lineHeight;

          // Content
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          const lines = pdf.splitTextToSize(note.content, pageWidth - 2 * margin);
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - 25) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += lineHeight;
          });

          yPosition += 5; // Space between notes
        });

        yPosition += 10; // Space between courses
      });

      const filename = selectedCourse !== "all" 
        ? `notes-${courses.find(c => c.id === selectedCourse)?.title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`
        : `all-notes-${Date.now()}.pdf`;
      
      pdf.save(filename);
      toast.success("Notes exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export notes");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNavigateToChapter = (courseId: string, chapterId?: string) => {
    if (chapterId) {
      router.push(`/courses/${courseId}/chapters/${chapterId}`);
    } else {
      router.push(`/courses/${courseId}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-muted-foreground">
            All your notes from courses in one place
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            disabled={filteredNotes.length === 0 || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>

        {!isLoading && filteredNotes.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>
              {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
              {selectedCourse !== "all" && " in this course"}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "No notes found matching your search"
                : "No notes yet. Start taking notes while watching courses!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-normal">
                        {note.course.title}
                      </Badge>
                      {note.chapter && (
                        <Badge variant="secondary" className="font-normal text-xs">
                          {note.chapter.title}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(note.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {note.timestamp !== undefined && (
                        <>
                          <span>•</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() =>
                              handleNavigateToChapter(note.course.id, note.chapter?.id)
                            }
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {formatTime(note.timestamp)}
                          </Button>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this note? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteNote(note.id, note.course.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                {note.chapter && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs"
                    onClick={() =>
                      handleNavigateToChapter(note.course.id, note.chapter?.id)
                    }
                  >
                    Go to chapter →
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNotesPage;
