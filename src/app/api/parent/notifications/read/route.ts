import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/route-middleware";

export const POST = requireParent(async (_request, _ctx, session) => {
  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
  });

  if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.updateMany({
    where: { parentId: parent.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "ok" });
});
