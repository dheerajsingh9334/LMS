import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ResourcesPage = async ({ params }: { params: { courseId: string } }) => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId: user.id,
    },
    include: {
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Course Resources
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage downloadable resources for {course.title}
          </p>
        </div>
        <Link href={`/teacher/courses/${params.courseId}`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resource Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Resources
              </p>
              <p className="text-2xl font-bold">{course.attachments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {course.attachments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No resources uploaded yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
              Upload course resources from the main course setup page
            </p>
            <Link href={`/teacher/courses/${params.courseId}`}>
              <Button>Go to Course Setup</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Available Resources</CardTitle>
            <CardDescription>
              {course.attachments.length} resource
              {course.attachments.length !== 1 ? "s" : ""} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {course.attachments.map((attachment) => {
                const fileName =
                  attachment.name || attachment.url.split("/").pop() || "File";
                const fileExtension =
                  fileName.split(".").pop()?.toUpperCase() || "FILE";

                return (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{fileName}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Added {attachment.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fileExtension}</Badge>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="flex items-start gap-3 pt-6">
          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Managing Resources
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To add or remove course resources, go to the main course setup
              page and use the attachments section. Students can download these
              resources when they enroll in your course.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourcesPage;
