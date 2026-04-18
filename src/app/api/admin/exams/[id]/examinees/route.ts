import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { studentIds } = await request.json();

    for (const studentId of studentIds) {
      const existing = await prisma.examinee.findUnique({
        where: { examSessionId_studentId: { examSessionId: id, studentId } },
      });
      if (!existing) {
        await prisma.examinee.create({
          data: { examSessionId: id, studentId },
        });
      }
    }

    return NextResponse.json({ message: "응시자가 추가되었습니다." });
  } catch (error) {
    console.error("Add examinees error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
