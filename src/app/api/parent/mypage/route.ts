import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

export const GET = requireParent(async (_request, _ctx, session) => {
  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    select: {
      name: true,
      phone: true,
      email: true,
      notifyKakao: true,
      notifySms: true,
      notifyPush: true,
      children: {
        include: { student: { select: { name: true, grade: true } } },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "정보를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(parent);
});

export const PUT = requireParent(async (request, _ctx, session) => {
  try {
    const { phone, email } = await request.json();

    // 전화번호 중복 체크
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const existing = await prisma.parent.findFirst({
        where: { phone: cleanPhone, NOT: { phone: session.user.email } },
      });
      if (existing) {
        return NextResponse.json({ error: "이미 사용 중인 전화번호입니다." }, { status: 400 });
      }
    }

    await prisma.parent.update({
      where: { phone: session.user.email },
      data: {
        phone: phone ? phone.replace(/\D/g, "") : undefined,
        email: email || null,
      },
    });

    return NextResponse.json({ message: "정보가 수정되었습니다." });
  } catch (error) {
    return handleApiError(error, "Parent mypage update error");
  }
});
