import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async (_request, _ctx, session) => {
  const templates = await prisma.messageTemplate.findMany({
    where: { adminId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(templates);
});

export const POST = requireAdmin(async (request, _ctx, session) => {
  const { title, content } = await request.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 모두 입력해주세요." }, { status: 400 });
  }

  const created = await prisma.messageTemplate.create({
    data: { adminId: session.user.id, title: title.trim(), content: content.trim() },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(created);
});
