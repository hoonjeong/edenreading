import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_request, { params }: IdCtx) => {
  const { id } = await params;

  const exam = await prisma.examSession.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { questionNo: "asc" } },
      examinees: {
        include: { student: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "시험을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(exam);
});
