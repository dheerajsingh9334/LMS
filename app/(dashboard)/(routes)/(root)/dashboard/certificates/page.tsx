import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Award, Download, Calendar, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Image from "next/image";
import { StudentCertificatePreview } from "@/components/student-certificate-preview";

const MyCertificatesPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  if (!userId) {
    return redirect("/");
  }

  // Get all certificates earned by the user
  const certificates = await db.certificate.findMany({
    where: {
      userId: userId,
    },
    include: {
      course: {
        select: {
          title: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      issueDate: "desc",
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-600" />
          My Certificates
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          All certificates you&apos;ve earned from completed courses
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Certificates Earned
          </CardTitle>
          <Award className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{certificates.length}</div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      {certificates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">
                      {certificate.course.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Issued: {format(new Date(certificate.issueDate), "PPP")}
                    </CardDescription>
                  </div>
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Certificate Preview - Dynamic */}
                <StudentCertificatePreview
                  courseId={certificate.courseId}
                  certificateUrl={certificate.certificateUrl}
                  className=""
                />

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Student Name:</span>
                    <span className="font-medium">
                      {certificate.studentName}
                    </span>
                  </div>

                  {certificate.grade && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Grade:</span>
                      <Badge variant="default">{certificate.grade}</Badge>
                    </div>
                  )}

                  {certificate.verificationCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Verification Code:
                      </span>
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {certificate.verificationCode}
                      </code>
                    </div>
                  )}

                  {certificate.skills && certificate.skills.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">
                        Skills Acquired:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {certificate.skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {certificate.hoursCompleted && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Hours Completed:
                      </span>
                      <span className="font-medium">
                        {certificate.hoursCompleted}h
                      </span>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <Button className="w-full" variant="default" asChild>
                  <a
                    href={`/api/courses/${certificate.courseId}/certificate/pdf`}
                    download={`${certificate.course.title.replace(
                      /\s+/g,
                      "_",
                    )}_Certificate.pdf`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Award className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              No certificates yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 text-center max-w-md">
              Complete courses and meet the requirements to earn certificates.
              They will appear here once issued by your instructor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyCertificatesPage;
