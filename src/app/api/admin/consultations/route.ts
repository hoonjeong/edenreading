import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const consultations = await prisma.consultation.findMany({
    include: { parent: true, student: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(consultations);
}
