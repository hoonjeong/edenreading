import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "parent") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { kakao, sms, push } = await request.json();

    await prisma.parent.update({
      where: { phone: session.user.email },
      data: {
        notifyKakao: kakao ?? true,
        notifySms: sms ?? true,
        notifyPush: push ?? true,
      },
    });

    return NextResponse.json({ message: "알림 설정이 저장되었습니다." });
  } catch (error) {
    console.error("Notification settings error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
