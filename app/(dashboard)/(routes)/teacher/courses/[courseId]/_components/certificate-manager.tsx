"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Plus,
  Upload,
  Settings,
  Eye,
  Download,
  RefreshCw,
  Edit3,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface CertificateTemplate {
  id: string;
  templateUrl: string;
  templateType: string;
  minPercentage: number;
  namePositionX?: number | null;
  namePositionY?: number | null;
  datePositionX?: number | null;
  datePositionY?: number | null;
  coursePositionX?: number | null;
  coursePositionY?: number | null;
  fontSize?: number | null;
  fontColor?: string | null;
  fontFamily?: string | null;
  // Text fields
  certificateTitle?: string | null;
  signatureName?: string | null;
  signatureTitle?: string | null;
  organizationName?: string | null;
  additionalText?: string | null;
}

interface CertificateManagerProps {
  courseId: string;
  certificateTemplate: CertificateTemplate | null;
}

// All editable certificate fields
interface CertificateFields {
  // Text content (editable)
  certificateTitle: string;
  courseTitle: string;
  teacherName: string;
  signatureName: string;
  signatureTitle: string;
  organizationName: string;
  additionalText: string;

  // Template settings
  templateType: string;
  minPercentage: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;

  // Requirements
  requireAllChapters: boolean;
  requireAllQuizzes: boolean;
  requireAllAssignments: boolean;

  // Position (for image-based templates)
  namePositionX: number;
  namePositionY: number;
  datePositionX: number;
  datePositionY: number;
  coursePositionX: number;
  coursePositionY: number;
}

