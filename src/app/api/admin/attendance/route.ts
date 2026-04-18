import { NextResponse } from "next/server";
import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessibleStudentIds, studentScopeWhere } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

type AttendanceRecord = { studentId: string; status: AttendanceStatus };

export const GET = requireAdmin(async (request, _ctx, session) => {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "날짜가 필요합니다." }, { status: 400 });
  }

  const accessible = await getAccessibleStudentIds(session);
  const attendances = await prisma.attendance.findMany({
    where: { date: new Date(date), ...studentScopeWhere(accessible) },
    include: { student: true },
  });

  return NextResponse.json(attendances);
});

export const POST = requireAdmin(async (request, _ctx, session) => {
  try {
    const { date, records } = (await request.json()) as {
      date?: string;
      records?: AttendanceRecord[];
    };

    if (!date || !records?.length) {
      return NextResponse.json({ error: "날짜와 출석 기록이 필요합니다." }, { status: 400 });
    }

    const attendanceDate = new Date(date);

    // 접근 권한 필터링을 한 번에 처리
    const accessible = await getAccessibleStudentIds(session);
    const accessibleSet = accessible === null ? null : new Set(accessible);
    const allowed = records.filter(
      (r) => accessibleSet === null || accessibleSet.has(r.studentId)
    );

    // 병렬 upsert
    await Promise.all(
      allowed.map((r) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: attendanceDate } },
          update: { status: r.status, adminId: session.user.id },
          create: {
            studentId: r.studentId,
            adminId: session.user.id,
            date: attendanceDate,
            status: r.status,
          },
        })
      )
    );

    // 결석/지각 학생만 한 번에 조회해 알림 일괄 생성
    const alerting = allowed.filter(
      (r) => r.status === AttendanceStatus.ABSENT || r.status === AttendanceStatus.TARDY
    );
    if (alerting.length > 0) {
      const students = await prisma.student.findMany({
        where: { id: { in: alerting.map((r) => r.studentId) } },
        select: {
          id: true,
          name: true,
          parents: { select: { parentId: true } },
        },
      });
      const byId = new Map(students.map((s) => [s.id, s]));
      const dateStr = attendanceDate.toLocaleDateString("ko-KR");

      const notifications = alerting.flatMap((r) => {
        const s = byId.get(r.studentId);
        if (!s) return [];
        const isAbsent = r.status === AttendanceStatus.ABSENT;
        return s.parents.map((ps) => ({
          parentId: ps.parentId,
          type: "ATTENDANCE" as const,
          title: isAbsent ? "결석 알림" : "지각 알림",
          content: `${s.name} 학생이 ${dateStr}에 ${isAbsent ? "결석" : "지각"}하였습니다.`,
        }));
      });

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return NextResponse.json({ message: "출석 기록이 저장되었습니다." });
  } catch (error) {
    return handleApiError(error, "Attendance error");
  }
});
