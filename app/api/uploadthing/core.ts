import { createUploadthing, type FileRouter } from "uploadthing/next";

import { currentUser } from "@/lib/auth";
 
const f = createUploadthing();
 
const handleAuth = async () => {
  try {
    const user = await currentUser();
    let userId = user?.id ?? "";
    console.log("UploadThing auth check:", { userId, hasUser: !!user });
    
    if (!userId) throw new Error("Unauthorized");
    return { userId };
  } catch (error) {
    console.error("UploadThing auth error:", error);
    throw error;
  }
}

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  courseAttachment: f([
    "pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    // Allow images and videos for richer course attachments
    "image",
    "video",
    // allow common audio types as well
    "audio",
  ])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: "512GB" } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  noteFile: f(["text", "image", "video", "audio", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  assignmentQuestion: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  assignmentSubmission: f(["pdf", "text", "image", "blob", "video", "audio"])
    .middleware(() => handleAuth())
    .onUploadComplete((opts) => {
      console.log("Assignment file uploaded:", opts);
    }),
  certificateTemplate: f(["image", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  promoVideo: f({ video: { maxFileCount: 1, maxFileSize: "256MB" } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {})
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;