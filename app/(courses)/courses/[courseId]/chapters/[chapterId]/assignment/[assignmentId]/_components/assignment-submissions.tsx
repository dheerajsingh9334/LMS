"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Eye, MessageSquare, Award, Calendar } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import axios from "axios";

interface AssignmentSubmissionsProps {
  assignment: {
    id: string;
    title: string;
    maxScore: number;
    dueDate: Date;
  };
  submissions: Array<{
    id: string;
    submissionType: string;
    fileUrl?: string;
    fileName?: string;
    linkUrl?: string;
    textContent?: string;
    status: string;
    submittedAt: Date;
    isLate: boolean;
    daysLate: number;
    score?: number;
    feedback?: string;
    gradedAt?: Date;
    student: {
      id: string;
      name?: string;
      email?: string;
    };
  }>;
  courseId: string;
  chapterId: string;
}

export const AssignmentSubmissions = ({
  assignment,
  submissions,
  courseId,
  chapterId,
}: AssignmentSubmissionsProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const handleGradeSubmission = async (submissionId: string) => {
    const score = parseInt(gradeScore);
    
    if (isNaN(score) || score < 0 || score > assignment.maxScore) {
      toast.error(`Score must be between 0 and ${assignment.maxScore}`);
      return;
    }

    try {
      setIsGrading(true);
      
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/grade`,
        {
          submissionId,
          score,
          feedback: gradeFeedback.trim() || undefined,
        }
      );
      
      toast.success("Assignment graded successfully!");
      window.location.reload(); // Refresh to show updated data
    } catch (error: any) {
      console.error("Grading error:", error);
      toast.error(error.response?.data?.message || "Failed to grade assignment");
    } finally {
      setIsGrading(false);
    }
  };

  const openGradingDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setGradeScore(submission.score?.toString() || "");
    setGradeFeedback(submission.feedback || "");
  };

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "graded") {
      return <Badge variant="default">Graded</Badge>;
    } else if (status === "submitted") {
      return (
        <div className="flex gap-2">
          <Badge variant="secondary">Submitted</Badge>
          {isLate && <Badge variant="destructive">Late</Badge>}
        </div>
      );
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const renderSubmissionContent = (submission: any) => {
    switch (submission.submissionType) {
      case "file":
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {submission.fileName || "Download File"}
            </a>
          </div>
        );
      case "link":
        return (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-green-600" />
            <a
              href={submission.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {submission.linkUrl}
            </a>
          </div>
        );
      case "text":
        return (
          <div className="bg-gray-50 p-3 rounded border">
            <p className="text-sm whitespace-pre-wrap line-clamp-3">
              {submission.textContent}
            </p>
          </div>
        );
      default:
        return <span className="text-gray-500">Unknown submission type</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Student Submissions
          </span>
          <Badge variant="outline">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {submission.student.name || "Unknown Student"}
                    </h4>
                    <p className="text-sm text-gray-600">{submission.student.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission.status, submission.isLate)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted:</label>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(submission.submittedAt), "PPP 'at' p")}
                      {submission.isLate && (
                        <span className="text-red-600">
                          ({submission.daysLate} day{submission.daysLate !== 1 ? "s" : ""} late)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {submission.status === "graded" && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Score:</label>
                      <div className="text-lg font-bold text-green-600">
                        {submission.score}/{assignment.maxScore}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Submission Content:
                  </label>
                  {renderSubmissionContent(submission)}
                </div>

                {submission.feedback && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <label className="text-sm font-medium text-blue-800 block mb-1">
                      Feedback:
                    </label>
                    <p className="text-blue-700 whitespace-pre-wrap text-sm">
                      {submission.feedback}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant={submission.status === "graded" ? "outline" : "default"}
                        size="sm"
                        onClick={() => openGradingDialog(submission)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {submission.status === "graded" ? "Update Grade" : "Grade Assignment"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Grade Assignment - {submission.student.name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Submission Preview */}
                        <div>
                          <h4 className="font-medium mb-2">Student Submission:</h4>
                          <div className="p-3 bg-gray-50 rounded border">
                            {renderSubmissionContent(submission)}
                          </div>
                        </div>

                        {/* Grading Form */}
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                              Score (out of {assignment.maxScore})
                            </label>
                            <Input
                              id="score"
                              type="number"
                              min="0"
                              max={assignment.maxScore}
                              value={gradeScore}
                              onChange={(e) => setGradeScore(e.target.value)}
                              placeholder="Enter score"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback (Optional)
                            </label>
                            <Textarea
                              id="feedback"
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              placeholder="Provide feedback to the student..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={() => handleGradeSubmission(submission.id)}
                            disabled={isGrading || !gradeScore}
                          >
                            {isGrading ? "Saving..." : "Save Grade"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};