import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin" || session.user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "원장만 수정할 수 있습니다." }, { status: 403 });
  }

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
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin" || session.user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "원장만 삭제할 수 있습니다." }, { status: 403 });
  }

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
}
