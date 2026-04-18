import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

const statusMap = {
  WRITING: { label: "작성중", color: "warning" as const },
  TESTING: { label: "시험중", color: "default" as const },
  GRADING: { label: "채점중", color: "secondary" as const },
  SHARED: { label: "공유됨", color: "success" as const },
};

export default async function ExamsPage() {
  const exams = await prisma.examSession.findMany({
    include: {
      _count: { select: { questions: true, examinees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시험 관리</h1>
          <p className="text-gray-500 mt-1">총 {exams.length}개</p>
        </div>
        <Link href="/admin/exams/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 시험
          </Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <p>등록된 시험이 없습니다.</p>
            <Link href="/admin/exams/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              첫 시험 만들기
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const s = statusMap[exam.status];
            return (
              <Link key={exam.id} href={`/admin/exams/${exam.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{exam.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {exam.grade && `${exam.grade} · `}
                          {exam.quarter && `${exam.quarter}분기 · `}
                          {exam.examDate ? new Date(exam.examDate).toLocaleDateString("ko-KR") : "날짜 미정"}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          문항 {exam._count.questions}개 · 응시자 {exam._count.examinees}명 · {exam.totalScore}점
                        </p>
                      </div>
                      <Badge variant={s.color}>{s.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
