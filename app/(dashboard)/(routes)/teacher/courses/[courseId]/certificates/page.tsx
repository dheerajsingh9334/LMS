import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { CertificateTemplateForm } from "./_components/certificate-template-form";
import { CertificateRequirements } from "./_components/certificate-requirements";
import { IssuedCertificatesList } from "./_components/issued-certificates-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseNavbar } from "@/components/course-navbar";
import { CertificateManager } from "../_components/certificate-manager";

const CertificatePage = async ({
  params,
}: {
  params: { courseId: string };
}) => {
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
      certificateTemplate: true,
      chapters: {
        where: {
          isPublished: true,
        },
      },
      certificates: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!course) {
    return redirect("/");
  }

  // Get course statistics
  const totalQuizzes = await db.quiz.count({
    where: {
      chapter: {
        courseId: params.courseId,
        isPublished: true,
      },
      isPublished: true,
    },
  });

  const totalAssignments = await db.assignment.count({
    where: {
      courseId: params.courseId,
      isPublished: true,
    },
  });

  const totalStudents = await db.purchase.count({
    where: {
      courseId: params.courseId,
    },
  });

  const issuedCertificates = await db.certificate.count({
    where: {
      courseId: params.courseId,
    },
  });

  return (
    <>
      <CourseNavbar courseId={params.courseId} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/teacher/courses/${params.courseId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold">Certificate Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage certificates for {course.title}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Certificates Issued
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{issuedCertificates}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Chapters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {course.chapters.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quizzes & Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalQuizzes + totalAssignments}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Card (same as course page) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Certificate Template</CardTitle>
              <CardDescription>
                Preview and manage the certificate template exactly like the
                course overview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CertificateManager
                courseId={params.courseId}
                certificateTemplate={course.certificateTemplate}
              />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template">Template Upload</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="issued">Issued Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Template</CardTitle>
                  <CardDescription>
                    Upload a custom certificate template for this course.
                    Students will automatically receive certificates when they
                    meet all requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificateTemplateForm
                    courseId={params.courseId}
                    initialData={course.certificateTemplate}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Requirements</CardTitle>
                  <CardDescription>
                    Set the requirements students must meet to earn a
                    certificate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificateRequirements
                    courseId={params.courseId}
                    initialData={course.certificateTemplate}
                    totalChapters={course.chapters.length}
                    totalQuizzes={totalQuizzes}
                    totalAssignments={totalAssignments}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issued" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Issued Certificates</CardTitle>
                  <CardDescription>
                    View all certificates issued for this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IssuedCertificatesList
                    courseId={params.courseId}
                    certificates={course.certificates}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CertificatePage;
