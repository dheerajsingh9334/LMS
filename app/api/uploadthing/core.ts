import { createUploadthing, type FileRouter } from "uploadthing/next";

import { currentUser } from "@/lib/auth";
 
const f = createUploadthing();
 
const handleAuth = async () => {
  try {
    const user = await currentUser();
    let userId = user?.id ?? "";
    console.log("[UploadThing] Auth check:", { 
      userId, 
      hasUser: !!user,
      timestamp: new Date().toISOString(),
      userAgent: process.env.NODE_ENV 
    });
    
    if (!userId) {
      console.error("[UploadThing] Auth failed: No user ID");
      throw new Error("Unauthorized - Please log in");
    }
    return { userId };
  } catch (error) {
    console.error("[UploadThing] Auth error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Course image upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Course image upload completed:", res.file?.name);
    }),
  
  courseAttachment: f([
    "pdf",
    "application/vnd.ms-excel", 
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "image",
    "video",
    "audio",
  ])
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Course attachment upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Course attachment upload completed:", res.file?.name);
    }),
  
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: "1GB" } })
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Chapter video upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Chapter video upload completed:", {
        fileKey: res.file?.key,
        fileName: res.file?.name,
        fileSize: res.file?.size,
        url: res.file?.url
      });
    }),
  
  noteFile: f(["text", "image", "video", "audio", "pdf"])
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Note file upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Note file upload completed:", res.file?.name);
    }),
  
  assignmentQuestion: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Assignment question upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Assignment question upload completed:", res.file?.name);
    }),
  
  assignmentSubmission: f(["pdf", "text", "image", "blob", "video", "audio"])
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Assignment submission upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Assignment submission upload completed:", res.file?.name);
    }),
  
  certificateTemplate: f(["image", "pdf"])
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Certificate template upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Certificate template upload completed:", res.file?.name);
    }),
  
  certificatePdf: f({ pdf: { maxFileSize: "10MB", maxFileCount: 1 } })
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Certificate PDF upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Certificate PDF upload completed:", res.file?.name);
    }),
  
  promoVideo: f({ video: { maxFileCount: 1, maxFileSize: "256MB" } })
    .middleware(async () => {
      const result = await handleAuth();
      console.log("[UploadThing] Promo video upload authorized:", result);
      return result;
    })
    .onUploadComplete((res) => {
      console.log("[UploadThing] Promo video upload completed:", {
        fileKey: res.file?.key,
        fileName: res.file?.name,
        fileSize: res.file?.size,
        url: res.file?.url
      });
    })
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;