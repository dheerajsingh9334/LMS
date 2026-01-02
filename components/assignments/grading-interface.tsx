"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Shield,
  User,
} from "lucide-react";

interface Submission {
  id: string;
  submissionType: string;
  fileUrl?: string;
  fileName?: string;
  linkUrl?: string;
  textContent?: string;
  isLate: boolean;
  daysLate: number;
  status: string;
  score?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  plagiarismScore?: number;
  plagiarismReport?: string;
  student: {
    id: string;
    name: string;
    email: string;
    rollNo?: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenalty: number;
  enablePlagiarismCheck: boolean;
  course: {
    id: string;
  };
}

interface GradingInterfaceProps {
  assignment: Assignment;
  submissions: Submission[];
}

export function GradingInterface({
  assignment,
  submissions,
}: GradingInterfaceProps) {
  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showPlagiarismReport, setShowPlagiarismReport] = useState(false);

  const handleOpenGrading = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore(submission.score?.toString() || "");
    setFeedback(submission.feedback || "");
    setIsGrading(true);
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assignment.maxScore) {
      toast.error(`Score must be between 0 and ${assignment.maxScore}`);
      return;
    }

    try {
      await axios.patch(
        `/api/courses/${assignment.course.id}/assignments/${assignment.id}/submissions/${selectedSubmission.id}/grade`,
        {
          score: scoreNum,
          feedback,
        }
      );

      toast.success("Submission graded successfully!");
      setIsGrading(false);
      setSelectedSubmission(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to grade submission");
      console.error(error);
    }
  };

  const gradedCount = submissions.filter((s) => s.status === "graded").length;
  const avgScore =
    gradedCount > 0
      ? submissions
          .filter((s) => s.score !== null && s.score !== undefined)
          .reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount
      : 0;
  const lateSubmissions = submissions.filter((s) => s.isLate).length;

  let plagiarismReport: any = null;
  if (selectedSubmission?.plagiarismReport) {
    try {
      plagiarismReport = JSON.parse(selectedSubmission.plagiarismReport);
    } catch (e) {
      console.error("Failed to parse plagiarism report", e);
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((gradedCount / Math.max(submissions.length, 1)) * 100)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgScore.toFixed(1)} / {assignment.maxScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((avgScore / assignment.maxScore) * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Submissions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lateSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((lateSubmissions / Math.max(submissions.length, 1)) * 100)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>
            Review and grade student submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Students haven&apos;t submitted their work yet
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{submission.student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.student.rollNo || submission.student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(submission.submittedAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(submission.submittedAt), "h:mm a")}
                        </p>
                        {submission.isLate && (
                          <Badge variant="destructive" className="mt-1">
                            Late ({submission.daysLate}d)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{submission.submissionType}</Badge>
                    </TableCell>
                    <TableCell>
                      {submission.status === "graded" ? (
                        <Badge>Graded</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {assignment.enablePlagiarismCheck &&
                        submission.plagiarismScore !== null &&
                        submission.plagiarismScore !== undefined &&
                        submission.plagiarismScore > 20 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Shield className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500">
                              {submission.plagiarismScore}% similar
                            </span>
                          </div>
                        )}
                    </TableCell>
                    <TableCell>
                      {submission.score !== null && submission.score !== undefined ? (
                        <div>
                          <span className="font-bold">
                            {submission.score} / {assignment.maxScore}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((submission.score / assignment.maxScore) * 100)}%
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenGrading(submission)}
                      >
                        {submission.status === "graded" ? "Review" : "Grade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      <Dialog open={isGrading} onOpenChange={setIsGrading}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Review student&apos;s work and provide a grade and feedback
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <User className="h-10 w-10" />
                <div>
                  <p className="font-semibold">{selectedSubmission.student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.student.email}
                  </p>
                  <p className="text-xs">
                    Submitted: {format(new Date(selectedSubmission.submittedAt), "PPpp")}
                  </p>
                </div>
              </div>

              {/* Submission Content */}
              <div className="space-y-2">
                <Label>Submission</Label>
                {selectedSubmission.submissionType === "file" && (
                  <div className="flex items-center gap-2 p-4 border rounded-lg">
                    <FileText className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedSubmission.fileName}</p>
                    </div>
                    <a
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                )}

                {selectedSubmission.submissionType === "link" && (
                  <div className="p-4 border rounded-lg">
                    <a
                      href={selectedSubmission.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedSubmission.linkUrl}
                    </a>
                  </div>
                )}

                {selectedSubmission.submissionType === "text" && (
                  <div className="p-4 border rounded-lg bg-muted whitespace-pre-wrap">
                    {selectedSubmission.textContent}
                  </div>
                )}
              </div>

              {/* Plagiarism Report */}
              {assignment.enablePlagiarismCheck && plagiarismReport && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Plagiarism Check
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPlagiarismReport(!showPlagiarismReport)}
                    >
                      {showPlagiarismReport ? "Hide" : "Show"} Details
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        Similarity Score: {plagiarismReport.similarityScore}%
                      </p>
                      {plagiarismReport.similarityScore > 50 && (
                        <Badge variant="destructive">High</Badge>
                      )}
                      {plagiarismReport.similarityScore > 20 &&
                        plagiarismReport.similarityScore <= 50 && (
                          <Badge variant="default">Moderate</Badge>
                        )}
                    </div>

                    {showPlagiarismReport && plagiarismReport.matches && plagiarismReport.matches.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Matches Found:</p>
                        {plagiarismReport.matches.map((match: any, idx: number) => (
                          <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                            <p className="font-medium">
                              {match.studentName} - {match.similarity}% similar
                            </p>
                            {match.matchedContent && (
                              <p className="text-xs text-muted-foreground mt-1">
                                &quot;{match.matchedContent}&quot;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grading Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Score (out of {assignment.maxScore})</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={assignment.maxScore}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                  {selectedSubmission.isLate && assignment.allowLateSubmission && (
                    <p className="text-sm text-yellow-600">
                      Late penalty ({assignment.latePenalty}% per day × {selectedSubmission.daysLate} days) will be applied automatically
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Provide feedback to the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrading(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission}>Save Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
