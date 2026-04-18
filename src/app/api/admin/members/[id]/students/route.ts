import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
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
}

// PUT: 담당 학생 전체 교체. body: { studentIds: string[] }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin" || session.user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "원장만 담당을 변경할 수 있습니다." }, { status: 403 });
  }

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
}
