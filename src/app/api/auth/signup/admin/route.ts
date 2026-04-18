import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, role } = await request.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 첫 번째 원장은 자동 승인
    const adminCount = await prisma.admin.count();
    const isFirstDirector = adminCount === 0 && role === "DIRECTOR";

    await prisma.admin.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || "TEACHER",
        isApproved: isFirstDirector,
      },
    });

    return NextResponse.json({
      message: isFirstDirector
        ? "원장 계정이 생성되었습니다."
        : "계정이 생성되었습니다. 원장의 승인 후 이용 가능합니다.",
    });
  } catch (error) {
    return handleApiError(error, "Admin signup error");
  }
}
