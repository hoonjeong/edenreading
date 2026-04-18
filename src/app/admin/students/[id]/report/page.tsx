import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SparkLine } from "@/components/ui/spark-line";
import { auth } from "@/lib/auth";
import { canAccessStudent } from "@/lib/access";

const subjectAreaLabels: Record<string, string> = {
  LISTENING_SPEAKING: "듣기말하기",
  VOCABULARY: "어휘",
  GRAMMAR: "문법",
  READING: "읽기",
  WRITING: "쓰기",
  LITERATURE: "문학",
  MEDIA: "매체",
};

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!(await canAccessStudent(session, id))) redirect("/admin/students");

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      activities: { select: { id: true, isShared: true, activityDate: true } },
      readingRecords: { select: { id: true, readDate: true } },
      attendances: {
        select: { id: true, date: true, status: true },
        orderBy: { date: "desc" },
        take: 180, // 최근 6개월
      },
      examinees: {
        where: { totalScore: { not: null } },
        include: {
          examSession: { select: { name: true, examDate: true, totalScore: true } },
          answers: {
            select: {
              score: true,
              isCorrect: true,
              question: { select: { points: true, subjectArea: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!student) notFound();

  // 출결 통계 (월별)
  const monthly = new Map<
    string,
    { present: number; absent: number; tardy: number }
  >();
  for (const a of student.attendances) {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthly.get(key) || { present: 0, absent: 0, tardy: 0 };
    if (a.status === "PRESENT") cur.present++;
    else if (a.status === "ABSENT") cur.absent++;
    else if (a.status === "TARDY") cur.tardy++;
    monthly.set(key, cur);
  }
  const monthlyAttendance = Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  const totalAtt = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
  const tardyCount = student.attendances.filter((a) => a.status === "TARDY").length;
  const absentCount = student.attendances.filter((a) => a.status === "ABSENT").length;
  const presentRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

  // 시험 추이 (백분율)
  const examTrend = student.examinees
    .filter((ex) => ex.examSession.totalScore > 0)
    .map((ex) => ({
      label: ex.examSession.examDate
        ? new Date(ex.examSession.examDate).toLocaleDateString("ko-KR", {
            month: "numeric",
            day: "numeric",
          })
        : ex.examSession.name.slice(0, 6),
      value: Math.round(((ex.totalScore ?? 0) / ex.examSession.totalScore) * 100),
    }));

  // 영역별 누적 정답률 (전체 시험 합산)
  const areaAgg: Record<string, { score: number; total: number }> = {};
  for (const ex of student.examinees) {
    for (const a of ex.answers) {
      const area = a.question.subjectArea;
      if (!area) continue;
      if (!areaAgg[area]) areaAgg[area] = { score: 0, total: 0 };
      areaAgg[area].score += a.score ?? 0;
      areaAgg[area].total += a.question.points;
    }
  }
  const areaPct = Object.entries(areaAgg)
    .map(([area, v]) => ({
      area,
      pct: v.total > 0 ? Math.round((v.score / v.total) * 100) : 0,
      score: v.score,
      total: v.total,
    }))
    .sort((a, b) => b.pct - a.pct);

  const sharedActivityCount = student.activities.filter((a) => a.isShared).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{student.name} 성장 리포트</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {student.grade || "학년 미지정"}
            {student.school && ` · ${student.school}`}
          </p>
        </div>
        <Link
          href={`/admin/students/${id}`}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          상세로
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="공유된 활동" value={sharedActivityCount} unit="회" color="blue" />
        <SummaryCard label="독서 기록" value={student.readingRecords.length} unit="권" color="purple" />
        <SummaryCard label="응시 시험" value={student.examinees.length} unit="회" color="orange" />
        <SummaryCard label="출석률" value={presentRate} unit="%" color="green" />
      </div>

      {/* 시험 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">시험 정답률 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {examTrend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              채점 완료된 시험 기록이 없습니다.
            </p>
          ) : (
            <SparkLine points={examTrend} max={100} unit="%" />
          )}
        </CardContent>
      </Card>

      {/* 영역별 누적 정답률 */}
      {areaPct.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">영역별 누적 정답률</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {areaPct.map((a) => {
              const color =
                a.pct >= 70 ? "bg-green-500" : a.pct >= 40 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={a.area} className="flex items-center gap-3">
                  <span className="text-sm w-20 text-right text-gray-600">
                    {subjectAreaLabels[a.area] || a.area}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`${color} h-full rounded-full flex items-center justify-end pr-2`}
                      style={{ width: `${a.pct}%` }}
                    >
                      <span className="text-xs text-white font-medium">{a.pct}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-20 text-right">
                    {a.score}/{a.total}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 출결 월별 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">출결 통계 (최근 6개월)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyAttendance.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">출석 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <Badge variant="success">출석 {presentCount}</Badge>
                <Badge variant="warning">지각 {tardyCount}</Badge>
                <Badge variant="destructive">결석 {absentCount}</Badge>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2 text-gray-600">월</th>
                    <th className="text-center p-2 text-gray-600">출석</th>
                    <th className="text-center p-2 text-gray-600">지각</th>
                    <th className="text-center p-2 text-gray-600">결석</th>
                    <th className="text-right p-2 text-gray-600">출석률</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyAttendance.map(([month, s]) => {
                    const tot = s.present + s.absent + s.tardy;
                    const pct = tot > 0 ? Math.round((s.present / tot) * 100) : 0;
                    return (
                      <tr key={month}>
                        <td className="p-2 font-medium">{month}</td>
                        <td className="p-2 text-center text-green-700">{s.present}</td>
                        <td className="p-2 text-center text-yellow-700">{s.tardy}</td>
                        <td className="p-2 text-center text-red-700">{s.absent}</td>
                        <td className="p-2 text-right">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className={`${colors[color]} p-4 rounded-xl text-center`}>
      <p className="text-2xl font-bold">
        {value}
        <span className="text-sm ml-0.5">{unit}</span>
      </p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}
