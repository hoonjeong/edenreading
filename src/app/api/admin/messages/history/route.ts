import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async (request, _ctx, session) => {
  const { searchParams } = new URL(request.url);
  const mineOnly = searchParams.get("mine") === "true";
  const take = Math.min(Number(searchParams.get("take") || 30), 100);

  const messages = await prisma.message.findMany({
    where: mineOnly ? { adminId: session.user.id } : {},
    orderBy: { sentAt: "desc" },
    take,
    select: {
      id: true,
      channel: true,
      msgType: true,
      title: true,
      content: true,
      sentAt: true,
      recipientCount: true,
      successCount: true,
      failCount: true,
      resultCode: true,
      resultMessage: true,
      testMode: true,
    },
  });

  return NextResponse.json(messages);
});
