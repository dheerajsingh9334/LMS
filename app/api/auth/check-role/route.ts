import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      userType: user.userType,
      role: user.role,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.log("[CHECK_ROLE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
