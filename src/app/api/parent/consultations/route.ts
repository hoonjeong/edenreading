import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "parent") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { desiredDate, content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "상담 내용을 입력해주세요." }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({
      where: { phone: session.user.email },
      include: { children: true },
    });

    if (!parent) {
      return NextResponse.json({ error: "학부모 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 24시간 내 중복 요청 방지
    const recentRequest = await prisma.consultation.findFirst({
      where: {
        parentId: parent.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentRequest) {
      return NextResponse.json({ error: "24시간 이내에 이미 상담을 요청하셨습니다." }, { status: 400 });
    }

    const studentId = parent.children[0]?.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "연결된 자녀가 없습니다." }, { status: 400 });
    }

    await prisma.consultation.create({
      data: {
        parentId: parent.id,
        studentId,
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        content,
        status: "REQUESTED",
      },
    });

    return NextResponse.json({ message: "상담 요청이 접수되었습니다." });
  } catch (error) {
    console.error("Consultation create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
