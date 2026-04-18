import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";
import {
  canAccessStudent,
  getAccessibleStudentIds,
  getStudentWithParents,
  studentScopeWhere,
} from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async (_request, _ctx, session) => {
  const accessible = await getAccessibleStudentIds(session);
  const activities = await prisma.activity.findMany({
    where: studentScopeWhere(accessible),
    include: {
      student: true,
      admin: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(activities);
});

export const POST = requireAdmin(async (request, _ctx, session) => {
  try {
    const { studentId, title, content, activityDate, isDraft, isShared, media, notifySms } =
      await request.json();

    if (!studentId || !title) {
      return NextResponse.json({ error: "학생과 제목은 필수입니다." }, { status: 400 });
    }

    if (!(await canAccessStudent(session, studentId))) {
      return NextResponse.json({ error: "담당 학생이 아닙니다." }, { status: 403 });
    }

    // 공유 시 학부모 연결 여부 확인
    let sharedStudent: { name: string; parentIds: string[] } | null = null;
    if (isShared) {
      sharedStudent = await getStudentWithParents(studentId);
      if (!sharedStudent || sharedStudent.parentIds.length === 0) {
        return NextResponse.json({ error: "연결된 학부모가 없어 공유할 수 없습니다." }, { status: 400 });
      }
    }

    const activity = await prisma.activity.create({
      data: {
        studentId,
        adminId: session.user.id,
        title,
        content: content || null,
        activityDate: activityDate ? new Date(activityDate) : new Date(),
        isDraft: isDraft ?? true,
        isShared: isShared ?? false,
        sharedAt: isShared ? new Date() : null,
        media: media?.length
          ? {
              create: media.map((m: { url: string; fileName: string; fileSize: number; type: string }, i: number) => ({
                type: m.type,
                url: m.url,
                fileName: m.fileName,
                fileSize: m.fileSize,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { media: true },
    });

    if (isShared && sharedStudent) {
      await notifyParents({
        parentIds: sharedStudent.parentIds,
        type: "ACTIVITY",
        title: "새 활동이 공유되었습니다",
        content: `${sharedStudent.name}의 활동: ${title}`,
        linkUrl: `/parent/activities/${activity.id}`,
        sms: notifySms
          ? { message: `[${sharedStudent.name}] 새 활동이 공유되었습니다: ${title}` }
          : undefined,
      });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activity create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});
