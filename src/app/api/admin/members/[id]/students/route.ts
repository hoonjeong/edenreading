import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_request, { params }: IdCtx, session) => {
  // 본인 또는 DIRECTOR만 조회
  const { id } = await params;
  if (session.user.id !== id && session.user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const rows = await prisma.adminStudent.findMany({
    where: { adminId: id },
    select: {
      studentId: true,
      student: { select: { id: true, name: true, grade: true, school: true } },
    },
  });

  return NextResponse.json(rows.map((r) => r.student));
});

// PUT: 담당 학생 전체 교체. body: { studentIds: string[] }
export const PUT = requireAdmin(
  async (request, { params }: IdCtx) => {
    const { id } = await params;
    const { studentIds } = await request.json();
    if (!Array.isArray(studentIds)) {
      return NextResponse.json({ error: "studentIds 배열이 필요합니다." }, { status: 400 });
    }

    await prisma.adminStudent.deleteMany({ where: { adminId: id } });
    if (studentIds.length > 0) {
      await prisma.adminStudent.createMany({
        data: studentIds.map((studentId: string) => ({ adminId: id, studentId })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ count: studentIds.length });
  },
  { directorOnly: true }
);
