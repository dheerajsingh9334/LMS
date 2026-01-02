"use client";

import * as z from "zod";
import axios from "axios";
import { Pencil, PlusCircle, ImageIcon, File, Loader2, X, Upload, Link as LinkIcon, FileSpreadsheet, Archive } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Attachment, Course } from "@prisma/client";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttachmentFormProps {
  initialData: Course & { attachments: Attachment[] };
  courseId: string;
};

const formSchema = z.object({
  url: z.string().min(1),
  name: z.string().optional(),
  type: z.enum(["file", "link"]).optional(),
  fileType: z.string().optional(),
});

export const AttachmentForm = ({
  initialData,
  courseId
}: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [uploadType, setUploadType] = useState<"file" | "link">("file");

  const toggleEdit = () => {
    setIsEditing((current) => !current);
    setLinkUrl("");
    setLinkName("");
  };

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/attachments`, values);
      toast.success("Attachment added");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkUrl) {
      toast.error("Please enter a URL");
      return;
    }
    await onSubmit({
      url: linkUrl,
      name: linkName || linkUrl,
      type: "link",
    });
  };

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`/api/courses/${courseId}/attachments/${id}`);
      toast.success("Attachment deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course attachments
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && (
            <>Cancel</>
          )}
          {!isEditing && (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add a file
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <>
          {initialData.attachments.length === 0 && (
            <p className="text-sm mt-2 text-slate-500 italic">
              No attachments yet
            </p>
          )}
          {initialData.attachments.length > 0 && (
            <div className="space-y-2">
              {initialData.attachments.map((attachment) => {
                // Determine icon based on file type
                let IconComponent = File;
                let bgColor = "bg-sky-100";
                let borderColor = "border-sky-200";
                let textColor = "text-sky-700";
                
                if (attachment.type === "link") {
                  IconComponent = LinkIcon;
                  bgColor = "bg-purple-100";
                  borderColor = "border-purple-200";
                  textColor = "text-purple-700";
                } else if (attachment.fileType === "excel") {
                  IconComponent = FileSpreadsheet;
                  bgColor = "bg-green-100";
                  borderColor = "border-green-200";
                  textColor = "text-green-700";
                } else if (attachment.fileType === "zip") {
                  IconComponent = Archive;
                  bgColor = "bg-orange-100";
                  borderColor = "border-orange-200";
                  textColor = "text-orange-700";
                }
                
                return (
                  <div
                    key={attachment.id}
                    className={`flex items-center p-3 w-full ${bgColor} ${borderColor} border ${textColor} rounded-md`}
                  >
                    <IconComponent className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p className="text-xs line-clamp-1 flex-1">
                      {attachment.name}
                    </p>
                    {attachment.type === "link" && (
                      <span className="text-[10px] px-2 py-0.5 bg-purple-200 rounded mr-2">LINK</span>
                    )}
                    {deletingId === attachment.id && (
                      <div>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    {deletingId !== attachment.id && (
                      <button
                        onClick={() => onDelete(attachment.id)}
                        className="ml-2 hover:opacity-75 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {isEditing && (
        <div className="mt-4">
          <Tabs defaultValue={uploadType} onValueChange={(value) => setUploadType(value as "file" | "link")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Add Link
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <FileUpload
                endpoint="courseAttachment"
                onChange={(url) => {
                  if (url) {
                    // Detect file type from URL
                    let fileType = "other";
                    if (url.includes(".pdf")) fileType = "pdf";
                    else if (url.includes(".xls") || url.includes(".xlsx")) fileType = "excel";
                    else if (url.includes(".zip")) fileType = "zip";
                    
                    onSubmit({ 
                      url: url,
                      type: "file",
                      fileType: fileType,
                    });
                  }
                }}
              />
              <div className="text-xs text-muted-foreground">
                Upload PDFs, Excel files, or ZIP archives (up to 500MB each). You can upload multiple files.
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex gap-4 text-xs text-blue-700">
                  <div className="flex items-center gap-1">
                    <File className="h-3 w-3" />
                    <span>PDF</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>Excel</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    <span>ZIP</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="link" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Link Name (Optional)</label>
                  <Input
                    placeholder="e.g., Course Resources"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL *</label>
                  <Input
                    placeholder="https://example.com/resource"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleLinkSubmit}
                  disabled={!linkUrl}
                  className="w-full"
                >
                  Add Link
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Add external links to Google Drive, Dropbox, GitHub repos, or any other resource.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}