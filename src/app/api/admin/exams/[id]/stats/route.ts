import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

// 문항별 정답률, 영역별 평균 정답률 등 시험 통계
export const GET = requireAdmin(async (_request, { params }: IdCtx) => {
  const { id } = await params;

  const [questions, answers, examineeCount] = await Promise.all([
    prisma.question.findMany({
      where: { examSessionId: id },
      select: {
        id: true,
        questionNo: true,
        type: true,
        points: true,
        subjectArea: true,
      },
      orderBy: { questionNo: "asc" },
    }),
    prisma.studentAnswer.findMany({
      where: {
        examinee: { examSessionId: id, isAbsent: false },
      },
      select: { questionId: true, isCorrect: true, isAnswered: true, score: true },
    }),
    prisma.examinee.count({
      where: { examSessionId: id, isAbsent: false },
    }),
  ]);

  type QStat = {
    questionId: string;
    questionNo: number;
    type: string;
    points: number;
    subjectArea: string | null;
    answered: number;
    correct: number;
    avgScore: number;
    correctRate: number; // 0~100, OBJECTIVE만 의미
    avgScoreRate: number; // 0~100, ESSAY 포함 평균 점수율
  };

  const byQ = new Map<string, { answered: number; correct: number; sumScore: number }>();
  for (const a of answers) {
    const cur = byQ.get(a.questionId) || { answered: 0, correct: 0, sumScore: 0 };
    if (a.isAnswered) cur.answered++;
    if (a.isCorrect === true) cur.correct++;
    cur.sumScore += a.score ?? 0;
    byQ.set(a.questionId, cur);
  }

  const stats: QStat[] = questions.map((q) => {
    const cur = byQ.get(q.id) || { answered: 0, correct: 0, sumScore: 0 };
    const avgScore = examineeCount > 0 ? cur.sumScore / examineeCount : 0;
    return {
      questionId: q.id,
      questionNo: q.questionNo,
      type: q.type,
      points: q.points,
      subjectArea: q.subjectArea,
      answered: cur.answered,
      correct: cur.correct,
      avgScore: Math.round(avgScore * 10) / 10,
      correctRate: examineeCount > 0 ? Math.round((cur.correct / examineeCount) * 100) : 0,
      avgScoreRate: q.points > 0 ? Math.round((avgScore / q.points) * 100) : 0,
    };
  });

  // 영역별 평균 정답률 (점수 기준)
  const byArea = new Map<string, { totalPoints: number; totalScore: number; count: number }>();
  for (const s of stats) {
    if (!s.subjectArea) continue;
    const cur = byArea.get(s.subjectArea) || { totalPoints: 0, totalScore: 0, count: 0 };
    cur.totalPoints += s.points * examineeCount;
    cur.totalScore += s.avgScore * examineeCount;
    cur.count++;
    byArea.set(s.subjectArea, cur);
  }
  const areaAverages = Array.from(byArea.entries()).map(([area, v]) => ({
    subjectArea: area,
    avgRate: v.totalPoints > 0 ? Math.round((v.totalScore / v.totalPoints) * 100) : 0,
    questionCount: v.count,
  }));

  return NextResponse.json({
    examineeCount,
    questions: stats,
    areaAverages,
  });
});
