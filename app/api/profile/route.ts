import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    // Convert dateOfBirth string to Date if provided
    if (values.dateOfBirth) {
      values.dateOfBirth = new Date(values.dateOfBirth);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: values,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PROFILE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userProfile = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        userType: true,
        dateOfBirth: true,
        gender: true,
        headline: true,
        bio: true,
        achievements: true,
        socialLinks: true,
      },
    });

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
