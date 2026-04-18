import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleStudentIds } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const accessible = await getAccessibleStudentIds(session);
  // TEACHER: 본인이 출제했거나 담당 학생이 응시한 시험만
  const where =
    accessible === null
      ? {}
      : {
          OR: [
            { adminId: session.user.id },
            { examinees: { some: { studentId: { in: accessible } } } },
          ],
        };

  const exams = await prisma.examSession.findMany({
    where,
    include: { _count: { select: { questions: true, examinees: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const { name, grade, quarter, examDate, duration, objectiveCount, essayCount } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "시험명은 필수입니다." }, { status: 400 });
    }

    const totalQuestions = (objectiveCount || 0) + (essayCount || 0);

    const exam = await prisma.examSession.create({
      data: {
        name,
        adminId: session.user.id,
        grade: grade || null,
        quarter: quarter || null,
        examDate: examDate ? new Date(examDate) : null,
        duration: duration || null,
        objectiveCount: objectiveCount || 0,
        essayCount: essayCount || 0,
        // Auto-create questions
        questions: {
          create: [
            // Objective questions
            ...Array.from({ length: objectiveCount || 0 }, (_, i) => ({
              questionNo: i + 1,
              type: "OBJECTIVE" as const,
              points: 0,
            })),
            // Essay questions
            ...Array.from({ length: essayCount || 0 }, (_, i) => ({
              questionNo: (objectiveCount || 0) + i + 1,
              type: "ESSAY" as const,
              points: 0,
            })),
          ],
        },
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Exam create error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
