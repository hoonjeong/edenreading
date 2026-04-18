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
}
