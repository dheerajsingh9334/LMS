"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  MessageSquare,
  CalendarDays,
  Users
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AssignmentSubmissionViewer } from "@/components/assignments/assignment-submission-viewer";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  verificationStatus: string;
  verifiedAt?: Date | null;
  verificationNotes?: string | null;
  isPublished: boolean;
  _count: {
    submissions: number;
  };
}

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

interface AssignmentVerificationProps {
  assignment: Assignment;
}

export const AssignmentVerification = ({ assignment }: AssignmentVerificationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(assignment.verificationNotes || "");
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const router = useRouter();

  // Fetch submissions for this assignment
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoadingSubmissions(true);
        const response = await axios.get(`/api/assignments/${assignment.id}/submissions`);
        setSubmissions(response.data);
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [assignment.id]);

  const handleVerification = async (status: "verified" | "rejected") => {
    try {
      setIsLoading(true);
      
      await axios.patch(`/api/assignments/${assignment.id}/verify`, {
        verificationStatus: status,
        verificationNotes: notes,
      });

      toast.success(
        status === "verified" 
          ? "Assignment verified and visible to students" 
          : "Assignment rejected and hidden from students"
      );
      
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (assignment.verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{assignment.title}</CardTitle>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4" />
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {assignment._count.submissions} submissions
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">{assignment.description}</p>
        </div>

        {assignment.verificationStatus === "pending" && (
          <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Assignment Verification Required</h4>
            </div>
            <p className="text-sm text-yellow-700">
              This assignment is pending your review. Students cannot see it until you verify it.
            </p>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Verification Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this assignment verification..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleVerification("verified")}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify & Publish
              </Button>
              <Button
                onClick={() => handleVerification("rejected")}
                disabled={isLoading}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {assignment.verificationStatus === "verified" && assignment.verifiedAt && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Assignment Verified</h4>
            </div>
            <p className="text-sm text-green-700">
              Verified on {new Date(assignment.verifiedAt).toLocaleDateString()} - Visible to students
            </p>
            {assignment.verificationNotes && (
              <div className="mt-2">
                <p className="text-xs text-green-600 font-medium">Notes:</p>
                <p className="text-sm text-green-700">{assignment.verificationNotes}</p>
              </div>
            )}
          </div>
        )}

        {assignment.verificationStatus === "rejected" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-800">Assignment Rejected</h4>
            </div>
            <p className="text-sm text-red-700">
              This assignment has been rejected and is not visible to students.
            </p>
            {assignment.verificationNotes && (
              <div className="mt-2">
                <p className="text-xs text-red-600 font-medium">Rejection Notes:</p>
                <p className="text-sm text-red-700">{assignment.verificationNotes}</p>
              </div>
            )}
            
            <Button
              onClick={() => handleVerification("verified")}
              disabled={isLoading}
              className="mt-3 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Re-verify Assignment
            </Button>
          </div>
        )}

        {/* Assignment Submissions Section */}
        {(assignment.verificationStatus === "verified" || submissions.length > 0) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              <h4 className="font-medium">Student Submissions</h4>
            </div>
            {loadingSubmissions ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading submissions...</p>
              </div>
            ) : (
              <AssignmentSubmissionViewer
                assignmentId={assignment.id}
                assignmentTitle={assignment.title}
                submissions={submissions}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};