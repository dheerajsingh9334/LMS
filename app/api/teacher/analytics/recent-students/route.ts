import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user: any = await currentUser();
    const id = user?.id ?? "";

    if (!id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get teacher's course IDs first
    const teacherCourses = await db.course.findMany({
      where: { userId: id },
      select: { id: true },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({ recentStudents: [] });
    }

    // Fetch the last 5 purchases for the teacher's courses
    const recentPurchases = await db.purchase.findMany({
      where: {
        courseId: { in: courseIds },
        paymentStatus: "completed",
      },
      include: {
        course: {
          select: { title: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    if (recentPurchases.length === 0) {
      return NextResponse.json({ recentStudents: [] });
    }

    // Fetch user details for purchasers
    const userIds = [...new Set(recentPurchases.map((p) => p.userId))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    const userMap = new Map(
      users.map((u) => [u.id, { name: u.name, image: u.image }]),
    );

    const transformedStudents = recentPurchases.map((purchase) => ({
      name: userMap.get(purchase.userId)?.name || "Unknown",
      courseTitle: purchase.course?.title || "Unknown Course",
      date: purchase.createdAt.toISOString().split("T")[0],
      image: userMap.get(purchase.userId)?.image || "",
    }));

    return NextResponse.json({ recentStudents: transformedStudents });
  } catch (error) {
    console.error("[FETCH RECENT STUDENTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
