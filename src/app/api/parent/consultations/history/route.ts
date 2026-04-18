import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/route-middleware";

export const GET = requireParent(async (_request, _ctx, session) => {
  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
  });

  if (!parent) return NextResponse.json([]);

  const consultations = await prisma.consultation.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      desiredDate: true,
      content: true,
      status: true,
      scheduledAt: true,
      summary: true,
      createdAt: true,
    },
  });

  return NextResponse.json(consultations);
});
