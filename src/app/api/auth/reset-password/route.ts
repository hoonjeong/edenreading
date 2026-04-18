import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 비밀번호 초기화 (관리자: 이메일 + 전화번호로 본인 확인)
export async function POST(request: Request) {
  try {
    const { type, email, phone, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    if (type === "admin") {
      if (!email || !phone) {
        return NextResponse.json({ error: "이메일과 전화번호를 입력해주세요." }, { status: 400 });
      }

      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin || admin.phone !== phone.replace(/\D/g, "")) {
        return NextResponse.json({ error: "일치하는 계정을 찾을 수 없습니다." }, { status: 404 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: hashedPassword, loginFailCount: 0, lockedUntil: null },
      });

      return NextResponse.json({ message: "비밀번호가 초기화되었습니다." });
    }

    if (type === "parent") {
      if (!phone) {
        return NextResponse.json({ error: "전화번호를 입력해주세요." }, { status: 400 });
      }

      const cleanPhone = phone.replace(/\D/g, "");
      const parent = await prisma.parent.findUnique({ where: { phone: cleanPhone } });
      if (!parent || !parent.isSignedUp) {
        return NextResponse.json({ error: "일치하는 계정을 찾을 수 없습니다." }, { status: 404 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.parent.update({
        where: { id: parent.id },
        data: { password: hashedPassword, loginFailCount: 0, lockedUntil: null },
      });

      return NextResponse.json({ message: "비밀번호가 초기화되었습니다." });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
