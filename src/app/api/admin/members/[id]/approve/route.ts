import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin" || session.user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "원장만 승인할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;

  await prisma.admin.update({
    where: { id },
    data: { isApproved: true },
  });

  return NextResponse.redirect(new URL("/admin/members", request.url));
}
