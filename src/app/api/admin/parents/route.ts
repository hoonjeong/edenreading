import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAuthCode } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const parents = await prisma.parent.findMany({
    include: { children: { include: { student: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(parents);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { name, phone, email, memo } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "이름과 전화번호는 필수입니다." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const existing = await prisma.parent.findUnique({ where: { phone: cleanPhone } });
    if (existing) {
      return NextResponse.json({ error: "이미 등록된 전화번호입니다." }, { status: 400 });
    }

    // 고유 인증코드 생성
    let authCode: string;
    let attempts = 0;
    do {
      authCode = generateAuthCode();
      const exists = await prisma.parent.findUnique({ where: { authCode } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    const parent = await prisma.parent.create({
      data: {
        name,
        phone: cleanPhone,
        email: email || null,
        memo: memo || null,
        authCode,
        authCodeExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
      },
    });

    return NextResponse.json({
      id: parent.id,
      name: parent.name,
      authCode: parent.authCode,
    });
  } catch (error) {
    console.error("Parent create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
