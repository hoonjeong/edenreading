import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

// GET /api/admin/messages/recipients?classIds=a,b,c
// 선택한 수강반의 학생 + 연결된 학부모를 반환
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("classIds") || "";
  const classIds = raw.split(",").map((s) => s.trim()).filter(Boolean);

  if (classIds.length === 0) {
    return NextResponse.json({ classes: [], students: [] });
  }

  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: {
      id: true,
      name: true,
      students: {
        select: {
          student: {
            select: {
              id: true,
              name: true,
              grade: true,
              studentPhone: true,
              parents: {
                select: {
                  parent: { select: { id: true, name: true, phone: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  type StudentRow = {
    classId: string;
    className: string;
    studentId: string;
    studentName: string;
    grade: string | null;
    studentPhone: string | null;
    parents: { parentId: string; name: string; phone: string }[];
  };

  const students: StudentRow[] = [];
  for (const cls of classes) {
    for (const cs of cls.students) {
      const s = cs.student;
      students.push({
        classId: cls.id,
        className: cls.name,
        studentId: s.id,
        studentName: s.name,
        grade: s.grade,
        studentPhone: s.studentPhone,
        parents: s.parents.map((ps) => ({
          parentId: ps.parent.id,
          name: ps.parent.name,
          phone: ps.parent.phone,
        })),
      });
    }
  }

  return NextResponse.json({
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
    students,
  });
});
