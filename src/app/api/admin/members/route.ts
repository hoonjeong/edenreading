import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

export const GET = requireAdmin(async () => {
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isApproved: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(admins);
});
