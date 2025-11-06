import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: Request,
) {
  try {
    const user = await currentUser();
    let userId = user?.id ?? "";

    console.log(user?.role)
    
    const { title } = await req.json();

    if (!user || user?.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check for duplicate course title for this user
    const existingCourse = await db.course.findFirst({
      where: {
        userId,
        title: {
          equals: title,
          mode: 'insensitive', // Case-insensitive comparison
        }
      }
    });

    if (existingCourse) {
      return new NextResponse("A course with this title already exists", { status: 409 });
    }

    const course = await db.course.create({
      data: {
        userId,
        title,
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}