import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async (request) => {
  const url = new URL(request.url);
  const month = url.searchParams.get("month"); // YYYY-MM

  if (!month) return NextResponse.json({ error: "월을 선택해주세요." }, { status: 400 });

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 0, 23, 59, 59);

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const stats: Record<string, { present: number; tardy: number; absent: number; total: number }> = {};

  for (const att of attendances) {
    const dateKey = new Date(att.date).toISOString().split("T")[0];
    if (!stats[dateKey]) stats[dateKey] = { present: 0, tardy: 0, absent: 0, total: 0 };
    stats[dateKey].total++;
    if (att.status === "PRESENT") stats[dateKey].present++;
    else if (att.status === "TARDY") stats[dateKey].tardy++;
    else if (att.status === "ABSENT") stats[dateKey].absent++;
  }

  return NextResponse.json(stats);
});
