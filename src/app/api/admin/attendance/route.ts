import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessStudent, getAccessibleStudentIds, studentScopeWhere } from "@/lib/access";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

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
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { date, records } = await request.json();

    if (!date || !records?.length) {
      return NextResponse.json({ error: "날짜와 출석 기록이 필요합니다." }, { status: 400 });
    }

    const attendanceDate = new Date(date);

    for (const record of records) {
      if (!(await canAccessStudent(session, record.studentId))) continue;
      await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: attendanceDate,
          },
        },
        update: {
          status: record.status,
          adminId: session.user.id,
        },
        create: {
          studentId: record.studentId,
          adminId: session.user.id,
          date: attendanceDate,
          status: record.status,
        },
      });

      // 결석/지각 시 학부모 알림
      if (record.status === "ABSENT" || record.status === "TARDY") {
        const student = await prisma.student.findUnique({
          where: { id: record.studentId },
          include: { parents: true },
        });

        if (student) {
          for (const ps of student.parents) {
            await prisma.notification.create({
              data: {
                parentId: ps.parentId,
                type: "ATTENDANCE",
                title: record.status === "ABSENT" ? "결석 알림" : "지각 알림",
                content: `${student.name} 학생이 ${new Date(date).toLocaleDateString("ko-KR")}에 ${record.status === "ABSENT" ? "결석" : "지각"}하였습니다.`,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ message: "출석 기록이 저장되었습니다." });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
