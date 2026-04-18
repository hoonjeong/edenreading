import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const PUT = requireAdmin(
  async (request, { params }: IdCtx, session) => {
    const { id } = await params;
    const { role, isApproved } = await request.json();

    // 자신의 권한 변경 불가
    if (id === session.user.id && role !== undefined) {
      return NextResponse.json({ error: "자신의 권한은 변경할 수 없습니다." }, { status: 400 });
    }

    try {
      const admin = await prisma.admin.update({
        where: { id },
        data: {
          ...(role !== undefined && { role }),
          ...(isApproved !== undefined && { isApproved }),
        },
      });

      return NextResponse.json(admin);
    } catch (error) {
      console.error("Admin update error:", error);
      return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
  },
  { directorOnly: true }
);

export const DELETE = requireAdmin(
  async (_request, { params }: IdCtx, session) => {
    const { id } = await params;

    // 자신 삭제 불가
    if (id === session.user.id) {
      return NextResponse.json({ error: "자신의 계정은 삭제할 수 없습니다." }, { status: 400 });
    }

    // 마지막 원장 삭제 불가
    const target = await prisma.admin.findUnique({ where: { id } });
    if (target?.role === "DIRECTOR") {
      const directorCount = await prisma.admin.count({ where: { role: "DIRECTOR" } });
      if (directorCount <= 1) {
        return NextResponse.json({ error: "마지막 원장은 삭제할 수 없습니다." }, { status: 400 });
      }
    }

    try {
      await prisma.admin.delete({ where: { id } });
      return NextResponse.json({ message: "관리자가 삭제되었습니다." });
    } catch (error) {
      console.error("Admin delete error:", error);
      return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
  },
  { directorOnly: true }
);
