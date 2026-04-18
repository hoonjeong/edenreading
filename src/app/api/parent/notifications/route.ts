import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "parent") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
  });

  if (!parent) return NextResponse.json([]);

  const notifications = await prisma.notification.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}
