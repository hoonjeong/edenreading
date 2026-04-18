import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessibleStudentIds } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async (request, _ctx, session) => {
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
});
