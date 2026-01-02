import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AssignmentList } from "@/components/assignments/assignment-list";
import { AssignmentVerification } from "./_components/assignment-verification";
import { AssignmentStatusSummary } from "./_components/assignment-status-summary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { CourseNavbar } from "@/components/course-navbar";

const AssignmentsPage = async ({
  params
}: {
  params: { courseId: string }
}) => {
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Verify the teacher owns this course
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId
    },
    select: {
      id: true,
      title: true,
    }
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  // Fetch all assignments for this course
  const assignments = await db.assignment.findMany({
    where: {
      courseId: params.courseId
    },
    include: {
      chapter: {
        select: {
          title: true
        }
      },
      _count: {
        select: {
          submissions: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Separate assignments by verification status
  const pendingAssignments = assignments.filter(a => a.verificationStatus === "pending");
  const verifiedAssignments = assignments.filter(a => a.verificationStatus === "verified");
  const rejectedAssignments = assignments.filter(a => a.verificationStatus === "rejected");

  return (
    <>
      <CourseNavbar courseId={params.courseId} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Assignments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and verify assignments for {course.title}
            </p>
          </div>
          <Link href={`/teacher/courses/${params.courseId}/assignments/new`}>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </Link>
        </div>

        <AssignmentStatusSummary
          totalAssignments={assignments.length}
          pendingCount={pendingAssignments.length}
          verifiedCount={verifiedAssignments.length}
          rejectedCount={rejectedAssignments.length}
        />

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({verifiedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({rejectedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <AssignmentVerification 
                  key={assignment.id} 
                  assignment={assignment}
                />
              ))}
              {assignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No assignments found. Create your first assignment to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingAssignments.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-800">Assignments Awaiting Verification</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    These assignments are not visible to students until you verify them.
                  </p>
                </div>
                {pendingAssignments.map((assignment) => (
                  <AssignmentVerification 
                    key={assignment.id} 
                    assignment={assignment}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending assignments to verify.
              </div>
            )}
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            {verifiedAssignments.length > 0 ? (
              <div className="space-y-4">
                {verifiedAssignments.map((assignment) => (
                  <AssignmentVerification 
                    key={assignment.id} 
                    assignment={assignment}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No verified assignments yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedAssignments.length > 0 ? (
              <div className="space-y-4">
                {rejectedAssignments.map((assignment) => (
                  <AssignmentVerification 
                    key={assignment.id} 
                    assignment={assignment}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No rejected assignments.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AssignmentsPage;
