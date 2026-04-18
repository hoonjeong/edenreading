import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";
import { getStudentWithParents } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_request, { params }: IdCtx) => {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      student: true,
      admin: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "활동을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(activity);
});

export const PUT = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    const { title, content, activityDate, isDraft, isShared, media, notifySms } =
      await request.json();

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "활동을 찾을 수 없습니다." }, { status: 404 });
    }

    // 공유 후 수정 시 isEdited 플래그
    const wasShared = existing.isShared;

    // 공유 시 학부모 연결 확인
    if (isShared && !existing.isShared) {
      const info = await getStudentWithParents(existing.studentId);
      if (!info || info.parentIds.length === 0) {
        return NextResponse.json({ error: "연결된 학부모가 없어 공유할 수 없습니다." }, { status: 400 });
      }
    }

    // 기존 미디어 삭제 후 재생성
    if (media !== undefined) {
      await prisma.activityMedia.deleteMany({ where: { activityId: id } });
      if (media.length > 0) {
        await prisma.activityMedia.createMany({
          data: media.map((m: { url: string; fileName: string; fileSize: number; type: string }, i: number) => ({
            activityId: id,
            type: m.type,
            url: m.url,
            fileName: m.fileName,
            fileSize: m.fileSize,
            sortOrder: i,
          })),
        });
      }
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        content: content || null,
        activityDate: activityDate ? new Date(activityDate) : undefined,
        isDraft: isDraft ?? existing.isDraft,
        isShared: isShared ?? existing.isShared,
        sharedAt: isShared && !existing.isShared ? new Date() : existing.sharedAt,
        isEdited: wasShared,
      },
      include: { media: true },
    });

    const shouldNotify = (wasShared && !isDraft) || (isShared && !wasShared);
    if (shouldNotify) {
      const info = await getStudentWithParents(existing.studentId);
      if (info) {
        const isNewShare = isShared && !wasShared;
        const notifTitle = isNewShare ? "새 활동이 공유되었습니다" : "활동 기록이 수정되었습니다";
        await notifyParents({
          parentIds: info.parentIds,
          type: "ACTIVITY",
          title: notifTitle,
          content: `${info.name}의 활동: ${title}`,
          linkUrl: `/parent/activities/${id}`,
          sms: notifySms
            ? { message: `[${info.name}] ${notifTitle}: ${title}` }
            : undefined,
        });
      }
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activity update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (_request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ message: "활동이 삭제되었습니다." });
  } catch (error) {
    console.error("Activity delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});
