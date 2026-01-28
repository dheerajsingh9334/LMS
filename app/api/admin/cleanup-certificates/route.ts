import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import path from "path";
import { promises as fs } from "fs";

// API route for admins to clean up old certificate files from local uploads
export async function DELETE() {
  try {
    const role = await currentRole();

    if (role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    try {
      const files = await fs.readdir(uploadsDir);
      const certificateFiles = files.filter(file => 
        file.startsWith("certificate-") && file.endsWith(".pdf")
      );

      let deletedCount = 0;
      for (const file of certificateFiles) {
        try {
          await fs.unlink(path.join(uploadsDir, file));
          deletedCount++;
        } catch (unlinkError) {
          console.warn(`Failed to delete ${file}:`, unlinkError);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedCount} certificate files`,
        deletedCount,
      });
    } catch (readError) {
      // Directory might not exist, that's fine
      return NextResponse.json({
        success: true,
        message: "No uploads directory found or already clean",
        deletedCount: 0,
      });
    }
  } catch (error) {
    console.error("[CERTIFICATE_CLEANUP] Error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup certificates" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const role = await currentRole();

    if (role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    try {
      const files = await fs.readdir(uploadsDir);
      const certificateFiles = files.filter(file => 
        file.startsWith("certificate-") && file.endsWith(".pdf")
      );

      const fileDetails = await Promise.all(
        certificateFiles.map(async (file) => {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        })
      );

      return NextResponse.json({
        totalFiles: certificateFiles.length,
        totalSize: fileDetails.reduce((sum, file) => sum + file.size, 0),
        files: fileDetails,
      });
    } catch (readError) {
      return NextResponse.json({
        totalFiles: 0,
        totalSize: 0,
        files: [],
      });
    }
  } catch (error) {
    console.error("[CERTIFICATE_CLEANUP_INFO] Error:", error);
    return NextResponse.json(
      { error: "Failed to get cleanup info" },
      { status: 500 }
    );
  }
}