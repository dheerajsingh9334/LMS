"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Link, FileText, AlertTriangle } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import toast from "react-hot-toast";
import axios from "axios";

interface AssignmentSubmissionFormProps {
  assignment: {
    id: string;
    title: string;
    dueDate: Date;
    allowFileUpload: boolean;
    allowLinkSubmission: boolean;
    allowTextSubmission: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    allowLateSubmission: boolean;
  };
  courseId: string;
  chapterId: string;
}

export const AssignmentSubmissionForm = ({
  assignment,
  courseId,
  chapterId,
}: AssignmentSubmissionFormProps) => {
  const router = useRouter();
  const [submissionType, setSubmissionType] = useState<"file" | "link" | "text">("file");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = new Date() > dueDate;
  const canSubmit = assignment.allowLateSubmission || !isOverdue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      toast.error("Assignment is overdue and late submissions are not allowed");
      return;
    }

    let submissionData: any = {
      assignmentId: assignment.id,
      submissionType,
    };

    // Validate based on submission type
    if (submissionType === "file") {
      if (!fileUrl) {
        toast.error("Please upload a file");
        return;
      }
      submissionData.fileUrl = fileUrl;
      submissionData.fileName = fileName;
    } else if (submissionType === "link") {
      if (!linkUrl) {
        toast.error("Please enter a link");
        return;
      }
      // Basic URL validation
      try {
        new URL(linkUrl);
      } catch {
        toast.error("Please enter a valid URL");
        return;
      }
      submissionData.linkUrl = linkUrl;
    } else if (submissionType === "text") {
      if (!textContent.trim()) {
        toast.error("Please enter your text submission");
        return;
      }
      submissionData.textContent = textContent.trim();
    }

    try {
      setIsSubmitting(true);
      
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/submit`,
        submissionData
      );
      
      toast.success("Assignment submitted successfully!");
      router.refresh();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canSubmit && !assignment.allowLateSubmission) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-semibold text-red-800">Assignment Overdue</span>
        </div>
        <p className="text-red-700">
          This assignment was due on {dueDate.toLocaleDateString()} and late submissions are not allowed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOverdue && assignment.allowLateSubmission && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">Late Submission</span>
          </div>
          <p className="text-yellow-700">
            This assignment is overdue. Late submissions may be penalized.
          </p>
        </div>
      )}

      {/* Submission Type Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Choose Submission Type</h3>
        <div className="flex flex-wrap gap-3">
          {assignment.allowFileUpload && (
            <Button
              type="button"
              variant={submissionType === "file" ? "default" : "outline"}
              onClick={() => setSubmissionType("file")}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              File Upload
            </Button>
          )}
          
          {assignment.allowLinkSubmission && (
            <Button
              type="button"
              variant={submissionType === "link" ? "default" : "outline"}
              onClick={() => setSubmissionType("link")}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Link/URL
            </Button>
          )}
          
          {assignment.allowTextSubmission && (
            <Button
              type="button"
              variant={submissionType === "text" ? "default" : "outline"}
              onClick={() => setSubmissionType("text")}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Text Submission
            </Button>
          )}
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {submissionType === "file" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="text-sm text-gray-600 mb-3">
                <p>Allowed file types: {assignment.allowedFileTypes.join(", ")}</p>
                <p>Maximum file size: {assignment.maxFileSize} MB</p>
              </div>
              <FileUpload
                endpoint="assignmentSubmission"
                maxSizeMB={assignment.maxFileSize}
                allowedTypes={assignment.allowedFileTypes}
                onChange={(url) => {
                  if (url) {
                    setFileUrl(url);
                    // Extract filename from URL
                    const fileName = url.split('/').pop() || "uploaded_file";
                    setFileName(fileName);
                  }
                }}
              />
              {fileUrl && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✓ File uploaded: {fileName}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {submissionType === "link" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Submission Link/URL
              </label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/your-submission"
                className="w-full"
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter a link to your Google Drive file, GitHub repository, or other online resource.
              </p>
            </div>
          </div>
        )}

        {submissionType === "text" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-2">
                Text Submission
              </label>
              <Textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your assignment submission here..."
                className="w-full min-h-[200px]"
              />
              <p className="text-sm text-gray-600 mt-1">
                Write your assignment submission directly in this text area.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="px-8"
          >
            {isSubmitting ? "Submitting..." : "Submit Assignment"}
          </Button>
        </div>
      </form>
    </div>
  );
};