import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

const DRAFT_TTL_DAYS = 7;

// BR-D02: 7일 이상 방치된 임시저장 활동 자동 삭제
// 인증된 관리자 또는 CRON_SECRET 헤더로 호출 가능 (스케줄러용)
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("x-cron-secret");
  const isCron = cronSecret && authHeader === cronSecret;

  if (!isCron) {
    const session = await auth();
    if (!session || session.user.userType !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000);

  const stale = await prisma.activity.findMany({
    where: { isDraft: true, updatedAt: { lt: cutoff } },
    select: { id: true },
  });

  if (stale.length === 0) {
    return NextResponse.json({ deleted: 0, cutoff: cutoff.toISOString() });
  }

  const result = await prisma.activity.deleteMany({
    where: { id: { in: stale.map((s) => s.id) } },
  });

  return NextResponse.json({ deleted: result.count, cutoff: cutoff.toISOString() });
}

// 미리 보기용: 삭제될 항목 수 조회
export const GET = requireAdmin(async () => {
  const cutoff = new Date(Date.now() - DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000);
  const count = await prisma.activity.count({
    where: { isDraft: true, updatedAt: { lt: cutoff } },
  });

  return NextResponse.json({ count, cutoff: cutoff.toISOString(), ttlDays: DRAFT_TTL_DAYS });
});
