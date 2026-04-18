import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/route-middleware";

export const GET = requireParent(async (_request, _ctx, session) => {
  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
  });

  if (!parent) return NextResponse.json([]);

  const notifications = await prisma.notification.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
});
