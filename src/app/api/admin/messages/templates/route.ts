import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const templates = await prisma.messageTemplate.findMany({
    where: { adminId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { title, content } = await request.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 모두 입력해주세요." }, { status: 400 });
  }

  const created = await prisma.messageTemplate.create({
    data: { adminId: session.user.id, title: title.trim(), content: content.trim() },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(created);
}
