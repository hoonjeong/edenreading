import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const PUT = requireAdmin(async (request, { params }: IdCtx, session) => {
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
});

export const DELETE = requireAdmin(async (_request, { params }: IdCtx, session) => {
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
});
