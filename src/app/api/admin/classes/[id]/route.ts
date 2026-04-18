import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classDataFromBody } from "../_helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      students: {
        include: { student: { select: { id: true, name: true, grade: true } } },
        orderBy: { enrolledAt: "asc" },
      },
    },
  });

  if (!cls) {
    return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(cls);
}

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
    const body = await request.json();
    const { studentIds, ...classBody } = body;

    if (classBody.name) {
      const dup = await prisma.class.findFirst({
        where: { name: classBody.name, NOT: { id } },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ error: "이미 사용 중인 수업명입니다." }, { status: 400 });
      }
    }

    const updated = await prisma.class.update({
      where: { id },
      data: classDataFromBody(classBody),
    });

    if (Array.isArray(studentIds)) {
      await prisma.classStudent.deleteMany({ where: { classId: id } });
      if (studentIds.length > 0) {
        await prisma.classStudent.createMany({
          data: studentIds.map((studentId: string) => ({ classId: id, studentId })),
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Class update error:", error);
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
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ message: "수업이 삭제되었습니다." });
  } catch (error) {
    console.error("Class delete error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
