"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertTriangle
} from "lucide-react";

interface AssignmentStatusSummaryProps {
  totalAssignments: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
}

export const AssignmentStatusSummary = ({
  totalAssignments,
  pendingCount,
  verifiedCount,
  rejectedCount
}: AssignmentStatusSummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAssignments}</div>
          <p className="text-xs text-muted-foreground">
            All assignments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting verification
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          <p className="text-xs text-muted-foreground">
            Visible to students
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          <p className="text-xs text-muted-foreground">
            Hidden from students
          </p>
        </CardContent>
      </Card>

      {pendingCount > 0 && (
        <div className="md:col-span-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You have {pendingCount} assignment{pendingCount !== 1 ? 's' : ''} awaiting verification. 
              Students cannot see these assignments until you verify them.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};