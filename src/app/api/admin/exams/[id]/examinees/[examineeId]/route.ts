import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; examineeId: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

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
}
