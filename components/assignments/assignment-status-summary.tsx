"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

interface AssignmentStatusSummaryProps {
  assignments: {
    id: string;
    title: string;
    chapterTitle: string;
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
    submissions: number;
    dueDate?: Date;
  }[];
}

export const AssignmentStatusSummary = ({ assignments }: AssignmentStatusSummaryProps) => {
  const totalAssignments = assignments.length;
  const pendingCount = assignments.filter(a => a.verificationStatus === "PENDING").length;
  const verifiedCount = assignments.filter(a => a.verificationStatus === "VERIFIED").length;
  const rejectedCount = assignments.filter(a => a.verificationStatus === "REJECTED").length;

  const verificationProgress = totalAssignments > 0 ? (verifiedCount / totalAssignments) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{verifiedCount}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <AlertTriangle className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{totalAssignments}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Assignments Verified</span>
              <span>{Math.round(verificationProgress)}%</span>
            </div>
            <Progress value={verificationProgress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {verifiedCount} of {totalAssignments} assignments have been verified
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {pendingCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingCount} assignment{pendingCount > 1 ? 's' : ''} pending verification. 
            Students cannot see unverified assignments.
          </AlertDescription>
        </Alert>
      )}

      {rejectedCount > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {rejectedCount} assignment{rejectedCount > 1 ? 's have' : ' has'} been rejected. 
            Please review and resubmit for verification.
          </AlertDescription>
        </Alert>
      )}

      {/* Assignment List */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Status Details</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No assignments found for this course.
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(assignment.verificationStatus)}
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Chapter: {assignment.chapterTitle}
                      </p>
                      {assignment.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {assignment.dueDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      {assignment.submissions} submissions
                    </span>
                    {getStatusBadge(assignment.verificationStatus)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};