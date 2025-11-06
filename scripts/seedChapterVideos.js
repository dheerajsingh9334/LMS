const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedChapterVideos() {
  try {
    // Find all published chapters
    const chapters = await prisma.chapter.findMany({
      where: {
        isPublished: true,
      },
    });

    console.log(`Found ${chapters.length} chapters`);

    for (const chapter of chapters) {
      // Add sample videos for each chapter
      const videos = [
        {
          title: "Introduction Video",
          videoUrl: "https://example.com/video1.mp4",
          duration: 300, // 5 minutes
          position: 1,
          chapterId: chapter.id,
        },
        {
          title: "How Things Work",
          videoUrl: "https://example.com/video2.mp4", 
          duration: 480, // 8 minutes
          position: 2,
          chapterId: chapter.id,
        },
        {
          title: "Second Video",
          videoUrl: "https://example.com/video3.mp4",
          duration: 720, // 12 minutes
          position: 3,
          chapterId: chapter.id,
        }
      ];

      // Check if videos already exist for this chapter
      const existingVideos = await prisma.chapterVideo.findMany({
        where: {
          chapterId: chapter.id,
        },
      });

      if (existingVideos.length === 0) {
        // Create the videos
        await prisma.chapterVideo.createMany({
          data: videos,
        });
        
        console.log(`Added ${videos.length} videos to chapter: ${chapter.title}`);
      } else {
        console.log(`Chapter ${chapter.title} already has ${existingVideos.length} videos`);
      }
    }

    console.log('Successfully seeded chapter videos!');
  } catch (error) {
    console.error('Error seeding chapter videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedChapterVideos();