import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "parent") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({
      where: { phone: session.user.email },
    });

    if (!parent || !parent.password) {
      return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, parent.password);
    if (!isValid) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.parent.update({
      where: { id: parent.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
