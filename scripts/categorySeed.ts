const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
  try {
    await database.category.createMany({
      data: [
        // Engineering Categories
        { name: "Biotechnology" },
        { name: "Chemical Engineering" },
        { name: "Civil Engineering" },
        { name: "Computer Science and Engineering" },
        { name: "Electronics and Communication Engineering" },
        { name: "Electrical Engineering" },
        { name: "Industrial and Production Engineering" },
        { name: "Information Technology" },
        { name: "Instrumentation and Control Engineering" },
        { name: "Mechanical Engineering" },
        { name: "Textile Technology" },
        
        // Programming & Development
        { name: "Web Development" },
        { name: "Mobile App Development" },
        { name: "Game Development" },
        { name: "Data Science" },
        { name: "Machine Learning & AI" },
        { name: "Cloud Computing" },
        { name: "Cybersecurity" },
        { name: "DevOps" },
        { name: "Blockchain" },
        
        // Design
        { name: "Graphic Design" },
        { name: "UI/UX Design" },
        { name: "3D Modeling & Animation" },
        { name: "Video Editing" },
        
        // Business & Marketing
        { name: "Business Management" },
        { name: "Digital Marketing" },
        { name: "Entrepreneurship" },
        { name: "Finance & Accounting" },
        { name: "Sales" },
        { name: "Project Management" },
        
        // Mathematics & Science
        { name: "Mathematics" },
        { name: "Physics" },
        { name: "Chemistry" },
        { name: "Biology" },
        { name: "Statistics" },
        
        // Languages
        { name: "English Language" },
        { name: "Foreign Languages" },
        { name: "Communication Skills" },
        
        // Arts & Humanities
        { name: "Music" },
        { name: "Photography" },
        { name: "Creative Writing" },
        { name: "History" },
        { name: "Philosophy" },
        
        // Personal Development
        { name: "Leadership" },
        { name: "Productivity" },
        { name: "Health & Fitness" },
        { name: "Lifestyle" },
        
        // Test Preparation
        { name: "Competitive Exams" },
        { name: "Entrance Tests" },
        
        // Other
        { name: "Other" },
      ]
    });

    console.log("Success");
  } catch (error) {
    console.log("Error seeding the database categories", error);
  } finally {
    await database.$disconnect();
  }
}

main();