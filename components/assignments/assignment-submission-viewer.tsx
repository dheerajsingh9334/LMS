"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Eye,
  Download,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AssignmentSubmission {
  id: string;
  submissionType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkUrl?: string;
  textContent?: string;
  isLate: boolean;
  daysLate: number;
  status: string;
  score?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  student: {
    id: string;
    name: string;
    email: string;
  };
  grader?: {
    id: string;
    name: string;
  };
}

interface AssignmentSubmissionViewerProps {
  assignmentId: string;
  assignmentTitle: string;
  submissions: AssignmentSubmission[];
}

export const AssignmentSubmissionViewer = ({ 
  assignmentId, 
  assignmentTitle, 
  submissions 
}: AssignmentSubmissionViewerProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setIsGrading(true);
      
      await axios.patch(`/api/assignments/submissions/${selectedSubmission.id}/grade`, {
        score,
        feedback,
      });

      toast.success("Submission graded successfully");
      router.refresh();
      setSelectedSubmission(null);
    } catch (error) {
      toast.error("Failed to grade submission");
    } finally {
      setIsGrading(false);
    }
  };

  const getStatusBadge = (submission: AssignmentSubmission) => {
    switch (submission.status) {
      case "graded":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Graded
          </Badge>
        );
      case "submitted":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  const renderSubmissionContent = (submission: AssignmentSubmission) => {
    switch (submission.submissionType) {
      case "file":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{submission.fileName}</p>
                <p className="text-sm text-gray-500">
                  {submission.fileSize ? `${(submission.fileSize / 1024 / 1024).toFixed(2)} MB` : 'File'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(submission.fileUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                View/Download
              </Button>
            </div>
          </div>
        );
      case "link":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Submitted Link:</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input 
                  value={submission.linkUrl || ""} 
                  readOnly 
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(submission.linkUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      case "text":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Text Submission:</Label>
              <div className="mt-2">
                <Textarea 
                  value={submission.textContent || ""} 
                  readOnly 
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-500 py-4">
            No content available
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Student Submissions</h3>
        <Badge variant="outline">
          {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{submission.student.name}</p>
                      <p className="text-sm text-gray-500">{submission.student.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(submission)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Submitted: {format(new Date(submission.submittedAt), 'PPp')}
                  </div>
                  {submission.isLate && (
                    <Badge variant="destructive" className="text-xs">
                      Late by {submission.daysLate} day{submission.daysLate > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {submission.status === "graded" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">Grade: {submission.score}%</span>
                      <span className="text-sm text-green-600">
                        Graded by {submission.grader?.name} on {' '}
                        {submission.gradedAt && format(new Date(submission.gradedAt), 'PPp')}
                      </span>
                    </div>
                    {submission.feedback && (
                      <div>
                        <p className="text-sm font-medium text-green-800">Feedback:</p>
                        <p className="text-sm text-green-700">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Submission
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{assignmentTitle} - Submission Details</DialogTitle>
                        <DialogDescription>
                          Submitted by {submission.student.name} on {format(new Date(submission.submittedAt), 'PPp')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {renderSubmissionContent(submission)}

                        {submission.status !== "graded" && (
                          <div className="border-t pt-4 space-y-4">
                            <h4 className="font-medium">Grade Submission</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="score">Score (0-100)</Label>
                                <Input
                                  id="score"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={score}
                                  onChange={(e) => setScore(Number(e.target.value))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="feedback">Feedback (Optional)</Label>
                              <Textarea
                                id="feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Provide feedback to the student..."
                                className="min-h-[80px]"
                              />
                            </div>
                            <Button
                              onClick={handleGradeSubmission}
                              disabled={isGrading}
                              className="w-full"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {isGrading ? "Grading..." : "Grade Submission"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {submission.status !== "graded" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setScore(submission.score || 0);
                        setFeedback(submission.feedback || "");
                      }}
                    >
                      Grade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};