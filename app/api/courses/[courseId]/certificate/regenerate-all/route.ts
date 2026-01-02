import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import axios from "axios";

// POST: Regenerate all certificates for students in a course
// Body: { certificateIds: string[] }
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the user owns the course
    const course = await db.course.findUnique({
      where: { id: params.courseId, userId: user.id },
      select: { id: true },
    });

    if (!course) {
      return new NextResponse("Course not found or unauthorized", {
        status: 404,
      });
    }

    const body = await req.json().catch(() => ({}));
    const { certificateIds } = body || {};

    if (!certificateIds || !Array.isArray(certificateIds)) {
      return new NextResponse("Invalid certificate IDs", { status: 400 });
    }

    // Regenerate each certificate by calling the issue endpoint
    const results = await Promise.allSettled(
      certificateIds.map(async (certId) => {
        try {
          const response = await axios.post(
            `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/api/courses/${params.courseId}/certificate/issue`,
            { certificateId: certId },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          return { success: true, certId, data: response.data };
        } catch (error: any) {
          console.error(
            `[REGENERATE] Failed to regenerate certificate ${certId}:`,
            error.message
          );
          return { success: false, certId, error: error.message };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: "Certificate regeneration completed",
      total: certificateIds.length,
      successful,
      failed,
      results: results.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { success: false, error: "unknown" }
      ),
    });
  } catch (error) {
    console.error("[CERTIFICATE_REGENERATE_ALL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
