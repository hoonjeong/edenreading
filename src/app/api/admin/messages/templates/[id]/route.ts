import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;
  const { title, content } = await request.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 모두 입력해주세요." }, { status: 400 });
  }

  const tpl = await prisma.messageTemplate.findUnique({
    where: { id },
    select: { adminId: true },
  });
  if (!tpl || tpl.adminId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없거나 존재하지 않는 템플릿입니다." }, { status: 404 });
  }

  const updated = await prisma.messageTemplate.update({
    where: { id },
    data: { title: title.trim(), content: content.trim() },
  });
  return NextResponse.json(updated);
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
  const tpl = await prisma.messageTemplate.findUnique({
    where: { id },
    select: { adminId: true },
  });
  if (!tpl || tpl.adminId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없거나 존재하지 않는 템플릿입니다." }, { status: 404 });
  }

  await prisma.messageTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