export const CertificateManager = ({
  courseId,
  certificateTemplate,
}: CertificateManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAutoFetching, setIsAutoFetching] = useState(true);
  const [autoFetchError, setAutoFetchError] = useState<string | null>(null);

  // Auto-fetched data from API
  const [autoData, setAutoData] = useState<{
    courseTitle: string;
    teacherName: string;
    chapterCount: number;
    quizCount: number;
    assignmentCount: number;
    requirementsText: string;
    completionDateText: string;
  } | null>(null);

  // All certificate fields (editable by teacher)
  const [fields, setFields] = useState<CertificateFields>({
    certificateTitle: "Certificate of Completion",
    courseTitle: "",
    teacherName: "",
    signatureName: "",
    signatureTitle: "Course Instructor",
    organizationName: "",
    additionalText: "",
    templateType: "image",
    minPercentage: 70,
    fontSize: 24,
    fontColor: "#000000",
    fontFamily: "Arial",
    requireAllChapters: true,
    requireAllQuizzes: true,
    requireAllAssignments: true,
    namePositionX: 400,
    namePositionY: 300,
    datePositionX: 400,
    datePositionY: 350,
    coursePositionX: 400,
    coursePositionY: 250,
  });

  // Auto-fetch certificate fields on mount
  const fetchAutoFields = useCallback(async () => {
    try {
      setIsAutoFetching(true);
      setAutoFetchError(null);

      const res = await axios.get(
        `/api/courses/${courseId}/certificate/fields`
      );
      const data = res.data;

      setAutoData({
        courseTitle: data.courseTitle,
        teacherName: data.teacherName,
        chapterCount: data.chapterCount,
        quizCount: data.quizCount,
        assignmentCount: data.assignmentCount,
        requirementsText: data.requirementsText,
        completionDateText: data.completionDateText,
      });

      // Load ALL fields from API (includes saved template data)
      setFields((prev) => ({
        ...prev,
        // Text content
        certificateTitle: data.certificateTitle || prev.certificateTitle,
        courseTitle: data.courseTitle || prev.courseTitle,
        teacherName: data.teacherName || prev.teacherName,
        signatureName:
          data.signatureName || data.teacherName || prev.signatureName,
        signatureTitle: data.signatureTitle || prev.signatureTitle,
        organizationName: data.organizationName || prev.organizationName,
        additionalText: data.additionalText || prev.additionalText,
        // Styling
        fontSize: data.fontSize || prev.fontSize,
        fontColor: data.fontColor || prev.fontColor,
        fontFamily: data.fontFamily || prev.fontFamily,
        // Requirements
        minPercentage: data.minPercentage ?? prev.minPercentage,
        requireAllChapters: data.requireAllChapters ?? prev.requireAllChapters,
        requireAllQuizzes: data.requireAllQuizzes ?? prev.requireAllQuizzes,
        requireAllAssignments:
          data.requireAllAssignments ?? prev.requireAllAssignments,
        // Positions
        namePositionX: data.namePositionX || prev.namePositionX,
        namePositionY: data.namePositionY || prev.namePositionY,
        datePositionX: data.datePositionX || prev.datePositionX,
        datePositionY: data.datePositionY || prev.datePositionY,
        coursePositionX: data.coursePositionX || prev.coursePositionX,
        coursePositionY: data.coursePositionY || prev.coursePositionY,
      }));
    } catch (error) {
      console.error("Failed to fetch certificate fields:", error);
      setAutoFetchError("Failed to load course data");
    } finally {
      setIsAutoFetching(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAutoFields();
  }, [fetchAutoFields]);

  // Load existing template data if available
  useEffect(() => {
    if (certificateTemplate) {
      setFields((prev) => ({
        ...prev,
        templateType: certificateTemplate.templateType || prev.templateType,
        minPercentage: certificateTemplate.minPercentage || prev.minPercentage,
        fontSize: certificateTemplate.fontSize || prev.fontSize,
        fontColor: certificateTemplate.fontColor || prev.fontColor,
        fontFamily: certificateTemplate.fontFamily || prev.fontFamily,
        namePositionX: certificateTemplate.namePositionX || prev.namePositionX,
        namePositionY: certificateTemplate.namePositionY || prev.namePositionY,
        datePositionX: certificateTemplate.datePositionX || prev.datePositionX,
        datePositionY: certificateTemplate.datePositionY || prev.datePositionY,
        coursePositionX:
          certificateTemplate.coursePositionX || prev.coursePositionX,
        coursePositionY:
          certificateTemplate.coursePositionY || prev.coursePositionY,
      }));
    }
  }, [certificateTemplate]);

  const handleSaveTemplate = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/courses/${courseId}/certificate/template`, {
        ...fields,
        // Store text fields that will be used in PDF generation
        certificateTitle: fields.certificateTitle,
        signatureName: fields.signatureName,
        signatureTitle: fields.signatureTitle,
      });
      toast.success("Certificate template saved successfully!");
      setIsDialogOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to save certificate template");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadTemplate = async (file: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `/api/courses/${courseId}/certificate/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Certificate template uploaded successfully!");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to upload template");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      // Pass current field values to preview
      const params = new URLSearchParams({
        certificateTitle: fields.certificateTitle,
        courseTitle: fields.courseTitle || autoData?.courseTitle || "",
        teacherName: fields.teacherName || autoData?.teacherName || "",
        signatureName: fields.signatureName || autoData?.teacherName || "",
        signatureTitle: fields.signatureTitle,
        organizationName: fields.organizationName || "",
        useLocal: "1",
      });

      const res = await axios.get(
        `/api/courses/${courseId}/certificate/sample?${params.toString()}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        certificateTitle: fields.certificateTitle,
        courseTitle: fields.courseTitle || autoData?.courseTitle || "",
        teacherName: fields.teacherName || autoData?.teacherName || "",
        signatureName: fields.signatureName || autoData?.teacherName || "",
        signatureTitle: fields.signatureTitle,
        organizationName: fields.organizationName || "",
        useLocal: "1",
      });

      const res = await axios.get(
        `/api/courses/${courseId}/certificate/sample?${params.toString()}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sample-certificate.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Sample certificate downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download sample certificate");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (key: keyof CertificateFields, value: any) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <CardTitle>Certificate Template</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isAutoFetching && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
            <Badge variant={certificateTemplate ? "default" : "secondary"}>
              {certificateTemplate ? "Active" : "Not Set"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-Fetched Data Display */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Auto-Fetched Course Data
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAutoFields}
              disabled={isAutoFetching}
            >
              <RefreshCw
                className={`w-4 h-4 ${isAutoFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {autoFetchError ? (
            <p className="text-sm text-red-600">{autoFetchError}</p>
          ) : autoData ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/50 p-2 rounded">
                  <span className="text-blue-600 font-medium block">
                    Course Titledd
                  </span>
                  <span className="text-blue-900">{autoData.courseTitle}</span>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <span className="text-blue-600 font-medium block">
                    Instructor
                  </span>
                  <span className="text-blue-900">{autoData.teacherName}</span>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <span className="text-blue-600 font-medium block">
                    Chapters
                  </span>
                  <span className="text-blue-900">{autoData.chapterCount}</span>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <span className="text-blue-600 font-medium block">
                    Quizzes
                  </span>
                  <span className="text-blue-900">{autoData.quizCount}</span>
                </div>
              </div>
              <div className="bg-white/50 p-2 rounded text-sm">
                <span className="text-blue-600 font-medium block">
                  Requirements
                </span>
                <span className="text-blue-900">
                  {autoData.requirementsText}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-blue-600">Loading course data...</p>
          )}
        </div>

        {/* Editable Certificate Text Fields */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
            <Edit3 className="w-4 h-4" />
            Certificate Text (Editable)
          </h4>

          <div className="space-y-3">
            <div>
              <Label className="text-green-700">Certificate Title</Label>
              <Input
                value={fields.certificateTitle}
                onChange={(e) =>
                  updateField("certificateTitle", e.target.value)
                }
                placeholder="Certificate of Completion"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-green-700">Course Title</Label>
                <Input
                  value={fields.courseTitle}
                  onChange={(e) => updateField("courseTitle", e.target.value)}
                  placeholder={autoData?.courseTitle || "Course Title"}
                  className="mt-1"
                />
                {autoData?.courseTitle && !fields.courseTitle && (
                  <p className="text-xs text-green-600 mt-1">
                    Auto: {autoData.courseTitle}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-green-700">Instructor Name</Label>
                <Input
                  value={fields.teacherName}
                  onChange={(e) => updateField("teacherName", e.target.value)}
                  placeholder={autoData?.teacherName || "Instructor Name"}
                  className="mt-1"
                />
                {autoData?.teacherName && !fields.teacherName && (
                  <p className="text-xs text-green-600 mt-1">
                    Auto: {autoData.teacherName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-green-700">Signature Name</Label>
                <Input
                  value={fields.signatureName}
                  onChange={(e) => updateField("signatureName", e.target.value)}
                  placeholder={autoData?.teacherName || "Signature Name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-green-700">Signature Title</Label>
                <Select
                  value={fields.signatureTitle}
                  onValueChange={(v) => updateField("signatureTitle", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Course Instructor">
                      Course Instructor
                    </SelectItem>
                    <SelectItem value="Lead Instructor">
                      Lead Instructor
                    </SelectItem>
                    <SelectItem value="Program Director">
                      Program Director
                    </SelectItem>
                    <SelectItem value="Academic Director">
                      Academic Director
                    </SelectItem>
                    <SelectItem value="Course Creator">
                      Course Creator
                    </SelectItem>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="Founder">Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-green-700">
                Organization Name (Optional)
              </Label>
              <Input
                value={fields.organizationName}
                onChange={(e) =>
                  updateField("organizationName", e.target.value)
                }
                placeholder="Your Organization or Academy"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Template Status */}
        {certificateTemplate && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-green-800">Template Active</h4>
              <Badge variant="outline">
                {certificateTemplate.templateType}
              </Badge>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>Minimum score: {certificateTemplate.minPercentage}%</p>
              <p>
                Font: {certificateTemplate.fontFamily} (
                {certificateTemplate.fontSize}px)
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoading}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSaveTemplate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {certificateTemplate ? "Update Certificate" : "Create Certificate"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="file"
                id="template-upload"
                accept="image/*,.pdf"
                onChange={(e) =>
                  e.target.files?.[0] && handleUploadTemplate(e.target.files[0])
                }
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  document.getElementById("template-upload")?.click()
                }
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Template
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadSample}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample
            </Button>
          </div>
        </div>

        {/* Advanced Settings Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Certificate Settings</DialogTitle>
              <DialogDescription>
                Configure all certificate template options
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="styling" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="position">Position</TabsTrigger>
              </TabsList>

              <TabsContent value="styling" className="space-y-4 mt-4">
                <div>
                  <Label>Template Type</Label>
                  <Select
                    value={fields.templateType}
                    onValueChange={(v) => updateField("templateType", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image (PNG/JPG)</SelectItem>
                      <SelectItem value="pdf">PDF Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={fields.fontSize}
                      onChange={(e) =>
                        updateField("fontSize", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Font Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={fields.fontColor}
                        onChange={(e) =>
                          updateField("fontColor", e.target.value)
                        }
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={fields.fontColor}
                        onChange={(e) =>
                          updateField("fontColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={fields.fontFamily}
                    onValueChange={(v) => updateField("fontFamily", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">
                        Times New Roman
                      </SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4 mt-4">
                <div>
                  <Label>Minimum Percentage Required</Label>
                  <Input
                    type="number"
                    value={fields.minPercentage}
                    onChange={(e) =>
                      updateField("minPercentage", parseInt(e.target.value))
                    }
                    min={0}
                    max={100}
                    className="mt-1"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require All Chapters</Label>
                      <p className="text-xs text-muted-foreground">
                        Student must complete all chapters
                      </p>
                    </div>
                    <Switch
                      checked={fields.requireAllChapters}
                      onCheckedChange={(v) =>
                        updateField("requireAllChapters", v)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require All Quizzes</Label>
                      <p className="text-xs text-muted-foreground">
                        Student must pass all quizzes
                      </p>
                    </div>
                    <Switch
                      checked={fields.requireAllQuizzes}
                      onCheckedChange={(v) =>
                        updateField("requireAllQuizzes", v)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require All Assignments</Label>
                      <p className="text-xs text-muted-foreground">
                        Student must submit all assignments
                      </p>
                    </div>
                    <Switch
                      checked={fields.requireAllAssignments}
                      onCheckedChange={(v) =>
                        updateField("requireAllAssignments", v)
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="position" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Set coordinates for text placement on image-based templates.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name Position X</Label>
                    <Input
                      type="number"
                      value={fields.namePositionX}
                      onChange={(e) =>
                        updateField("namePositionX", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Name Position Y</Label>
                    <Input
                      type="number"
                      value={fields.namePositionY}
                      onChange={(e) =>
                        updateField("namePositionY", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date Position X</Label>
                    <Input
                      type="number"
                      value={fields.datePositionX}
                      onChange={(e) =>
                        updateField("datePositionX", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date Position Y</Label>
                    <Input
                      type="number"
                      value={fields.datePositionY}
                      onChange={(e) =>
                        updateField("datePositionY", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Course Position X</Label>
                    <Input
                      type="number"
                      value={fields.coursePositionX}
                      onChange={(e) =>
                        updateField("coursePositionX", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Course Position Y</Label>
                    <Input
                      type="number"
                      value={fields.coursePositionY}
                      onChange={(e) =>
                        updateField("coursePositionY", parseInt(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={isPreviewOpen}
          onOpenChange={(o) => {
            setIsPreviewOpen(o);
            if (!o && previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Certificate Preview</DialogTitle>
              <DialogDescription>
                Preview with your current settings
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-[70vh]">
              {previewUrl ? (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <p className="text-sm text-muted-foreground">
                    PDF preview not supported. Download the sample instead.
                  </p>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
