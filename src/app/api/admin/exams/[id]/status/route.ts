import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  await prisma.examSession.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ message: "상태가 변경되었습니다." });
}
