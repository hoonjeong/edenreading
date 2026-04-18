import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessStudent } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

type IdCtx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_request, { params }: IdCtx, session) => {
  const { id } = await params;
  if (!(await canAccessStudent(session, id))) {
    return NextResponse.json({ error: "담당 학생이 아닙니다." }, { status: 403 });
  }
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parents: { include: { parent: true } },
      classStudents: { select: { classId: true } },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(student);
});

export const PUT = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    const body = await request.json();
    const {
      name,
      grade,
      school,
      birthDate,
      specialNotes,
      photoUrl,
      isActive,
      isOnLeave,
      leaveReason,
      withdrawDate,
      withdrawReason,
      parentIds,
      classIds,
    } = body;

    // 퇴원시 자동으로 isActive=false
    const willBeActive = withdrawDate ? false : (isActive ?? true);

    const student = await prisma.student.update({
      where: { id },
      data: {
        name,
        grade: grade || null,
        school: school ?? undefined,
        birthDate: birthDate ? new Date(birthDate) : null,
        specialNotes: specialNotes || null,
        photoUrl: photoUrl || null,
        isActive: willBeActive,
        isOnLeave: isOnLeave ?? false,
        leaveReason: isOnLeave ? leaveReason || null : null,
        withdrawDate: withdrawDate ? new Date(withdrawDate) : null,
        withdrawReason: withdrawDate ? withdrawReason || null : null,
      },
    });

    if (parentIds !== undefined) {
      await prisma.parentStudent.deleteMany({ where: { studentId: id } });
      if (parentIds.length > 0) {
        await prisma.parentStudent.createMany({
          data: parentIds.map((parentId: string) => ({ parentId, studentId: id })),
        });
      }
    }

    if (classIds !== undefined) {
      await prisma.classStudent.deleteMany({ where: { studentId: id } });
      if (Array.isArray(classIds) && classIds.length > 0) {
        await prisma.classStudent.createMany({
          data: classIds.map((classId: string) => ({ classId, studentId: id })),
        });
      }
    }

    return NextResponse.json(student);
  } catch (error) {
    return handleApiError(error, "Student update error");
  }
});

export const DELETE = requireAdmin(async (_request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ message: "학생이 삭제되었습니다." });
  } catch (error) {
    return handleApiError(error, "Student delete error");
  }
});
