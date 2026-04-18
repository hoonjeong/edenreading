import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async () => {
  const consultations = await prisma.consultation.findMany({
    include: { parent: true, student: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(consultations);
});
