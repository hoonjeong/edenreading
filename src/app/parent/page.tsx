import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, ClipboardCheck, Calendar, MessageSquare } from "lucide-react";

export default async function ParentHome() {
  const session = await auth();
  if (!session) return null;

  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    include: {
      children: {
        include: {
          student: {
            include: {
              activities: {
                where: { isShared: true },
                orderBy: { activityDate: "desc" },
                take: 3,
                include: { media: { take: 1 } },
              },
            },
          },
        },
      },
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!parent) return null;

  const unreadCount = parent.notifications.length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">안녕하세요, {parent.name}님!</h2>
        {unreadCount > 0 && (
          <Link href="/parent/notifications" className="text-sm text-orange-600">
            새 알림 {unreadCount}개
          </Link>
        )}
      </div>

      {/* Children Cards */}
      {parent.children.map(({ student }) => (
        <Card key={student.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                {student.name[0]}
              </div>
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-500">{student.grade || ""}</p>
              </div>
            </div>

            {/* Recent activities */}
            {student.activities.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">최근 활동</p>
                {student.activities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/parent/activities/${activity.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.activityDate).toLocaleDateString("ko-KR")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">아직 공유된 활동이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {parent.children.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            <p>연결된 자녀가 없습니다.</p>
            <p className="text-sm mt-1">교육원에 문의해주세요.</p>
          </CardContent>
        </Card>
      )}

      {/* Quick menu */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "활동", href: "/parent/activities", color: "bg-purple-50 text-purple-600" },
          { icon: ClipboardCheck, label: "시험", href: "/parent/exams", color: "bg-blue-50 text-blue-600" },
          { icon: Calendar, label: "출석", href: "/parent/attendance", color: "bg-green-50 text-green-600" },
          { icon: MessageSquare, label: "상담", href: "/parent/consultations", color: "bg-red-50 text-red-600" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg ${item.color}`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
