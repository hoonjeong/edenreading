import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessibleStudentIds } from "@/lib/access";
import { requireAdmin } from "@/lib/route-middleware";
import { handleApiError } from "@/lib/errors";

export const GET = requireAdmin(async (_request, _ctx, session) => {
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
});

export const POST = requireAdmin(async (request, _ctx, session) => {
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
    return handleApiError(error, "Exam create error");
  }
});
