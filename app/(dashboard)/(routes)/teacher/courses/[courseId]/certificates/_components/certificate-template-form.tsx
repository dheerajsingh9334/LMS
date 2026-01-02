"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Upload, Eye, Download } from "lucide-react";
import Image from "next/image";

interface CertificateTemplateFormProps {
  courseId: string;
  initialData: any | null;
}

export const CertificateTemplateForm = ({
  courseId,
  initialData,
}: CertificateTemplateFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [templateUrl, setTemplateUrl] = useState(
    initialData?.templateUrl || ""
  );
  const [autoIssue, setAutoIssue] = useState(initialData?.autoIssue ?? true);
  const [autoDownload, setAutoDownload] = useState(
    initialData?.autoDownload ?? false
  );
  const isPdfTemplate = templateUrl.toLowerCase().endsWith(".pdf");

  // Position and styling
  const [namePositionX, setNamePositionX] = useState(
    initialData?.namePositionX || 400
  );
  const [namePositionY, setNamePositionY] = useState(
    initialData?.namePositionY || 300
  );
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 24);
  const [fontColor, setFontColor] = useState(
    initialData?.fontColor || "#000000"
  );

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      const data = {
        templateUrl,
        autoIssue,
        autoDownload,
        namePositionX,
        namePositionY,
        fontSize,
        fontColor,
        // Optional extras to align with API schema
        fontFamily: "Arial",
        minPercentage: 70,
        datePositionX: undefined,
        datePositionY: undefined,
        coursePositionX: undefined,
        coursePositionY: undefined,
        templateType: "image",
      };

      if (initialData) {
        await axios.patch(
          `/api/courses/${courseId}/certificate/template`,
          data
        );
        toast.success("Certificate template updated");
      } else {
        await axios.post(`/api/courses/${courseId}/certificate/template`, data);
        toast.success("Certificate template created");
      }

      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Upload */}
      <div className="space-y-4">
        <div>
          <Label>Certificate Template *</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Upload a certificate template image (PNG, JPG) or PDF. Recommended
            size: 1920x1080px
          </p>
          {templateUrl && (
            <div className="mb-2">
              <p className="text-sm">Current template: {templateUrl}</p>
            </div>
          )}
          <FileUpload
            endpoint="certificateTemplate"
            onChange={(url) => {
              if (url) {
                setTemplateUrl(url);
              }
            }}
          />
        </div>

        {templateUrl && (
          <div className="relative border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <Label>Template Preview</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(templateUrl, "_blank")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = templateUrl;
                    link.download = "certificate-template";
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            {isPdfTemplate ? (
              <div className="w-full aspect-video rounded border bg-white">
                <object
                  data={templateUrl}
                  type="application/pdf"
                  className="w-full h-full rounded"
                >
                  <p className="text-sm text-muted-foreground p-4">
                    PDF preview not available. Use View Full Size to open the
                    file.
                  </p>
                </object>
              </div>
            ) : (
              <div className="relative w-full aspect-video">
                <Image
                  src={templateUrl}
                  alt="Certificate Template"
                  fill
                  className="object-contain rounded"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Text Positioning */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Dynamic Text Positioning</h3>
          <p className="text-sm text-muted-foreground">
            Configure where student name and other details will appear on the
            certificate
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nameX">Name Position X</Label>
            <Input
              id="nameX"
              type="number"
              value={namePositionX}
              onChange={(e) => setNamePositionX(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="nameY">Name Position Y</Label>
            <Input
              id="nameY"
              type="number"
              value={namePositionY}
              onChange={(e) => setNamePositionY(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="fontColor">Font Color</Label>
            <div className="flex gap-2">
              <Input
                id="fontColor"
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                disabled={isLoading}
                className="w-20"
              />
              <Input
                type="text"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Auto-issue Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Certificate Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure how certificates are issued and delivered
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-issue Certificates</Label>
            <p className="text-sm text-muted-foreground">
              Automatically issue certificates when students meet requirements
            </p>
          </div>
          <Switch
            checked={autoIssue}
            onCheckedChange={setAutoIssue}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-download on Completion</Label>
            <p className="text-sm text-muted-foreground">
              Automatically download certificate when student completes the
              course
            </p>
          </div>
          <Switch
            checked={autoDownload}
            onCheckedChange={setAutoDownload}
            disabled={isLoading}
          />
        </div>
      </div>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading || !templateUrl}>
          <Upload className="h-4 w-4 mr-2" />
          {initialData ? "Update" : "Create"} Template
        </Button>
      </div>
    </div>
  );
};
