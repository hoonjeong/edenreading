import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleStudentIds } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const accessibleIds = await getAccessibleStudentIds(session);
  const where = accessibleIds === null ? {} : { id: { in: accessibleIds } };

  const students = await prisma.student.findMany({
    where,
    include: { parents: { include: { parent: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { name, grade, school, birthDate, specialNotes, parentIds, classIds } =
      await request.json();

    if (!name) {
      return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        name,
        grade: grade || null,
        school: school || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        specialNotes: specialNotes || null,
        parents: parentIds?.length
          ? { create: parentIds.map((parentId: string) => ({ parentId })) }
          : undefined,
        classStudents: Array.isArray(classIds) && classIds.length
          ? { create: classIds.map((classId: string) => ({ classId })) }
          : undefined,
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Student create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
