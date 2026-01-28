import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

// Debug endpoint to test UploadThing video configuration
export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" }, 
        { status: 401 }
      );
    }

    // Test UploadThing configuration
    const config = {
      uploadThingToken: !!process.env.UPLOADTHING_TOKEN,
      uploadThingSecret: !!process.env.UPLOADTHING_SECRET,
      uploadThingAppId: !!process.env.UPLOADTHING_APP_ID,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    };

    console.log("[DEBUG] UploadThing config check:", config);

    return NextResponse.json({
      success: true,
      message: "UploadThing configuration check",
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG] UploadThing config error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}