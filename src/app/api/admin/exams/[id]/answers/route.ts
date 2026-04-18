import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async (request) => {
  const url = new URL(request.url);
  const examineeId = url.searchParams.get("examineeId");

  if (!examineeId) {
    return NextResponse.json({ error: "응시자 ID가 필요합니다." }, { status: 400 });
  }

  const answers = await prisma.studentAnswer.findMany({
    where: { examineeId },
  });

  return NextResponse.json(answers);
});
