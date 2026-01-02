"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { FileText, Download, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  questionPdfUrl: z.string().optional(),
  questionPdfName: z.string().optional(),
  chapterId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  maxScore: z.coerce.number().min(1).default(100),
  allowLateSubmission: z.boolean().default(true),
  latePenalty: z.coerce.number().min(0).max(100).default(10),
  allowFileUpload: z.boolean().default(true),
  allowLinkSubmission: z.boolean().default(true),
  allowTextSubmission: z.boolean().default(true),
  maxFileSize: z.coerce.number().min(1).default(10),
  enablePlagiarismCheck: z.boolean().default(false),
  plagiarismThreshold: z.coerce.number().min(0).max(100).default(20),
  isPublished: z.boolean().default(false),
});

interface CreateAssignmentFormProps {
  courseId: string;
  chapters: Array<{ id: string; title: string }>;
  initialData?: any;
  isEditing?: boolean;
  preSelectedChapterId?: string;
}

export function CreateAssignmentForm({
  courseId,
  chapters,
  initialData,
  isEditing = false,
  preSelectedChapterId,
}: CreateAssignmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      questionPdfUrl: initialData.questionPdfUrl || "",
      questionPdfName: initialData.questionPdfName || "",
      chapterId: initialData.chapterId || preSelectedChapterId || "no-chapter",
      dueDate: initialData.dueDate 
        ? new Date(initialData.dueDate).toISOString().slice(0, 16)
        : "",
      maxScore: initialData.maxScore || 100,
      allowLateSubmission: initialData.allowLateSubmission ?? true,
      latePenalty: initialData.latePenalty || 10,
      allowFileUpload: initialData.allowFileUpload ?? true,
      allowLinkSubmission: initialData.allowLinkSubmission ?? true,
      allowTextSubmission: initialData.allowTextSubmission ?? true,
      maxFileSize: initialData.maxFileSize || 10,
      enablePlagiarismCheck: initialData.enablePlagiarismCheck ?? false,
      plagiarismThreshold: initialData.plagiarismThreshold || 20,
      isPublished: initialData.isPublished ?? false,
    } : {
      title: "",
      description: "",
      questionPdfUrl: "",
      questionPdfName: "",
      chapterId: preSelectedChapterId || "no-chapter",
      dueDate: "",
      maxScore: 100,
      allowLateSubmission: true,
      latePenalty: 10,
      allowFileUpload: true,
      allowLinkSubmission: true,
      allowTextSubmission: true,
      maxFileSize: 10,
      enablePlagiarismCheck: false,
      plagiarismThreshold: 20,
      isPublished: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Convert "no-chapter" to undefined for the API
      const submissionData = {
        ...values,
        chapterId: values.chapterId === "no-chapter" ? undefined : values.chapterId,
        dueDate: new Date(values.dueDate),
        allowedFileTypes: ["pdf", "doc", "docx", "txt", "zip"],
      };
      
      if (isEditing && initialData) {
        // Update existing assignment
        await axios.patch(
          `/api/courses/${courseId}/assignments/${initialData.id}`,
          submissionData
        );
        toast.success("Assignment updated successfully!");
        router.push(`/teacher/courses/${courseId}/assignments/${initialData.id}`);
      } else {
        // Create new assignment
        const response = await axios.post(
          `/api/courses/${courseId}/assignments`,
          submissionData
        );
        toast.success("Assignment created successfully!");
        router.push(`/teacher/courses/${courseId}/assignments/${response.data.id}`);
      }
      
      router.refresh();
    } catch (error) {
      toast.error(isEditing ? "Failed to update assignment" : "Failed to create assignment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. 'Chapter 5 Programming Exercise'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="Describe the assignment requirements..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question PDF Upload */}
            <FormField
              control={form.control}
              name="questionPdfUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Questions (PDF)</FormLabel>
                  <FormDescription>
                    Upload a PDF file with assignment questions. Students will be able to download this.
                  </FormDescription>
                  {!field.value ? (
                    <FormControl>
                      <FileUpload
                        endpoint="assignmentQuestion"
                        onChange={(url) => {
                          if (url) {
                            field.onChange(url);
                            // Extract filename from URL
                            const fileName = url.split('/').pop() || 'assignment.pdf';
                            form.setValue('questionPdfName', fileName);
                          }
                        }}
                      />
                    </FormControl>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <FileText className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {form.getValues('questionPdfName') || 'Assignment Questions'}
                        </p>
                        <a 
                          href={field.value} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Preview PDF
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          field.onChange("");
                          form.setValue('questionPdfName', "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chapterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter (Optional)</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-chapter">No specific chapter</SelectItem>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Deadline & Scoring */}
        <Card>
          <CardHeader>
            <CardTitle>Deadline & Scoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Score</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      placeholder="100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowLateSubmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Late Submissions</FormLabel>
                    <FormDescription>
                      Students can submit after the deadline
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("allowLateSubmission") && (
              <FormField
                control={form.control}
                name="latePenalty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late Penalty (% per day)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting}
                        placeholder="10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage deducted from score for each day late
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Submission Types */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="allowFileUpload"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow File Upload</FormLabel>
                    <FormDescription>
                      Students can upload PDF, DOC, TXT, ZIP files
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("allowFileUpload") && (
              <FormField
                control={form.control}
                name="maxFileSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max File Size (MB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting}
                        placeholder="10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="allowLinkSubmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Link Submission</FormLabel>
                    <FormDescription>
                      Students can submit URLs (GitHub, Google Drive, etc.)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowTextSubmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Text Submission</FormLabel>
                    <FormDescription>
                      Students can type their answers directly
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Plagiarism Check */}
        <Card>
          <CardHeader>
            <CardTitle>Plagiarism Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enablePlagiarismCheck"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Plagiarism Check</FormLabel>
                    <FormDescription>
                      Automatically check text submissions for similarity
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("enablePlagiarismCheck") && (
              <FormField
                control={form.control}
                name="plagiarismThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Similarity Threshold (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isSubmitting}
                        placeholder="20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Flag submissions with similarity above this percentage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Publish Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Publication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Published</FormLabel>
                    <FormDescription>
                      Make this assignment visible to students. Only published assignments appear in the course.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Assignment" : "Create Assignment")
            }
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
