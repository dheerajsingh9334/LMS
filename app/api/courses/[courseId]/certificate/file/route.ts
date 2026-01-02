import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const certificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
      select: {
        certificateUrl: true,
      },
    });

    if (!certificate?.certificateUrl) {
      return new NextResponse("Certificate asset not found", { status: 404 });
    }

    const certificateUrl = certificate.certificateUrl;

    // Check if it's a relative path (starts with /)
    if (certificateUrl.startsWith("/")) {
      // Serve from local filesystem
      const filePath = path.join(process.cwd(), "public", certificateUrl);

      try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();

        let contentType = "application/octet-stream";
        if (ext === ".pdf") contentType = "application/pdf";
        else if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": "inline",
            "Cache-Control": "no-cache",
          },
        });
      } catch (fsError) {
        console.error("[CERT_FILE] Local file not found:", filePath, fsError);
        return new NextResponse("Certificate file not found on server", {
          status: 404,
        });
      }
    }

    // If it's a full URL, fetch and proxy it
    const assetRes = await fetch(certificateUrl, {
      headers: {
        Accept: "*/*",
      },
    });

    if (!assetRes.ok) {
      const text = await assetRes.text().catch(() => "");
      console.error(
        "[CERT_FILE] Upstream fetch failed:",
        assetRes.status,
        text
      );
      return new NextResponse("Failed to retrieve certificate asset", {
        status: 502,
      });
    }

    const contentType =
      assetRes.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      assetRes.headers.get("content-disposition") || "inline";
    const bytes = await assetRes.arrayBuffer();

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[CERTIFICATE_FILE_GET] Error:", error);
    return new NextResponse(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
