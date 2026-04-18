import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleStudentIds } from "@/lib/access";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);

  const accessible = await getAccessibleStudentIds(session);

  const students = await prisma.student.findMany({
    where: {
      name: { contains: q },
      ...(accessible === null ? {} : { id: { in: accessible } }),
    },
    select: { id: true, name: true, grade: true },
    take: 10,
  });

  return NextResponse.json(students);
}
