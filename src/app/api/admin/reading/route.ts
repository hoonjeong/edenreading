import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";
import { canAccessStudent, getStudentWithParents } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";

export const POST = requireAdmin(async (request, _ctx, session) => {
  try {
    const { studentId, bookTitle, bookAuthor, readDate, teacherNote, coverPhotoUrl, photos, isShared, notifySms } = await request.json();

    if (!studentId || !bookTitle || !readDate) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }
    if (!(await canAccessStudent(session, studentId))) {
      return NextResponse.json({ error: "담당 학생이 아닙니다." }, { status: 403 });
    }

    const record = await prisma.readingRecord.create({
      data: {
        studentId,
        adminId: session.user.id,
        bookTitle,
        bookAuthor: bookAuthor || null,
        readDate: new Date(readDate),
        teacherNote: teacherNote || null,
        coverPhotoUrl: coverPhotoUrl || null,
        isShared: isShared ?? false,
        sharedAt: isShared ? new Date() : null,
        photos: photos?.length ? {
          create: photos.map((url: string, i: number) => ({ url, sortOrder: i })),
        } : undefined,
      },
    });

    if (isShared) {
      const info = await getStudentWithParents(studentId);
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
    console.error("Reading create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});
