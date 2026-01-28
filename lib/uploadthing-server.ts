import { UTApi } from "uploadthing/server";

// Server-side UploadThing API client
const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
});

/**
 * Upload a PDF buffer to UploadThing programmatically from server-side
 */
export async function uploadPdfToUT(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    console.log("[UPLOADTHING] Starting upload...", { filename, bufferSize: pdfBuffer.length });
    
    if (!process.env.UPLOADTHING_TOKEN && !process.env.UPLOADTHING_SECRET) {
      throw new Error("UPLOADTHING_TOKEN or UPLOADTHING_SECRET environment variable is not set");
    }

    // Convert buffer to File-like object
    const file = new File([pdfBuffer], filename, {
      type: "application/pdf",
    });

    console.log("[UPLOADTHING] Created file object:", { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // Upload to UploadThing
    const response = await utapi.uploadFiles([file]);
    
    console.log("[UPLOADTHING] Upload response:", response);
    
    if (response[0]?.data?.url) {
      const url = response[0].data.url;
      console.log("[UPLOADTHING] Upload successful:", url);
      return url;
    } else if (response[0]?.error) {
      throw new Error(`UploadThing error: ${response[0].error.message || 'Unknown error'}`);
    } else {
      throw new Error("Upload failed: No URL returned");
    }
  } catch (error) {
    console.error("[UPLOADTHING] Upload error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filename,
      bufferSize: pdfBuffer?.length || 0
    });
    throw new Error(`Failed to upload PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}