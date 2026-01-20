import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

type RangeOption = "7d" | "30d" | "12m";

function getStartDate(range: RangeOption): Date {
  const now = new Date();
  const start = new Date(now);

  if (range === "7d") {
    start.setDate(start.getDate() - 7);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 30);
  } else if (range === "12m") {
    start.setFullYear(start.getFullYear() - 1);
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") as RangeOption | null;
    const range: RangeOption =
      rangeParam === "7d" || rangeParam === "12m" ? rangeParam : "30d";

    const startDate = getStartDate(range);

    const purchases = await db.purchase.findMany({
      where: {
        paymentStatus: "completed",
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const buckets: Record<
      string,
      {
        period: string;
        revenue: number;
        enrollments: number;
        signups: number;
      }
    > = {};

    purchases.forEach((purchase) => {
      const createdAt = new Date(purchase.createdAt);
      const key = getDayKey(createdAt);
      if (!buckets[key]) {
        buckets[key] = {
          period: key,
          revenue: 0,
          enrollments: 0,
          signups: 0,
        };
      }
      buckets[key].revenue += purchase.amount || 0;
      buckets[key].enrollments += 1;
    });

    const points = Object.values(buckets).sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    return NextResponse.json({ points, range });
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_TIMESERIES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
