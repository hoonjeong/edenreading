import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(
  async (request, { params }: IdCtx) => {
    const { id } = await params;

    await prisma.admin.update({
      where: { id },
      data: { isApproved: true },
    });

    return NextResponse.redirect(new URL("/admin/members", request.url));
  },
  { directorOnly: true }
);
