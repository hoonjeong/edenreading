import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

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
      const parentLinks = await prisma.parentStudent.findMany({
        where: { studentId: existing.studentId },
        select: { parentId: true },
      });
      const student = await prisma.student.findUnique({
        where: { id: existing.studentId },
        select: { name: true },
      });
      await notifyParents({
        parentIds: parentLinks.map((l) => l.parentId),
        type: "READING",
        title: "새 독서 기록이 공유되었습니다",
        content: `${student?.name}의 독서: ${bookTitle}`,
        sms: notifySms
          ? { message: `[${student?.name}] 새 독서 기록: ${bookTitle}` }
          : undefined,
      });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Reading update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.readingRecord.delete({ where: { id } });
    return NextResponse.json({ message: "독서 기록이 삭제되었습니다." });
  } catch (error) {
    console.error("Reading delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
