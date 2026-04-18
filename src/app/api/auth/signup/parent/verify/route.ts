import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { authCode } = await request.json();

    if (!authCode || authCode.length !== 6) {
      return NextResponse.json({ error: "유효하지 않은 인증코드입니다." }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({
      where: { authCode: authCode.toUpperCase() },
    });

    if (!parent) {
      return NextResponse.json({ error: "존재하지 않는 인증코드입니다." }, { status: 400 });
    }

    if (parent.isSignedUp) {
      return NextResponse.json({ error: "이미 사용된 인증코드입니다." }, { status: 400 });
    }

    if (parent.authCodeExpiresAt && parent.authCodeExpiresAt < new Date()) {
      return NextResponse.json({ error: "만료된 인증코드입니다. 교육원에 문의해주세요." }, { status: 400 });
    }

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        phone: parent.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-****-$3"),
      },
    });
  } catch (error) {
    console.error("Parent verify error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
