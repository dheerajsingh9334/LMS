import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      role: user.role,
      userType: user.userType,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.log("[CHECK_ROLE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
