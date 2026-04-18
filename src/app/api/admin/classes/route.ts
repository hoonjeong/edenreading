import { NextResponse } from "next/server";
import { ClassStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classDataFromBody } from "./_helpers";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ error: "수업명은 필수입니다." }, { status: 400 });
    }

    const existing = await prisma.class.findUnique({
      where: { name: body.name },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 등록된 수업명입니다." }, { status: 400 });
    }

    const created = await prisma.class.create({
      data: { ...classDataFromBody(body), status: body.status || ClassStatus.ACTIVE },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Class create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
