"use client";

import { format } from "date-fns";
import { FileText, Calendar, Users, AlertCircle, Eye, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  isPublished: boolean;
  chapter?: {
    title: string;
  };
  _count: {
    submissions: number;
  };
}

interface AssignmentListProps {
  courseId: string;
  assignments: Assignment[];
  onDelete?: (assignmentId: string) => void;
}

export function AssignmentList({
  courseId,
  assignments,
  onDelete,
}: AssignmentListProps) {
  const now = new Date();

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No assignments yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first assignment to get started
          </p>
          <Link href={`/teacher/courses/${courseId}/assignments/new`}>
            <Button>Create Assignment</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">
            Manage course assignments and track submissions
          </p>
        </div>
        <Link href={`/teacher/courses/${courseId}/assignments/new`}>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Max Score</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const isPastDue = new Date(assignment.dueDate) < now;
              const isDueSoon =
                new Date(assignment.dueDate).getTime() - now.getTime() <
                24 * 60 * 60 * 1000; // 24 hours

              return (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p className="text-sm">
                          {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(assignment.dueDate), "h:mm a")}
                        </p>
                      </div>
                      {isPastDue && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      {!isPastDue && isDueSoon && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{assignment.maxScore} pts</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{assignment._count.submissions}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.isPublished ? (
                      <Badge>Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/teacher/courses/${courseId}/assignments/${assignment.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link
                        href={`/teacher/courses/${courseId}/assignments/${assignment.id}/edit`}
                      >
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter((a) => a.isPublished).length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.reduce((sum, a) => sum + a._count.submissions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Due</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                assignments.filter(
                  (a) => new Date(a.dueDate) > now && a.isPublished
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
