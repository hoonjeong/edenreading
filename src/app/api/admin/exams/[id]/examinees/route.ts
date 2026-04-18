import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

type IdCtx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    const { studentIds } = await request.json();

    for (const studentId of studentIds) {
      const existing = await prisma.examinee.findUnique({
        where: { examSessionId_studentId: { examSessionId: id, studentId } },
      });
      if (!existing) {
        await prisma.examinee.create({
          data: { examSessionId: id, studentId },
        });
      }
    }

    return NextResponse.json({ message: "응시자가 추가되었습니다." });
  } catch (error) {
    return handleApiError(error, "Add examinees error");
  }
});
