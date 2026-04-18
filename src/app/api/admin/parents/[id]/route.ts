import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAuthCode } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;
  const parent = await prisma.parent.findUnique({
    where: { id },
    include: { children: { include: { student: true } } },
  });

  if (!parent) {
    return NextResponse.json({ error: "학부모를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(parent);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { name, phone, email, memo } = await request.json();

    // 전화번호 중복 체크
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const existing = await prisma.parent.findFirst({
        where: { phone: cleanPhone, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "이미 등록된 전화번호입니다." }, { status: 400 });
      }
    }

    const parent = await prisma.parent.update({
      where: { id },
      data: {
        name,
        phone: phone ? phone.replace(/\D/g, "") : undefined,
        email: email || null,
        memo: memo || null,
      },
    });

    return NextResponse.json(parent);
  } catch (error) {
    console.error("Parent update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.parent.delete({ where: { id } });
    return NextResponse.json({ message: "학부모가 삭제되었습니다." });
  } catch (error) {
    console.error("Parent delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// 인증코드 재발송
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (action === "resend-code") {
    const parent = await prisma.parent.findUnique({ where: { id } });
    if (!parent) {
      return NextResponse.json({ error: "학부모를 찾을 수 없습니다." }, { status: 404 });
    }
    if (parent.isSignedUp) {
      return NextResponse.json({ error: "이미 가입이 완료된 학부모입니다." }, { status: 400 });
    }

    let authCode: string;
    let attempts = 0;
    do {
      authCode = generateAuthCode();
      const exists = await prisma.parent.findUnique({ where: { authCode } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    await prisma.parent.update({
      where: { id },
      data: {
        authCode,
        authCodeExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ authCode });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}
