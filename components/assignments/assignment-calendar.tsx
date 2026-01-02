"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, FileText, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, isToday, startOfDay } from "date-fns";
import Link from "next/link";

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  course: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  chapter?: {
    title: string;
  };
  submissions: any[];
}

export function AssignmentCalendar() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments/calendar");
      const data = await response.json();
      
      // Convert date strings to Date objects
      const assignmentsWithDates = data.map((a: any) => ({
        ...a,
        dueDate: new Date(a.dueDate),
      }));
      
      setAssignments(assignmentsWithDates);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignmentDates = assignments.map((a) => startOfDay(a.dueDate));

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(
      (a) => startOfDay(a.dueDate).getTime() === startOfDay(date).getTime()
    );
  };

  const upcomingAssignments = assignments
    .filter((a) => isAfter(a.dueDate, new Date()))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const overdueAssignments = assignments.filter(
    (a) => isBefore(a.dueDate, new Date()) && a.submissions.length === 0
  );

  const selectedDateAssignments = selectedDate
    ? getAssignmentsForDate(selectedDate)
    : [];

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Assignment Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasAssignment: assignmentDates,
            }}
            modifiersStyles={{
              hasAssignment: {
                fontWeight: "bold",
                textDecoration: "underline",
                color: "hsl(var(--primary))",
              },
            }}
          />

          {/* Selected Date Assignments */}
          {selectedDate && selectedDateAssignments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">
                {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              {selectedDateAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/courses/${assignment.course.id}/assignments/${assignment.id}`}
                  className="block"
                >
                  <div className="rounded-lg border p-3 hover:bg-muted/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.course.title}
                        </p>
                        {assignment.chapter && (
                          <p className="text-xs text-muted-foreground">
                            Chapter: {assignment.chapter.title}
                          </p>
                        )}
                      </div>
                      {assignment.submissions.length > 0 ? (
                        <Badge className="bg-green-500">Submitted</Badge>
                      ) : (
                        <Badge variant="destructive">Pending</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming & Overdue */}
      <div className="space-y-6">
        {/* Overdue Assignments */}
        {overdueAssignments.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Overdue ({overdueAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/courses/${assignment.course.id}/assignments/${assignment.id}`}
                  className="block"
                >
                  <div className="rounded-lg border border-destructive bg-destructive/5 p-3 hover:bg-destructive/10 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.course.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <p className="text-xs text-destructive">
                            Due {format(assignment.dueDate, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming assignments
              </p>
            ) : (
              upcomingAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/courses/${assignment.course.id}/assignments/${assignment.id}`}
                  className="block"
                >
                  <div className="rounded-lg border p-3 hover:bg-muted/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.course.title}
                        </p>
                        {assignment.chapter && (
                          <p className="text-xs text-muted-foreground">
                            Chapter: {assignment.chapter.title}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <p className="text-xs">
                            Due {format(assignment.dueDate, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      {assignment.submissions.length > 0 ? (
                        <Badge>Submitted</Badge>
                      ) : isToday(assignment.dueDate) ? (
                        <Badge variant="destructive">Due Today</Badge>
                      ) : (
                        <Badge variant="outline">Not Submitted</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
