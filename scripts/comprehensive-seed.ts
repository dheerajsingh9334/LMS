import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // 1. Create Categories
  console.log("📚 Creating categories...");
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Computer Science" },
      update: {},
      create: { name: "Computer Science" },
    }),
    prisma.category.upsert({
      where: { name: "Web Development" },
      update: {},
      create: { name: "Web Development" },
    }),
    prisma.category.upsert({
      where: { name: "Data Science" },
      update: {},
      create: { name: "Data Science" },
    }),
    prisma.category.upsert({
      where: { name: "Mobile Development" },
      update: {},
      create: { name: "Mobile Development" },
    }),
    prisma.category.upsert({
      where: { name: "Design" },
      update: {},
      create: { name: "Design" },
    }),
    prisma.category.upsert({
      where: { name: "Business" },
      update: {},
      create: { name: "Business" },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories\n`);

  // 2. Create Admin User
  console.log("👨‍💼 Creating admin user...");
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: {},
    create: {
      email: "admin@lms.com",
      name: "Admin User",
      password: hashedAdminPassword,
      role: "ADMIN",
      userType: "TEACHER",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Created admin: ${adminUser.email}\n`);

  // 3. Create Teachers/Instructors
  console.log("👨‍🏫 Creating instructors...");
  const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);
  
  const teachers = await Promise.all([
    prisma.user.upsert({
      where: { email: "john.doe@lms.com" },
      update: {},
      create: {
        email: "john.doe@lms.com",
        name: "John Doe",
        password: hashedTeacherPassword,
        role: "TEACHER",
        userType: "TEACHER",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=12",
      },
    }),
    prisma.user.upsert({
      where: { email: "sarah.wilson@lms.com" },
      update: {},
      create: {
        email: "sarah.wilson@lms.com",
        name: "Sarah Wilson",
        password: hashedTeacherPassword,
        role: "TEACHER",
        userType: "TEACHER",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=45",
      },
    }),
    prisma.user.upsert({
      where: { email: "mike.johnson@lms.com" },
      update: {},
      create: {
        email: "mike.johnson@lms.com",
        name: "Mike Johnson",
        password: hashedTeacherPassword,
        role: "TEACHER",
        userType: "TEACHER",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=33",
      },
    }),
    prisma.user.upsert({
      where: { email: "emma.davis@lms.com" },
      update: {},
      create: {
        email: "emma.davis@lms.com",
        name: "Emma Davis",
        password: hashedTeacherPassword,
        role: "TEACHER",
        userType: "TEACHER",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=47",
      },
    }),
  ]);

  // Also add them to Teacher model
  await Promise.all(
    teachers.map((teacher) =>
      prisma.teacher.upsert({
        where: { email: teacher.email! },
        update: {},
        create: { email: teacher.email! },
      })
    )
  );
  console.log(`✅ Created ${teachers.length} instructors\n`);

  // 4. Create Students
  console.log("👨‍🎓 Creating students...");
  const hashedStudentPassword = await bcrypt.hash("student123", 10);
  
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice.student@lms.com" },
      update: {},
      create: {
        email: "alice.student@lms.com",
        name: "Alice Brown",

        password: hashedStudentPassword,
        role: "USER",
        userType: "STUDENT",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=5",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob.student@lms.com" },
      update: {},
      create: {
        email: "bob.student@lms.com",
        name: "Bob Smith",

        password: hashedStudentPassword,
        role: "USER",
        userType: "STUDENT",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=11",
      },
    }),
    prisma.user.upsert({
      where: { email: "carol.student@lms.com" },
      update: {},
      create: {
        email: "carol.student@lms.com",
        name: "Carol Martinez",

        password: hashedStudentPassword,
        role: "USER",
        userType: "STUDENT",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=20",
      },
    }),
    prisma.user.upsert({
      where: { email: "david.student@lms.com" },
      update: {},
      create: {
        email: "david.student@lms.com",
        name: "David Lee",

        password: hashedStudentPassword,
        role: "USER",
        userType: "STUDENT",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=15",
      },
    }),
    prisma.user.upsert({
      where: { email: "eva.student@lms.com" },
      update: {},
      create: {
        email: "eva.student@lms.com",
        name: "Eva Garcia",

        password: hashedStudentPassword,
        role: "USER",
        userType: "STUDENT",
        emailVerified: new Date(),
        image: "https://i.pravatar.cc/150?img=23",
      },
    }),
  ]);
  console.log(`✅ Created ${students.length} students\n`);

  // 5. Create Courses
  console.log("📖 Creating courses...");
  
  // Course 1: Full Stack Web Development
  const course1 = await prisma.course.create({
    data: {
      userId: teachers[0].id,
      title: "Complete Full Stack Web Development Bootcamp 2024",
      description: "Master modern web development with React, Node.js, and MongoDB. Build real-world projects and become a full-stack developer.",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
      price: 4999,
      isPublished: true,
      isFree: false,
      categoryId: categories[1].id,
      learningOutcomes: [
        "Build full-stack web applications from scratch",
        "Master React.js for frontend development",
        "Create REST APIs with Node.js and Express",
        "Work with MongoDB and Mongoose",
        "Implement authentication and authorization",
        "Deploy applications to production",
      ],
      chapters: {
        create: [
          {
            title: "Introduction to Web Development",
            description: "Learn the fundamentals of web development and set up your development environment",
            position: 1,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=neuDUnWOpwI",
          },
          {
            title: "HTML & CSS Fundamentals",
            description: "Master HTML5 and CSS3 to create beautiful web pages",
            position: 2,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=mU6anWqZJcc",
          },
          {
            title: "JavaScript Essentials",
            description: "Learn JavaScript from basics to advanced concepts",
            position: 3,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
          },
          {
            title: "React.js Fundamentals",
            description: "Build modern UIs with React components and hooks",
            position: 4,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk",
          },
          {
            title: "Backend with Node.js",
            description: "Create powerful backend APIs with Node.js and Express",
            position: 5,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
          },
        ],
      },
      attachments: {
        create: [
          {
            name: "Course Syllabus.pdf",
            url: "https://example.com/syllabus.pdf",
          },
          {
            name: "Resource Links.pdf",
            url: "https://example.com/resources.pdf",
          },
        ],
      },
    },
  });

  // Course 2: Python Data Science
  const course2 = await prisma.course.create({
    data: {
      userId: teachers[1].id,
      title: "Python for Data Science & Machine Learning",
      description: "Learn Python, data analysis with Pandas, visualization with Matplotlib, and machine learning with scikit-learn.",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      price: 5499,
      isPublished: true,
      isFree: false,
      categoryId: categories[2].id,
      learningOutcomes: [
        "Master Python programming fundamentals",
        "Perform data analysis with Pandas and NumPy",
        "Create visualizations with Matplotlib and Seaborn",
        "Build machine learning models",
        "Work with real-world datasets",
        "Deploy ML models to production",
      ],
      chapters: {
        create: [
          {
            title: "Python Basics",
            description: "Introduction to Python programming",
            position: 1,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
          },
          {
            title: "NumPy & Pandas",
            description: "Data manipulation with NumPy and Pandas",
            position: 2,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=vmEHCJofslg",
          },
          {
            title: "Data Visualization",
            description: "Create stunning visualizations",
            position: 3,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=DAQNHzOcO5A",
          },
        ],
      },
    },
  });

  // Course 3: React Native Mobile Development
  const course3 = await prisma.course.create({
    data: {
      userId: teachers[2].id,
      title: "React Native - Build Mobile Apps for iOS & Android",
      description: "Create cross-platform mobile applications using React Native. One codebase for both iOS and Android.",
      imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
      price: 3999,
      isPublished: true,
      isFree: false,
      categoryId: categories[3].id,
      learningOutcomes: [
        "Build native mobile apps with JavaScript",
        "Use React Native components and APIs",
        "Implement navigation in mobile apps",
        "Work with device features (camera, location, etc.)",
        "Publish apps to App Store and Play Store",
      ],
      chapters: {
        create: [
          {
            title: "Getting Started with React Native",
            description: "Set up your development environment",
            position: 1,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=0-S5a0eXPoc",
          },
          {
            title: "React Native Components",
            description: "Learn core components and styling",
            position: 2,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=ur6I5m2nTvk",
          },
        ],
      },
    },
  });

  // Course 4: UI/UX Design Masterclass
  const course4 = await prisma.course.create({
    data: {
      userId: teachers[3].id,
      title: "UI/UX Design Masterclass - Figma & Adobe XD",
      description: "Learn user interface and user experience design. Master Figma and Adobe XD to create stunning designs.",
      imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
      price: 2999,
      isPublished: true,
      isFree: false,
      categoryId: categories[4].id,
      learningOutcomes: [
        "Understand UI/UX design principles",
        "Master Figma and Adobe XD",
        "Create wireframes and prototypes",
        "Design responsive interfaces",
        "Conduct user research and testing",
      ],
      chapters: {
        create: [
          {
            title: "Introduction to UI/UX",
            description: "Fundamentals of design thinking",
            position: 1,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
          },
          {
            title: "Figma Essentials",
            description: "Learn Figma from scratch",
            position: 2,
            isPublished: true,
            isFree: false,
            videoUrl: "https://www.youtube.com/watch?v=FTFaQWZBqQ8",
          },
        ],
      },
    },
  });

  // Course 5: Free Introduction to Programming
  const course5 = await prisma.course.create({
    data: {
      userId: teachers[0].id,
      title: "Introduction to Programming - Free Course",
      description: "Start your programming journey with this free beginner-friendly course. No prior experience required!",
      imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
      price: 0,
      isPublished: true,
      isFree: true,
      categoryId: categories[0].id,
      learningOutcomes: [
        "Understand programming fundamentals",
        "Learn problem-solving techniques",
        "Write your first programs",
        "Understand variables, loops, and functions",
      ],
      chapters: {
        create: [
          {
            title: "What is Programming?",
            description: "Introduction to programming concepts",
            position: 1,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=zOjov-2OZ0E",
          },
          {
            title: "Your First Program",
            description: "Write your first Hello World program",
            position: 2,
            isPublished: true,
            isFree: true,
            videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
          },
        ],
      },
    },
  });

  console.log(`✅ Created 5 courses with chapters\n`);

  // 6. Create Purchases (Students enrolling in courses)
  console.log("💳 Creating course purchases...");
  await Promise.all([
    // Alice purchases courses
    prisma.purchase.create({
      data: {
        userId: students[0].id,
        courseId: course1.id,
        amount: 4999,
        paymentStatus: "completed",
        stripeSessionId: `cs_test_alice_${Date.now()}_1`,
      },
    }),
    prisma.purchase.create({
      data: {
        userId: students[0].id,
        courseId: course2.id,
        amount: 5499,
        paymentStatus: "completed",
        stripeSessionId: `cs_test_alice_${Date.now()}_2`,
      },
    }),
    // Bob purchases courses
    prisma.purchase.create({
      data: {
        userId: students[1].id,
        courseId: course1.id,
        amount: 4999,
        paymentStatus: "completed",
        stripeSessionId: `cs_test_bob_${Date.now()}_1`,
      },
    }),
    prisma.purchase.create({
      data: {
        userId: students[1].id,
        courseId: course3.id,
        amount: 3999,
        paymentStatus: "completed",
        stripeSessionId: `cs_test_bob_${Date.now()}_2`,
      },
    }),
    // Carol purchases courses
    prisma.purchase.create({
      data: {
        userId: students[2].id,
        courseId: course2.id,
        amount: 5499,
        paymentStatus: "completed",
        stripeSessionId: `cs_test_carol_${Date.now()}_1`,
      },
    }),
    prisma.purchase.create({
      data: {
        userId: students[2].id,
        courseId: course4.id,
        amount: 2999,
        paymentStatus: "completed",
        stripeSessionId: `cs_test_carol_${Date.now()}_2`,
      },
    }),
  ]);
  console.log("✅ Created course purchases\n");

  // 7. Create Course Ratings
  console.log("⭐ Creating course ratings...");
  await Promise.all([
    prisma.courseRating.create({
      data: {
        userId: students[0].id,
        courseId: course1.id,
        rating: 5,
        review: "Excellent course! Very comprehensive and well-structured. The instructor explains everything clearly.",
      },
    }),
    prisma.courseRating.create({
      data: {
        userId: students[1].id,
        courseId: course1.id,
        rating: 4,
        review: "Great content, but could use more practical projects. Overall very satisfied!",
      },
    }),
    prisma.courseRating.create({
      data: {
        userId: students[2].id,
        courseId: course2.id,
        rating: 5,
        review: "Best data science course I've taken! The projects are really practical and relevant.",
      },
    }),
    prisma.courseRating.create({
      data: {
        userId: students[0].id,
        courseId: course2.id,
        rating: 5,
        review: "Amazing instructor! Made complex ML concepts easy to understand.",
      },
    }),
  ]);
  console.log("✅ Created course ratings\n");

  // 8. Create Watch Later and Favorites
  console.log("❤️ Creating watch later and favorites...");
  await Promise.all([
    prisma.watchLater.create({
      data: {
        userId: students[3].id,
        courseId: course3.id,
      },
    }),
    prisma.watchLater.create({
      data: {
        userId: students[4].id,
        courseId: course4.id,
      },
    }),
    prisma.favoriteCourse.create({
      data: {
        userId: students[0].id,
        courseId: course1.id,
      },
    }),
    prisma.favoriteCourse.create({
      data: {
        userId: students[1].id,
        courseId: course1.id,
      },
    }),
  ]);
  console.log("✅ Created watch later and favorites\n");

  console.log("🎉 Database seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log("   - Categories: 6");
  console.log("   - Admin Users: 1");
  console.log("   - Instructors: 4");
  console.log("   - Students: 5");
  console.log("   - Courses: 5");
  console.log("   - Purchases: 6");
  console.log("   - Ratings: 4");
  console.log("\n🔐 Login Credentials:");
  console.log("   Admin: admin@lms.com / admin123");
  console.log("   Teacher: john.doe@lms.com / teacher123");
  console.log("   Student: alice.student@lms.com / student123");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
