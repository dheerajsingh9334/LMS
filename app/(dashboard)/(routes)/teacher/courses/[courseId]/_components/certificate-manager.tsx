"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Upload, Settings, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

interface CertificateManagerProps {
  courseId: string;
  certificateTemplate: CertificateTemplate | null;
}

export const CertificateManager = ({ courseId, certificateTemplate }: CertificateManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateConfig, setTemplateConfig] = useState({
    templateType: "image",
    minPercentage: 70,
    fontSize: 24,
    fontColor: "#000000",
    fontFamily: "Arial",
    namePositionX: 400,
    namePositionY: 300,
    datePositionX: 400,
    datePositionY: 350,
    coursePositionX: 400,
    coursePositionY: 250,
  });

  const handleCreateTemplate = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/courses/${courseId}/certificate/template`, templateConfig);
      toast.success("Certificate template created successfully!");
      setIsDialogOpen(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create certificate template");
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
      
      await axios.post(`/api/courses/${courseId}/certificate/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success("Certificate template uploaded successfully!");
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to upload template");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadTemplate(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <CardTitle>Certificate Template</CardTitle>
          </div>
          <Badge variant={certificateTemplate ? "default" : "secondary"}>
            {certificateTemplate ? "Active" : "Not Set"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {certificateTemplate ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-800">Template Active</h4>
                <Badge variant="outline">{certificateTemplate.templateType}</Badge>
              </div>
              <p className="text-sm text-green-700">
                Minimum score required: {certificateTemplate.minPercentage}%
              </p>
              <p className="text-sm text-green-700">
                Font: {certificateTemplate.fontFamily} ({certificateTemplate.fontSize}px)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="font-semibold text-gray-700 mb-2">No Certificate Template</h4>
            <p className="text-sm text-gray-500 mb-4">
              Create a certificate template to allow students to earn certificates
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {certificateTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Certificate Template Configuration</DialogTitle>
                <DialogDescription>
                  Configure your course certificate template settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select
                    value={templateConfig.templateType}
                    onValueChange={(value) => setTemplateConfig(prev => ({ ...prev, templateType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image (PNG/JPG)</SelectItem>
                      <SelectItem value="pdf">PDF Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minPercentage">Minimum Percentage Required</Label>
                  <Input
                    id="minPercentage"
                    type="number"
                    value={templateConfig.minPercentage}
                    onChange={(e) => setTemplateConfig(prev => ({ ...prev, minPercentage: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={templateConfig.fontSize}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fontColor">Font Color</Label>
                    <Input
                      id="fontColor"
                      type="color"
                      value={templateConfig.fontColor}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, fontColor: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={templateConfig.fontFamily}
                    onValueChange={(value) => setTemplateConfig(prev => ({ ...prev, fontFamily: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCreateTemplate} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Creating..." : certificateTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div>
            <input
              type="file"
              id="template-upload"
              // Allow all image types and video types plus PDF
              accept="image/*,video/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => document.getElementById('template-upload')?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? "Uploading..." : "Upload Template File"}
            </Button>
          </div>

          {certificateTemplate && (
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Sample Certificate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};