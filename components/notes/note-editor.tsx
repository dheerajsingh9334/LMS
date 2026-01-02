"use client";

import { useState } from "react";
import { X, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NoteEditorProps {
  initialContent?: string;
  initialTimestamp?: number;
  onSave: (content: string, timestamp?: number) => Promise<void>;
  onCancel: () => void;
  currentVideoTime?: number;
}

export const NoteEditor = ({
  initialContent = "",
  initialTimestamp,
  onSave,
  onCancel,
  currentVideoTime,
}: NoteEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [timestamp, setTimestamp] = useState<number | undefined>(
    initialTimestamp ?? currentVideoTime
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(content, timestamp);
      setContent("");
      setTimestamp(currentVideoTime);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {initialContent ? "Edit Note" : "New Note"}
        </Label>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {currentVideoTime !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Timestamp: {timestamp !== undefined ? formatTime(timestamp) : "Not set"}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setTimestamp(currentVideoTime)}
            className="h-auto p-0 text-xs"
          >
            Use current time
          </Button>
        </div>
      )}

      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] resize-none"
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!content.trim() || isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Note
        </Button>
      </div>
    </div>
  );
};
