"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Save, CheckCircle, XCircle } from "lucide-react";

interface CertificateRequirementsProps {
  courseId: string;
  initialData: any | null;
  totalChapters: number;
  totalQuizzes: number;
  totalAssignments: number;
}

export const CertificateRequirements = ({
  courseId,
  initialData,
  totalChapters,
  totalQuizzes,
  totalAssignments,
}: CertificateRequirementsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [minPercentage, setMinPercentage] = useState(initialData?.minPercentage || 70);
  const [requireAllChapters, setRequireAllChapters] = useState(
    initialData?.requireAllChapters ?? true
  );
  const [requireAllQuizzes, setRequireAllQuizzes] = useState(
    initialData?.requireAllQuizzes ?? true
  );
  const [requireAllAssignments, setRequireAllAssignments] = useState(
    initialData?.requireAllAssignments ?? true
  );

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      const data = {
        minPercentage,
        requireAllChapters,
        requireAllQuizzes,
        requireAllAssignments,
      };

      await axios.patch(`/api/courses/${courseId}/certificate-template/requirements`, data);
      toast.success("Requirements updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Statistics */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950">
        <h4 className="font-medium mb-3">Course Content Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Chapters</p>
            <p className="text-2xl font-bold">{totalChapters}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quizzes</p>
            <p className="text-2xl font-bold">{totalQuizzes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Assignments</p>
            <p className="text-2xl font-bold">{totalAssignments}</p>
          </div>
        </div>
      </Card>

      {/* Minimum Percentage */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="minPercentage">Minimum Percentage Required</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Students must achieve at least this percentage to earn a certificate
          </p>
          <div className="flex items-center gap-4">
            <Input
              id="minPercentage"
              type="number"
              min="0"
              max="100"
              value={minPercentage}
              onChange={(e) => setMinPercentage(parseFloat(e.target.value))}
              disabled={isLoading}
              className="w-32"
            />
            <span className="text-2xl font-bold">{minPercentage}%</span>
          </div>
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="100"
              value={minPercentage}
              onChange={(e) => setMinPercentage(parseFloat(e.target.value))}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Chapter Completion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label>Complete All Chapters</Label>
              {requireAllChapters ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Students must complete all {totalChapters} chapters to get a certificate
            </p>
          </div>
          <Switch
            checked={requireAllChapters}
            onCheckedChange={setRequireAllChapters}
            disabled={isLoading}
          />
        </div>

        {!requireAllChapters && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Students can earn certificates without completing all chapters
            </p>
          </Card>
        )}
      </div>

      <Separator />

      {/* Quiz Completion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label>Complete All Quizzes</Label>
              {requireAllQuizzes ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Students must complete all {totalQuizzes} quizzes to get a certificate
            </p>
          </div>
          <Switch
            checked={requireAllQuizzes}
            onCheckedChange={setRequireAllQuizzes}
            disabled={isLoading}
          />
        </div>

        {!requireAllQuizzes && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Students can earn certificates without completing all quizzes
            </p>
          </Card>
        )}
      </div>

      <Separator />

      {/* Assignment Completion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label>Complete All Assignments</Label>
              {requireAllAssignments ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Students must submit all {totalAssignments} assignments to get a certificate
            </p>
          </div>
          <Switch
            checked={requireAllAssignments}
            onCheckedChange={setRequireAllAssignments}
            disabled={isLoading}
          />
        </div>

        {!requireAllAssignments && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Students can earn certificates without completing all assignments
            </p>
          </Card>
        )}
      </div>

      <Separator />

      {/* Summary */}
      <Card className="p-4 bg-green-50 dark:bg-green-950">
        <h4 className="font-medium mb-2">Certificate Requirements Summary</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Minimum {minPercentage}% overall score
          </li>
          <li className="flex items-center gap-2">
            {requireAllChapters ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            Complete all {totalChapters} chapters
          </li>
          <li className="flex items-center gap-2">
            {requireAllQuizzes ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            Complete all {totalQuizzes} quizzes
          </li>
          <li className="flex items-center gap-2">
            {requireAllAssignments ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            Submit all {totalAssignments} assignments
          </li>
        </ul>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          Save Requirements
        </Button>
      </div>
    </div>
  );
};
