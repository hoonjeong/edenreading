import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { canAccessStudent } from "@/lib/access";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!(await canAccessStudent(session, id))) redirect("/admin/students");
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parents: { include: { parent: true } },
      activities: { orderBy: { activityDate: "desc" }, take: 10, include: { media: true } },
      attendances: { orderBy: { date: "desc" }, take: 30 },
      readingRecords: { orderBy: { readDate: "desc" }, take: 10 },
      examinees: {
        include: { examSession: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      consultations: { orderBy: { createdAt: "desc" }, take: 10, include: { parent: true } },
    },
  });

  if (!student) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
            {student.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-gray-500">{student.grade || "학년 미지정"}</p>
            {!student.isActive && <Badge variant="secondary">비활성</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/students/${id}/report`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            성장 리포트
          </Link>
          <Link href={`/admin/students/${id}/edit`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            정보 수정
          </Link>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">생년월일</p>
              <p>{student.birthDate ? new Date(student.birthDate).toLocaleDateString("ko-KR") : "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">연결된 학부모</p>
              {student.parents.length > 0
                ? student.parents.map((ps) => (
                    <p key={ps.id}>{ps.parent.name} ({ps.parent.phone})</p>
                  ))
                : <p className="text-gray-400">없음</p>}
            </div>
            {student.specialNotes && (
              <div className="col-span-2">
                <p className="text-gray-500">특이사항</p>
                <p>{student.specialNotes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">활동 기록 ({student.activities.length})</CardTitle>
          <Link href={`/admin/activities/new?studentId=${student.id}`} className="text-sm text-blue-600 hover:underline">
            + 새 활동
          </Link>
        </CardHeader>
        <CardContent>
          {student.activities.length === 0 ? (
            <p className="text-gray-400 text-sm">아직 등록된 활동이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {student.activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.activityDate).toLocaleDateString("ko-KR")}
                      {activity.media.length > 0 && ` · 미디어 ${activity.media.length}개`}
                    </p>
                  </div>
                  {activity.isShared ? (
                    <Badge variant="success">공유됨</Badge>
                  ) : activity.isDraft ? (
                    <Badge variant="secondary">임시저장</Badge>
                  ) : (
                    <Badge variant="warning">미공유</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 출석</CardTitle>
        </CardHeader>
        <CardContent>
          {student.attendances.length === 0 ? (
            <p className="text-gray-400 text-sm">출석 기록이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {student.attendances.map((att) => (
                <div
                  key={att.id}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    att.status === "PRESENT"
                      ? "bg-green-100 text-green-700"
                      : att.status === "TARDY"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {new Date(att.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  {att.status === "TARDY" ? " 지각" : att.status === "ABSENT" ? " 결석" : ""}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">시험 결과</CardTitle>
        </CardHeader>
        <CardContent>
          {student.examinees.length === 0 ? (
            <p className="text-gray-400 text-sm">시험 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {student.examinees.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{ex.examSession.name}</p>
                    <p className="text-xs text-gray-500">
                      {ex.examSession.examDate ? new Date(ex.examSession.examDate).toLocaleDateString("ko-KR") : "날짜 미정"}
                    </p>
                  </div>
                  <span className="font-bold text-lg">
                    {ex.totalScore !== null ? `${ex.totalScore}점` : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
