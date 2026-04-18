import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type ExamineeCtx = { params: Promise<{ id: string; examineeId: string }> };

export const PUT = requireAdmin(async (request, { params }: ExamineeCtx) => {
  const { examineeId } = await params;
  const { isAbsent } = await request.json();

  await prisma.examinee.update({
    where: { id: examineeId },
    data: {
      isAbsent,
      totalScore: isAbsent ? null : undefined,
    },
  });

  return NextResponse.json({ message: "처리되었습니다." });
});
