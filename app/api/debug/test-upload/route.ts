import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { uploadPdfToUT } from "@/lib/uploadthing-server";

// Test endpoint to verify UploadThing configuration
export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create a simple test PDF buffer
    const testPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000101 00000 n
0000000188 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
284
%%EOF`;

    const testBuffer = Buffer.from(testPdfContent);
    const filename = `test-${Date.now()}.pdf`;

    console.log("[TEST_UPLOAD] Testing UploadThing with test PDF");
    
    const uploadedUrl = await uploadPdfToUT(testBuffer, filename);
    
    return NextResponse.json({
      success: true,
      message: "UploadThing test successful",
      uploadedUrl,
      testDetails: {
        filename,
        bufferSize: testBuffer.length,
        uploadThingSecret: !!process.env.UPLOADTHING_SECRET,
        uploadThingAppId: !!process.env.UPLOADTHING_APP_ID,
      }
    });
  } catch (error) {
    console.error("[TEST_UPLOAD] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        uploadThingSecret: !!process.env.UPLOADTHING_SECRET,
        uploadThingAppId: !!process.env.UPLOADTHING_APP_ID,
      },
      { status: 500 }
    );
  }
}