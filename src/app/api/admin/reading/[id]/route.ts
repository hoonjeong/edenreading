import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";
import { getStudentWithParents } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const PUT = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    const { bookTitle, bookAuthor, readDate, teacherNote, coverPhotoUrl, isShared, notifySms } = await request.json();

    const existing = await prisma.readingRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "독서 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    const record = await prisma.readingRecord.update({
      where: { id },
      data: {
        bookTitle,
        bookAuthor: bookAuthor || null,
        readDate: readDate ? new Date(readDate) : undefined,
        teacherNote: teacherNote || null,
        coverPhotoUrl: coverPhotoUrl || null,
        isShared: isShared ?? existing.isShared,
        sharedAt: isShared && !existing.isShared ? new Date() : existing.sharedAt,
      },
    });

    if (isShared && !existing.isShared) {
      const info = await getStudentWithParents(existing.studentId);
      if (info) {
        await notifyParents({
          parentIds: info.parentIds,
          type: "READING",
          title: "새 독서 기록이 공유되었습니다",
          content: `${info.name}의 독서: ${bookTitle}`,
          sms: notifySms
            ? { message: `[${info.name}] 새 독서 기록: ${bookTitle}` }
            : undefined,
        });
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Reading update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (_request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    await prisma.readingRecord.delete({ where: { id } });
    return NextResponse.json({ message: "독서 기록이 삭제되었습니다." });
  } catch (error) {
    console.error("Reading delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});
