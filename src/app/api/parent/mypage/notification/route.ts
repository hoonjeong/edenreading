import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

export const PUT = requireParent(async (request, _ctx, session) => {
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
    return handleApiError(error, "Notification settings error");
  }
});
