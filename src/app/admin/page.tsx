import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, UserPlus, BookOpen, Calendar } from "lucide-react";
import Link from "next/link";
import { StudentSearch } from "@/components/admin/student-search";

export default async function AdminDashboard() {
  const session = await auth();

  const [studentCount, parentCount, activityCount, todayAttendance] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.parent.count(),
    prisma.activity.count({ where: { isDraft: false } }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().toISOString().split("T")[0]),
          lt: new Date(new Date(Date.now() + 86400000).toISOString().split("T")[0]),
        },
      },
    }),
  ]);

  const recentActivities = await prisma.activity.findMany({
    where: { isDraft: false },
    include: { student: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingConsultations = await prisma.consultation.count({
    where: { status: "REQUESTED" },
  });

  const stats = [
    { label: "등록 학생", value: studentCount, icon: GraduationCap, href: "/admin/students", color: "text-blue-600 bg-blue-100" },
    { label: "학부모", value: parentCount, icon: UserPlus, href: "/admin/parents", color: "text-green-600 bg-green-100" },
    { label: "공유된 활동", value: activityCount, icon: BookOpen, href: "/admin/activities", color: "text-purple-600 bg-purple-100" },
    { label: "오늘 출석", value: todayAttendance, icon: Calendar, href: "/admin/attendance", color: "text-orange-600 bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-gray-500 mt-1">안녕하세요, {session?.user.name}님!</p>
      </div>

      {/* Onboarding */}
      {studentCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-800 mb-2">시작하기</h3>
          <p className="text-sm text-blue-700 mb-4">이든국어독서교육원에 오신 것을 환영합니다! 아래 순서대로 설정해보세요.</p>
          <div className="space-y-2">
            <Link href="/admin/students/new" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow">
              <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm font-medium">학생을 먼저 등록하세요</span>
            </Link>
            <Link href="/admin/parents/new" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow">
              <span className="bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm font-medium">학부모를 등록하고 인증코드를 전달하세요</span>
            </Link>
            <Link href="/admin/activities/new" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow">
              <span className="bg-blue-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm font-medium">첫 활동 기록을 작성하세요</span>
            </Link>
          </div>
        </div>
      )}

      {/* Student Search */}
      <StudentSearch />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 활동 기록</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-2" />
                <p>아직 등록된 활동이 없습니다.</p>
                <Link href="/admin/activities/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                  첫 활동 기록하기
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.student.name} · {new Date(activity.activityDate).toLocaleDateString("ko-KR")}</p>
                    </div>
                    {activity.isShared ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">공유됨</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">미공유</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">빠른 메뉴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "학생 등록", href: "/admin/students/new", color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
                { label: "학부모 등록", href: "/admin/parents/new", color: "bg-green-50 hover:bg-green-100 text-green-700" },
                { label: "활동 기록", href: "/admin/activities/new", color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
                { label: "출석 체크", href: "/admin/attendance", color: "bg-orange-50 hover:bg-orange-100 text-orange-700" },
                { label: "시험 관리", href: "/admin/exams", color: "bg-red-50 hover:bg-red-100 text-red-700" },
                { label: "독서 기록", href: "/admin/reading/new", color: "bg-teal-50 hover:bg-teal-100 text-teal-700" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`p-4 rounded-lg text-center font-medium text-sm transition-colors ${action.color}`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
            {pendingConsultations > 0 && (
              <Link href="/admin/consultations" className="mt-4 block p-3 bg-red-50 rounded-lg text-sm text-red-700">
                대기 중인 상담 요청 {pendingConsultations}건
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
