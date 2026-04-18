import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const PUT = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    const { questions } = await request.json();

    const existing = await prisma.question.findMany({
      where: { examSessionId: id },
      select: { id: true, answer: true, points: true, type: true },
    });
    const existingMap = new Map(existing.map((q) => [q.id, q]));

    // 객관식 정답/배점이 변경된 문항 ids
    const changedObjectiveIds: string[] = [];
    for (const q of questions) {
      const before = existingMap.get(q.id);
      if (!before) continue;
      const isObjective = before.type === "OBJECTIVE";
      const answerChanged = (before.answer || "") !== (q.answer || "");
      const pointsChanged = before.points !== (q.points || 0);
      if (isObjective && (answerChanged || pointsChanged)) changedObjectiveIds.push(q.id);
    }

    for (const q of questions) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          points: q.points || 0,
          answer: q.answer || null,
          subjectArea: q.subjectArea || null,
          readingLevel: q.readingLevel || null,
          description: q.description || null,
          solution: q.solution || null,
          analysis: q.analysis || null,
          teacherTip: q.teacherTip || null,
        },
      });
    }

    const totalScore = questions.reduce(
      (sum: number, q: { points: number }) => sum + (q.points || 0),
      0
    );
    await prisma.examSession.update({ where: { id }, data: { totalScore } });

    // BR-E06: 객관식 정답/배점 변경 시 자동 재채점 + 공유된 학부모 알림
    if (changedObjectiveIds.length === 0) {
      return NextResponse.json({ message: "문항이 저장되었습니다." });
    }

    const updatedQuestions = await prisma.question.findMany({
      where: { id: { in: changedObjectiveIds } },
      select: { id: true, answer: true, points: true },
    });
    const qMap = new Map(updatedQuestions.map((q) => [q.id, q]));

    const affectedAnswers = await prisma.studentAnswer.findMany({
      where: { questionId: { in: changedObjectiveIds } },
      select: { id: true, answer: true, examineeId: true, questionId: true },
    });

    const affectedExamineeIds = new Set<string>();
    for (const sa of affectedAnswers) {
      const q = qMap.get(sa.questionId);
      if (!q) continue;
      const isCorrect = !!sa.answer && sa.answer.trim() === (q.answer || "").trim();
      const score = isCorrect ? q.points : 0;
      await prisma.studentAnswer.update({
        where: { id: sa.id },
        data: { isCorrect, score },
      });
      affectedExamineeIds.add(sa.examineeId);
    }

    // 영향받은 응시자별 totalScore 재계산 + 알림
    let notifiedCount = 0;
    for (const examineeId of affectedExamineeIds) {
      const sumRow = await prisma.studentAnswer.aggregate({
        where: { examineeId },
        _sum: { score: true },
      });
      const newTotal = sumRow._sum.score ?? 0;
      const examinee = await prisma.examinee.update({
        where: { id: examineeId },
        data: { totalScore: newTotal },
        select: {
          isShared: true,
          student: {
            select: { name: true, parents: { select: { parentId: true } } },
          },
        },
      });
      if (examinee.isShared) {
        const exam = await prisma.examSession.findUnique({
          where: { id },
          select: { name: true },
        });
        await notifyParents({
          parentIds: examinee.student.parents.map((p) => p.parentId),
          type: "EXAM",
          title: "시험 리포트가 갱신되었습니다",
          content: `${examinee.student.name}의 ${exam?.name} 정답이 수정되어 점수가 갱신되었습니다.`,
          linkUrl: `/parent/exams`,
        });
        notifiedCount++;
      }
    }

    return NextResponse.json({
      message: "문항이 저장되었습니다.",
      rescored: affectedAnswers.length,
      examineesAffected: affectedExamineeIds.size,
      parentsNotified: notifiedCount,
    });
  } catch (error) {
    console.error("Questions update error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});
