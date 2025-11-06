"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { Upload, X, Pencil } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface NotesUploadFormProps {
  courseId: string;
  chapterId?: string;
  onSuccess?: () => void;
}

export const NotesUploadForm = ({
  courseId,
  chapterId,
  onSuccess,
}: NotesUploadFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!title || !fileUrl || !fileName) {
        toast.error("Please fill all required fields");
        return;
      }

      await axios.post("/api/notes", {
        title,
        description,
        fileUrl,
        fileName,
        courseId,
        chapterId,
      });

      toast.success("Note uploaded successfully");
      setTitle("");
      setDescription("");
      setFileUrl("");
      setFileName("");
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to upload note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium">Upload Notes</CardTitle>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Upload New
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isEditing && (
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 'Chapter 1 Notes'"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the notes..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label>Upload File *</Label>
            <FileUpload
              endpoint="noteFile"
              onChange={(url) => {
                if (url) {
                  setFileUrl(url);
                  const name = url.split("/").pop() || "document.pdf";
                  setFileName(name);
                }
              }}
            />
            {fileName && (
              <p className="text-sm text-gray-500 mt-2">
                Selected: {fileName}
              </p>
            )}
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !title || !fileUrl}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isSubmitting ? "Uploading..." : "Upload Note"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};
