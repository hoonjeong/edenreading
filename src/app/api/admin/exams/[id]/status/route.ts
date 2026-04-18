import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const PUT = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;
  const { status } = await request.json();

  await prisma.examSession.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ message: "상태가 변경되었습니다." });
});
