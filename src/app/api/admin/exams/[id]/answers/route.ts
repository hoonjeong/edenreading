import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const examineeId = url.searchParams.get("examineeId");

  if (!examineeId) {
    return NextResponse.json({ error: "응시자 ID가 필요합니다." }, { status: 400 });
  }

  const answers = await prisma.studentAnswer.findMany({
    where: { examineeId },
  });

  return NextResponse.json(answers);
}
