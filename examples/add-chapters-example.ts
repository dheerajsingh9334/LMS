// Example: How to add chapters to a course programmatically
// This demonstrates using the existing chapter creation API

async function addChaptersToCourse(courseId: string, chapters: string[]) {
  try {
    const createdChapters = [];
    
    for (const chapterTitle of chapters) {
      const response = await fetch(`/api/courses/${courseId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: chapterTitle
        })
      });
      
      if (response.ok) {
        const chapter = await response.json();
        createdChapters.push(chapter);
        console.log(`✅ Created chapter: ${chapterTitle}`);
      } else {
        console.error(`❌ Failed to create chapter: ${chapterTitle}`);
      }
    }
    
    return createdChapters;
  } catch (error) {
    console.error('Error creating chapters:', error);
    throw error;
  }
}

// Example usage:
const sampleChapters = [
  "Introduction to the Course",
  "Basic Concepts",
  "Advanced Topics", 
  "Practical Examples",
  "Final Project"
];

// Add chapters to course with ID "your-course-id"
addChaptersToCourse("your-course-id", sampleChapters)
  .then(chapters => {
    console.log(`Successfully created ${chapters.length} chapters!`);
  })
  .catch(error => {
    console.error('Failed to create chapters:', error);
  });

// The system automatically:
// - Assigns position numbers (1, 2, 3, etc.)
// - Prevents duplicate titles
// - Validates user permissions
// - Returns the created chapter with ID for further editing