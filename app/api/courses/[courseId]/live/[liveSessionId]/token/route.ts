import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// Generate Agora RTC Token for live streaming
export async function POST(
  req: Request,
  { params }: { params: { liveSessionId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelName, role } = await req.json();

    // Validate environment variables
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Agora credentials not configured");
      return new NextResponse(
        "Streaming service not configured. Please contact administrator.",
        { status: 500 }
      );
    }

    // Set token expiration time (24 hours)
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine user role (publisher for teacher, subscriber for student)
    const userRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Use userId as the unique identifier
    const uid = 0; // 0 means Agora will assign a random UID

    // Build token with UID and account
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      userRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({
      token,
      appId,
      channelName,
      uid: user.id, // Return user ID for client
    });
  } catch (error) {
    console.log("[AGORA_TOKEN_GENERATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
