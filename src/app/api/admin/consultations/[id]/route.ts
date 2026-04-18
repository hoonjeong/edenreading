import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

type IdCtx = { params: Promise<{ id: string }> };

export const PUT = requireAdmin(async (request, { params }: IdCtx, session) => {
  const { id } = await params;

  try {
    const { status, scheduledAt, summary, adminMemo } = await request.json();

    const consultation = await prisma.consultation.update({
      where: { id },
      data: {
        status: status || undefined,
        adminId: session.user.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        summary: summary || undefined,
        adminMemo: adminMemo || undefined,
      },
      include: { parent: true, student: true },
    });

    // 일정 확정 시 학부모 알림
    if (status === "SCHEDULED") {
      await prisma.notification.create({
        data: {
          parentId: consultation.parentId,
          type: "CONSULTATION",
          title: "상담 일정이 확정되었습니다",
          content: scheduledAt
            ? `${new Date(scheduledAt).toLocaleString("ko-KR")}에 상담이 예정되었습니다.`
            : "상담 일정이 확정되었습니다. 교육원에 문의해주세요.",
        },
      });
    }

    return NextResponse.json(consultation);
  } catch (error) {
    return handleApiError(error, "Consultation update error");
  }
});
