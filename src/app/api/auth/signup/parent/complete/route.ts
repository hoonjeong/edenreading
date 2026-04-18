import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const { authCode, password } = await request.json();

    if (!authCode || !password || password.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({
      where: { authCode: authCode.toUpperCase() },
    });

    if (!parent || parent.isSignedUp) {
      return NextResponse.json({ error: "유효하지 않은 인증코드입니다." }, { status: 400 });
    }

    if (parent.authCodeExpiresAt && parent.authCodeExpiresAt < new Date()) {
      return NextResponse.json({ error: "만료된 인증코드입니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.parent.update({
      where: { id: parent.id },
      data: {
        password: hashedPassword,
        isSignedUp: true,
        authCode: null,
        authCodeExpiresAt: null,
      },
    });

    return NextResponse.json({ message: "가입이 완료되었습니다." });
  } catch (error) {
    return handleApiError(error, "Parent complete signup error");
  }
}
