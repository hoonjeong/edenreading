import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { SparkLine } from "@/components/ui/spark-line";

const subjectAreaLabels: Record<string, string> = {
  LISTENING_SPEAKING: "듣기말하기",
  VOCABULARY: "어휘",
  GRAMMAR: "문법",
  READING: "읽기",
  WRITING: "쓰기",
  LITERATURE: "문학",
  MEDIA: "매체",
};

export default async function ParentExamsPage() {
  const session = await auth();
  if (!session) return null;

  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    include: {
      children: {
        include: {
          student: {
            include: {
              examinees: {
                where: { isShared: true },
                include: {
                  examSession: true,
                  answers: {
                    include: { question: true },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const allExams = parent.children.flatMap(({ student }) =>
    student.examinees.map((ex) => ({ ...ex, studentName: student.name, studentId: student.id }))
  );

  // 학생별 회차 추이 (시험일 오름차순, 백분율 기준)
  const trendsByStudent = parent.children
    .map(({ student }) => {
      const sorted = [...student.examinees]
        .filter((e) => e.totalScore != null && e.examSession.totalScore > 0)
        .sort((a, b) => {
          const ad = a.examSession.examDate
            ? new Date(a.examSession.examDate).getTime()
            : new Date(a.createdAt).getTime();
          const bd = b.examSession.examDate
            ? new Date(b.examSession.examDate).getTime()
            : new Date(b.createdAt).getTime();
          return ad - bd;
        });
      const points = sorted.map((e) => ({
        label: e.examSession.examDate
          ? new Date(e.examSession.examDate).toLocaleDateString("ko-KR", {
              month: "numeric",
              day: "numeric",
            })
          : e.examSession.name.slice(0, 6),
        value: Math.round(((e.totalScore ?? 0) / e.examSession.totalScore) * 100),
      }));
      return { studentName: student.name, points };
    })
    .filter((s) => s.points.length >= 2);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">시험 결과</h2>

      {trendsByStudent.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-medium">회차 추이 (정답률 %)</h3>
            </div>
            {trendsByStudent.map((t) => (
              <div key={t.studentName} className="space-y-1">
                <p className="text-xs text-gray-500">{t.studentName}</p>
                <SparkLine points={t.points} max={100} unit="%" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {allExams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-2" />
            <p>공유된 시험 결과가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        allExams.map((exam) => {
          // 영역별 점수 계산
          const areaScores: Record<string, { score: number; total: number }> = {};
          exam.answers.forEach((a) => {
            const area = a.question.subjectArea;
            if (area) {
              if (!areaScores[area]) areaScores[area] = { score: 0, total: 0 };
              areaScores[area].score += a.score || 0;
              areaScores[area].total += a.question.points;
            }
          });

          // 응답 상세
          const totalAnswered = exam.answers.filter(a => a.isAnswered).length;
          const totalCorrect = exam.answers.filter(a => a.isCorrect === true).length;
          const totalQuestions = exam.answers.length;

          return (
            <Card key={exam.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      {exam.studentName}
                    </span>
                    <h3 className="font-medium mt-1">{exam.examSession.name}</h3>
                    <p className="text-sm text-gray-500">
                      {exam.examSession.examDate ? new Date(exam.examSession.examDate).toLocaleDateString("ko-KR") : ""}
                      {exam.examSession.quarter && ` · ${exam.examSession.quarter}분기`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{exam.totalScore ?? "-"}</p>
                    <p className="text-xs text-gray-500">/ {exam.examSession.totalScore}점</p>
                  </div>
                </div>

                {/* 정답률 */}
                {totalQuestions > 0 && (
                  <div className="text-xs text-gray-500">
                    응답 {totalAnswered}/{totalQuestions} · 정답 {totalCorrect}문항
                  </div>
                )}

                {/* 영역별 분석 */}
                {Object.keys(areaScores).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">영역별 분석</p>
                    {Object.entries(areaScores).map(([area, stat]) => {
                      const pct = stat.total > 0 ? Math.round((stat.score / stat.total) * 100) : 0;
                      return (
                        <div key={area} className="flex items-center gap-2">
                          <span className="text-xs w-16 text-right text-gray-600">{subjectAreaLabels[area] || area}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-16">{stat.score}/{stat.total} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 교사 코멘트 */}
                {exam.teacherComment && exam.commentType === "PARENT_VISIBLE" && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">선생님 코멘트</p>
                    <p className="text-sm">{exam.teacherComment}</p>
                  </div>
                )}

                {/* 상담 요청 */}
                <Link href="/parent/consultations" className="block text-center text-sm text-orange-600 hover:underline">
                  이 결과에 대해 상담 요청하기
                </Link>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
